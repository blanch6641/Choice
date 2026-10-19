const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.cwd();

// Ensure config.js and apply/config.js exist before starting
const configPath = path.join(PUBLIC_DIR, 'config.js');
if (!fs.existsSync(configPath)) {
  try {
    const { execSync } = require('child_process');
    console.log('[serve] config.js not found. Generating runtime configuration...');
    execSync('AIS_BUILD=true node generate-config.js', { stdio: 'inherit', cwd: PUBLIC_DIR });
  } catch (err) {
    console.warn('[serve] Warning: generate-config.js failed:', err.message);
  }
}

// Parse port and host from arguments or environment
const portArgIndex = process.argv.indexOf('--port');
const hostArgIndex = process.argv.indexOf('--host');

const PORT = parseInt(
  (portArgIndex !== -1 && process.argv[portArgIndex + 1]) ||
  process.env.PORT ||
  '3000',
  10
);

const HOST = (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) ||
  process.env.HOST ||
  '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let cleanUrl = req.url.split('?')[0];
  try {
    cleanUrl = decodeURIComponent(cleanUrl);
  } catch (_) {}

  let filePath = path.join(PUBLIC_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file doesn't exist directly
  if (!fs.existsSync(filePath)) {
    const ext = path.extname(cleanUrl);
    if (!ext) {
      // Clean URL route (e.g. /about or /listings)
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        // Fallback to main index.html for SPA routes
        filePath = path.join(PUBLIC_DIR, 'index.html');
      }
    } else {
      // Asset file with an extension that does not exist -> return proper 404
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>', 'utf-8');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(content);
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Choice Properties dev server listening on http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
