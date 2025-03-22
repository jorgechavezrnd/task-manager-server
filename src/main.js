import express from 'express';
import path from 'path';
import { glob } from 'glob';
import cors from 'cors';

const port = process.env.PORT;
const app = express();

app.use(cors());
app.use(express.json());

const files = await glob('src/controllers/*.js');

for (const file of files) {
  //const pathFile = `file://${path.resolve(file).replace(/\\/g, '/')}`;
  const pathFile = path.resolve(file);
  const rout = await import(pathFile);
  rout.default(app);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
