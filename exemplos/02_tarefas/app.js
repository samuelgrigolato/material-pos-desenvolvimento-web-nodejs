import express from 'express';
import setupApp from './setup-app.js';

const app = express();
setupApp(app);
app.listen(8080);
