import 'dotenv/config';
import express from 'express';
import config from 'config';
import logger from './common/logger/index.js';
import modules from './modules/index.js';

const port = config.get<number>('app.port');
const host = config.get<string>('app.host');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.listen(port, host, () => {
  logger.info(`Server is running on http://${host}:${port}`);
  modules(app);
});
