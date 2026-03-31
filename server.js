const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8484;
const DAIKIN_IP = process.env.DAIKIN_IP || '192.168.0.3';

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Forward /aircon/* → Daikin unit at /skyfi/aircon/*
  if (pathname.startsWith('/aircon/') || pathname.startsWith('/common/')) {
    const daikinPath = '/skyfi' + pathname;
    const qs = parsed.search || '';
    const options = {
      hostname: DAIKIN_IP,
      port: 80,
      path: daikinPath + qs,
      method: req.method,
    };

    const proxy = http.request(options, (daikinRes) => {
      res.writeHead(daikinRes.statusCode, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      });
      daikinRes.pipe(res);
    });

    proxy.on('error', () => {
      res.writeHead(502);
      res.end('ret=NG,msg=502 Bad Gateway');
    });

    proxy.end();
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Daikin Controller running at http://localhost:${PORT}`);
  console.log(`Tailscale: http://100.113.231.86:${PORT}`);
  console.log(`Forwarding /aircon/* → http://${DAIKIN_IP}/skyfi/aircon/*`);
});
