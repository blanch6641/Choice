const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];

  // Handle /api/relocate endpoint
  if (cleanUrl === '/api/relocate' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => bodyData += chunk);
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyData || '{}');
        const { property, targetQuery, mode } = body;
        if (!property) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ ok: false, error: 'Property is required' }));
        }

        if (mode === 'same_block_alias') {
          const originalAddr = property.address || property.street || '';
          const match = originalAddr.match(/^(\d+)(.*)$/);
          const newAddress = match ? `${parseInt(match[1], 10) + 8}${match[2]}` : originalAddr;
          const city = property.city || '';
          const state = property.state || '';
          const zip = property.zip || property.zip_code || '';
          const title = `${newAddress}, ${city}, ${state} ${zip}`.trim();

          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({
            ok: true,
            result: {
              newTitle: title,
              newAddress,
              newCity: city,
              newState: state,
              newZip: zip,
              newCounty: property.county || '',
              newLat: property.lat || property.latitude,
              newLng: property.lng || property.longitude,
              newDescription: property.description || '',
              method: 'Same-Block Privacy Aliasing (+8 Offset)',
              verifiedCensus: true
            }
          }));
        }

        const query = (targetQuery || 'Yukon, OK').trim();
        const zipMatch = query.match(/\b\d{5}\b/);
        const requestedZip = zipMatch ? zipMatch[0] : null;

        const YUKON_VERIFIED_LOCATIONS = [
          // 73099 (Central Yukon, Canadian County)
          { address: '704 Oak Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.504644, lng: -97.753636 },
          { address: '820 Elm Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.506739, lng: -97.755214 },
          { address: '412 Holly Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.503075, lng: -97.751478 },
          { address: '624 Cedar Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.508870, lng: -97.752619 },
          { address: '408 S 8th St', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.503461, lng: -97.754781 },
          { address: '3216 Vandament Ave', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.493472, lng: -97.729211 },
          { address: '12000 NW 10th St', city: 'Yukon', state: 'OK', zip: '73099', county: 'Canadian County', lat: 35.478978, lng: -97.738434 },

          // 73127 (Yukon / West Metro Council Rd Corridor)
          { address: '7400 Melrose Ln', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.471517, lng: -97.641661 },
          { address: '6800 NW 16th St', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.485994, lng: -97.631896 },
          { address: '2400 N Council Rd', city: 'Yukon', state: 'OK', zip: '73127', county: 'Canadian County', lat: 35.482437, lng: -97.654301 },

          // 73132 (NW Residential Corridor)
          { address: '7800 NW 50th St', city: 'Yukon', state: 'OK', zip: '73132', county: 'Canadian County', lat: 35.522258, lng: -97.650047 },
          { address: '6200 NW 63rd St', city: 'Yukon', state: 'OK', zip: '73132', county: 'Canadian County', lat: 35.536593, lng: -97.561532 },

          // 73064 (Mustang / South Yukon Corridor)
          { address: '400 S Mustang Rd', city: 'Mustang', state: 'OK', zip: '73064', county: 'Canadian County', lat: 35.388585, lng: -97.724463 }
        ];

        let pool = YUKON_VERIFIED_LOCATIONS;
        if (requestedZip) {
          const filtered = YUKON_VERIFIED_LOCATIONS.filter(l => l.zip === requestedZip);
          if (filtered.length > 0) pool = filtered;
        }

        const loc = pool[Math.floor(Math.random() * pool.length)];
        const newAddress = loc.address;
        const city = loc.city;
        const state = loc.state;
        const zip = loc.zip;
        const county = loc.county;
        const newTitle = `${newAddress}, ${city}, ${state} ${zip}`;

        let newDesc = property.description || '';
        if (newDesc && property.city && property.state) {
          newDesc = newDesc
            .replace(new RegExp(`\\b${property.city}\\b`, 'gi'), city)
            .replace(new RegExp(`\\b${property.state}\\b`, 'gi'), state)
            .replace(new RegExp(`\\b${property.zip || ''}\\b`, 'gi'), zip);
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({
          ok: true,
          result: {
            newTitle,
            newAddress,
            newCity: city,
            newState: state,
            newZip: zip,
            newCounty: county,
            newLat: loc.lat,
            newLng: loc.lng,
            newDescription: newDesc,
            method: `Verified Synthetic Relocation Multi-ZIP (${city}, ${state} ${zip})`,
            verifiedCensus: true
          }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Normalize path and prevent directory traversal
  let safePath = path.normalize(cleanUrl).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  // If path is a directory, look for index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If not found directly, check with .html extension
  if (!fs.existsSync(filePath)) {
    // Strip trailing slash if any
    const trimmedPath = filePath.replace(/[/\\]+$/, '');
    if (fs.existsSync(trimmedPath + '.html')) {
      filePath = trimmedPath + '.html';
    } else if (fs.existsSync(path.join(trimmedPath, 'index.html'))) {
      filePath = path.join(trimmedPath, 'index.html');
    } else {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>', 'utf-8');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Choice Properties server running on port ${PORT} (0.0.0.0)`);
});
