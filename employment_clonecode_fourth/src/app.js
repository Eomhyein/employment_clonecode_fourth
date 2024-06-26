import express from 'express';
import { SERVER_PORT } from './constants/env.constant.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { HTTP_STATUS } from './constants/http-status.constant.js';
import { apiRouter } from './routers/index.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// json 형태로 나가는 것이 아니기 때문에 send 이용
app.get('/health-check', (req, res) => {
  return res.status(HTTP_STATUS.OK).send(`health check.`);
});

app.use('/api', apiRouter);
app.use(errorHandler);
app.listen(SERVER_PORT, () => {
  console.log(`서버가 ${SERVER_PORT} 포트에서 실행중입니다.`);
});