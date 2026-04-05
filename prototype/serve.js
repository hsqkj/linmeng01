const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PROTO_DIR = path.join(__dirname);

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' || req.url === ''
    ? path.join(PROTO_DIR, 'index.html')
    : path.join(PROTO_DIR, req.url);

  // security: prevent directory traversal
  if (!filePath.startsWith(PROTO_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  } catch(e) {
    res.writeHead(404);
    res.end('Not found: ' + req.url);
  }
});

server.listen(PORT, () => {
  console.log('Prototype server running on http://localhost:' + PORT);
});

console.log('Press Ctrl+C to stop.');
