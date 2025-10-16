const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const serveFile = async (res, filePath, type) => {
  try {
    if (type.startsWith('text/')) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      res.writeHead(200, { 'Content-Type': type });
      stream.pipe(res);
    });
    stream.on('error', () => {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
};

const serveStatic = async (req, res, pathname) => {
  let relativePath = pathname;
  if (relativePath === '/') {
    relativePath = '/index.html';
  }

  const unsafePath = path.normalize(relativePath);
  const filePath = path.join(ROOT_DIR, unsafePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await serveStatic(req, res, path.join(relativePath, 'index.html'));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    await serveFile(res, filePath, type);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  }
};

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Sweeven site available at http://localhost:${PORT}`);
});
