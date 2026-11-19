import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT) || 3000;
const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

app.disable('x-powered-by');

app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', service: 'blocksmith-web' });
});

// The desktop application is distributed separately from the Railway web app.
// Serve the release metadata only; never execute Electron or expose local MCP.
app.get('/api/desktop/release', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const manifest = await readFile(join(dist, 'blocksmith-desktop-release.json'), 'utf8');
    res.type('application/json').send(manifest);
  } catch (error) {
    console.error('Desktop release manifest unavailable:', error?.message ?? error);
    res.status(503).json({ error: 'Desktop release metadata unavailable' });
  }
});


const AI_HOSTS=Object.freeze({
  openai:'https://api.openai.com/v1',
  deepseek:'https://api.deepseek.com',
  openrouter:'https://openrouter.ai/api/v1',
  nightrouter:'https://api.nightrouter.ai/v1',
  radox:'https://radoxai.com/v1',
  anthropic:'https://api.anthropic.com/v1'
});
const aiQuota=new Map();
app.use('/api/ai',express.json({limit:'120kb'}));
app.use('/api/ai',(req,res,next)=>{
  res.set('Cache-Control','no-store');
  const ip=req.ip||'unknown',now=Date.now(),old=aiQuota.get(ip);
  const q=old&&now-old.since<60000?old:{since:now,count:0};
  q.count++;aiQuota.set(ip,q);
  if(aiQuota.size>4000)for(const [id,v] of aiQuota)if(now-v.since>60000)aiQuota.delete(id);
  if(q.count>40)return res.status(429).json({error:'Muitas requisições. Tente novamente mais tarde.'});
  next();
});
function aiConfig(req,res){
  const data=req.body;
  if(!data||typeof data!=='object'||!Object.hasOwn(AI_HOSTS,data.provider)){
    res.status(400).json({error:'Provedor predefinido inválido.'});return null;
  }
  const key=req.get('x-blocksmith-provider-key');
  if(!key||key.length>4096||/[\r\n]/.test(key)){
    res.status(400).json({error:'Informe uma API key válida.'});return null;
  }
  return {data,key,base:AI_HOSTS[data.provider]};
}
function validModel(s){return typeof s==='string'&&s.length>0&&s.length<=256&&!/[\r\n]/.test(s);}
async function readAiResponse(response){
  const reader=response.body?.getReader();if(!reader)throw Error('empty');
  const chunks=[];let count=0;
  try{
    while(true){
      const x=await reader.read();if(x.done)break;
      count+=x.value.length;if(count>1000000)throw Error('too large');
      chunks.push(Buffer.from(x.value));
    }
  }finally{await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function requestAi(cfg,path,body){
  const anthropic=cfg.data.provider==='anthropic';
  const headers=anthropic
    ?{'x-api-key':cfg.key,'anthropic-version':'2023-06-01','content-type':'application/json'}
    :{'Authorization':'Bearer '+cfg.key,'content-type':'application/json'};
  if(cfg.data.provider==='openrouter'){
    headers['HTTP-Referer']='https://blocksmith-italo.up.railway.app';
    headers['X-Title']='Blocksmith Studio Web';
  }
  return fetch(cfg.base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(40000)});
}
function upstreamProblem(res,resp){
  const code=resp.status;
  return res.status([401,403,429].includes(code)?code:502).json({error:'Provedor retornou HTTP '+code+'. Verifique chave, modelo e permissões.'});
}
app.post('/api/ai/models',async(req,res)=>{
  const cfg=aiConfig(req,res);if(!cfg)return;
  try{
    const resp=await requestAi(cfg,'/models');
    if(!resp.ok)return upstreamProblem(res,resp);
    const data=await readAiResponse(resp),rows=Array.isArray(data.data)?data.data:Array.isArray(data.models)?data.models:[];
    return res.json({models:rows.map(r=>typeof r==='string'?r:r?.id).filter(validModel).slice(0,1500)});
  }catch{return res.status(502).json({error:'Falha ao consultar modelos do provedor.'});}
});
app.post('/api/ai/chat',async(req,res)=>{
  const cfg=aiConfig(req,res);if(!cfg)return;
  const d=cfg.data,model=d.model,history=d.messages;
  if(!validModel(model)||!Array.isArray(history)||history.length>40||!history.length)
    return res.status(400).json({error:'Modelo ou histórico inválido.'});
  if(history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>12000)||history.at(-1).role!=='user')
    return res.status(400).json({error:'Mensagens inválidas.'});
  const system=typeof d.system==='string'?d.system.slice(0,4000):'';
  const mode=d.provider==='anthropic'?'anthropic':d.apiType||'chat';
  let path,payload;
  if(mode==='anthropic'){
    if(d.provider!=='anthropic')return res.status(400).json({error:'Formato Anthropic exige provedor Anthropic.'});
    path='/messages';payload={model,max_tokens:2048,messages:history,...(system?{system}:{})};
  }else if(mode==='responses'){
    path='/responses';payload={model,input:[...(system?[{role:'developer',content:system}]:[]),...history],stream:false};
  }else if(mode==='chat'){
    path='/chat/completions';payload={model,messages:[...(system?[{role:'system',content:system}]:[]),...history],stream:false};
  }else return res.status(400).json({error:'Tipo de API inválido.'});
  try{
    const resp=await requestAi(cfg,path,payload);
    if(!resp.ok)return upstreamProblem(res,resp);
    const answer=await readAiResponse(resp);let value='';
    if(mode==='anthropic')value=(answer.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join('\n');
    else if(mode==='responses')value=answer.output_text||(answer.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text'||x.type==='text').map(x=>x.text||'').join('\n');
    else{const content=answer.choices?.[0]?.message?.content;value=typeof content==='string'?content:Array.isArray(content)?content.map(x=>x.text||'').join('\n'):'';}
    if(!value)return res.status(502).json({error:'O provedor não retornou texto neste formato de API.'});
    return res.json({text:value.slice(0,120000),model:answer.model||model});
  }catch{return res.status(502).json({error:'Falha de comunicação com o provedor.'});}
});

app.use(express.static(dist));
app.listen(port, '0.0.0.0', () => {
  console.log(`Blocksmith listening on port ${port}`);
});
