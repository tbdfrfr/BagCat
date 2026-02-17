import { createServer } from 'node:http';
import { logging, server as wisp } from '@mercuryworkshop/wisp-js/server';

const port = Number(process.env.PORT || 4000);

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  dns_method: 'resolve',
  dns_servers: ['1.1.1.3', '1.0.0.3'],
  dns_result_order: 'ipv4first',
});

const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.endsWith('/wisp/')) {
    wisp.routeRequest(req, socket, head);
    return;
  }

  socket.end();
});

server.listen({ host: '0.0.0.0', port }, () => {
  console.log(`Wisp backend listening on ${port}`);
});
