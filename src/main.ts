import 'dotenv/config';
import express from 'express';
import logger from './common/logger/index.js';
import modules from './modules/index.js';

const port = Number(process.env.PORT) || 8080;
const host = '0.0.0.0';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.listen(port, host, () => {
  logger.info(`Server is running on http://${host}:${port}`);
  modules(app);
});
