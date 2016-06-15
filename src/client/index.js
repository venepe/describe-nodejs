'use strict';

import express from 'express';
import path from 'path';
const app = express();

app.get('/', (req, res) => {
  let file = path.resolve(__dirname, '../../public/build/index.html');
  res.sendFile(file);
});

app.get('/bundle.js', (req, res) => {
  let file = path.resolve(__dirname, '../../public/build/bundle.js');
  res.sendFile(file);
});

app.get('/bundle.js.map', (req, res) => {
  let file = path.resolve(__dirname, '../../public/build/bundle.j.map');
  res.sendFile(file);
});

export default app;
