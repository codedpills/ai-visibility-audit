import 'dotenv/config';
import { buildServer } from './server.js';

const app = buildServer();
const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
