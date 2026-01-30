import { createServer } from './server';

const port = Number(process.env.PORT ?? 3333);

const server = createServer();

server.listen(port, () => {
  console.log(`Search service listening on http://localhost:${port}`);
});
