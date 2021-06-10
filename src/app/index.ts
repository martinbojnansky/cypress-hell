import fs from 'fs';
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    fs.createReadStream('src/app/index.html').pipe(res);
  } else if (req.url?.startsWith('/api/')) {
    handleApiRequest(req, res);
  }
});

server.listen(process.env.PORT || 3456);

function handleApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  if (req.url === '/api/update-snapshots' && req.method === 'PATCH') {
    console.log('updating snapshots');
  }
}
