const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketManager = require('./src/lib/socket');
const { 
  rateLimiters, 
  securityHeaders, 
  corsOptions, 
  errorHandler, 
  requestLogger 
} = require('./src/lib/security');
const cors = require('cors');

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
      
      // Apply security middleware
      await new Promise((resolve) => {
        // Apply CORS
        cors(corsOptions)(req, res, () => {
          // Apply security headers
          securityHeaders(req, res, () => {
            // Apply rate limiting based on route
            if (req.url.startsWith('/api/auth')) {
              rateLimiters.auth(req, res, () => {
                // Apply general rate limiting
                rateLimiters.general(req, res, () => {
                  // Apply request logging
                  requestLogger(req, res, () => {
                    resolve();
                  });
                });
              });
            } else if (req.url.startsWith('/api/uploads')) {
              rateLimiters.upload(req, res, () => {
                rateLimiters.general(req, res, () => {
                  requestLogger(req, res, () => {
                    resolve();
                  });
                });
              });
            } else if (req.url.startsWith('/api/products') && req.method === 'GET') {
              rateLimiters.search(req, res, () => {
                rateLimiters.general(req, res, () => {
                  requestLogger(req, res, () => {
                    resolve();
                  });
                });
              });
            } else {
              rateLimiters.general(req, res, () => {
                requestLogger(req, res, () => {
                  resolve();
                });
              });
            }
          });
        });
      });

      // Handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      
      // Apply error handling middleware
      errorHandler(err, req, res, () => {
        res.statusCode = 500;
        res.end('internal server error');
      });
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
          console.log(`> Security middleware enabled`);
        });
      } else {
        throw err;
      }
    } else {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server initialized`);
      console.log(`> Security middleware enabled`);
    }
  });
});
