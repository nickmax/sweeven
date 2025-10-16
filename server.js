const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DATA_PATH = path.join(ROOT_DIR, 'data', 'menu.json');
const ADMIN_TOKEN = process.env.CMS_TOKEN || '';

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

const sendJSON = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-CMS-Token',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  });
  res.end(body);
};

const handleOptions = (res) => {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-CMS-Token',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
  });
  res.end();
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error('Request body too large'));
        req.connection.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

const loadMenu = async () => {
  const file = await fs.promises.readFile(DATA_PATH, 'utf8');
  return JSON.parse(file);
};

const saveMenu = async (menu) => {
  const content = `${JSON.stringify(menu, null, 2)}\n`;
  await fs.promises.writeFile(DATA_PATH, content, 'utf8');
};

const validateMenu = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Payload must be an object.';
  }
  if (!Array.isArray(payload.categories)) {
    return 'Payload must include a categories array.';
  }
  for (const category of payload.categories) {
    if (!category.id || !category.title) {
      return 'Each category must include id and title.';
    }
    if (!Array.isArray(category.items)) {
      return `Category ${category.id} is missing an items array.`;
    }
    for (const item of category.items) {
      if (!item.id || !item.name) {
        return `Each item must include id and name (category ${category.id}).`;
      }
      if (typeof item.price !== 'number' || Number.isNaN(item.price)) {
        return `Item ${item.id} must include a numeric price.`;
      }
      if (item.description !== undefined && typeof item.description !== 'string') {
        return `Item ${item.id} must have a string description when provided.`;
      }
    }
    if (category.note && typeof category.note !== 'string') {
      return `Category ${category.id} note must be a string.`;
    }
  }
  return null;
};

const serveStatic = async (req, res, pathname) => {
  let relativePath = pathname;
  if (relativePath === '/') {
    relativePath = '/index.html';
  }
  if (relativePath === '/admin' || relativePath === '/sweeven_admin') {
    res.writeHead(302, { Location: '/sweeven-admin' });
    res.end();
    return;
  }
  if (relativePath === '/sweeven-admin') {
    relativePath = '/sweeven-admin.html';
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
    if (type.startsWith('text/')) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    } else {
      const stream = fs.createReadStream(filePath);
      stream.on('open', () => {
        res.writeHead(200, { 'Content-Type': type });
        stream.pipe(res);
      });
      stream.on('error', () => {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      });
    }
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

const handleApi = async (req, res, pathname) => {
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  if (pathname === '/api/menu' && req.method === 'GET') {
    try {
      const menu = await loadMenu();
      sendJSON(res, 200, menu);
    } catch (error) {
      console.error('Failed to read menu.json', error);
      sendJSON(res, 500, { error: 'Failed to load menu data.' });
    }
    return;
  }

  if (pathname === '/api/menu' && req.method === 'PUT') {
    if (ADMIN_TOKEN && req.headers['x-cms-token'] !== ADMIN_TOKEN) {
      sendJSON(res, 401, { error: 'Unauthorized' });
      return;
    }

    try {
      const raw = await readBody(req);
      if (!raw) {
        sendJSON(res, 400, { error: 'Request body cannot be empty.' });
        return;
      }
      const payload = JSON.parse(raw);
      const validationError = validateMenu(payload);
      if (validationError) {
        sendJSON(res, 400, { error: validationError });
        return;
      }
      await saveMenu(payload);
      sendJSON(res, 200, { status: 'ok' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJSON(res, 400, { error: 'Malformed JSON body.' });
      } else {
        console.error('Failed to write menu.json', error);
        sendJSON(res, 500, { error: 'Failed to save menu data.' });
      }
    }
    return;
  }

  sendJSON(res, 404, { error: 'Not Found' });
};

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Sweeven CMS server running on http://localhost:${PORT}`);
});
