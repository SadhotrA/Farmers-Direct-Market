const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketManager = require('./src/lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  socketManager.initialize(server);

  // Start server
  server.listen(port, (err) => {
    if (err) {
      if (err.code === 'EADDRINUSE') {
        console.log(`> Port ${port} is busy, trying port ${port + 1}`);
        server.listen(port + 1, (err2) => {
          if (err2) throw err2;
          console.log(`> Ready on http://${hostname}:${port + 1}`);
          console.log(`> Socket.io server initialized`);
        });
      } else {
        throw err;
      }
    } else {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server initialized`);
    }
  });
});
