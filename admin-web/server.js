const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5013;
const root = __dirname;

const server = http.createServer((req, res) => {
  const requested = req.url === '/' ? '/login.html' : req.url.split('?')[0];
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const extension = path.extname(filePath);
  const contentType = extension === '.html' ? 'text/html; charset=utf-8' : 'text/plain';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`GRAFA admin UI listening on port ${port}`);
});
