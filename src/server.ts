import express from 'express';
import { env } from '@config';
import { middlewares } from '@middlewares';
import { contactFormRouter, healthCheckRouter } from '@routes';

const app = express();

app.use(middlewares.cors, middlewares.json, middlewares.urlencoded, middlewares.successWrapper);

app.use('/', healthCheckRouter);

app.use('/api', contactFormRouter);

app.use(middlewares.error);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.info(`Contact form server is listening on port ${env.PORT}`);
});
