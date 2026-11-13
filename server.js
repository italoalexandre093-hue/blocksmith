import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.static('dist'));
app.listen(port, '0.0.0.0', () => {
  console.log(`Blocksmith listening on port ${port}`);
});
