const http = require('http');

// Create a simple HTTP server to keep the repl alive
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Discord Bot Status</title>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 0;
                padding: 50px;
                min-height: 100vh;
                box-sizing: border-box;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .status {
                font-size: 24px;
                margin: 20px 0;
                color: #00ff88;
                font-weight: bold;
            }
            .info {
                font-size: 16px;
                margin: 10px 0;
                opacity: 0.9;
            }
            .timestamp {
                font-size: 14px;
                opacity: 0.7;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Discord Bot</h1>
            <div class="status">✅ Bot is running!</div>
            <div class="info">🚀 Hosted on Replit</div>
            <div class="info">⚙️ Interactive Configuration Menu Available</div>
            <div class="info">🎫 Ticket System Active</div>
            <div class="timestamp">Last checked: ${new Date().toLocaleString()}</div>
        </div>
        <script>
            // Auto refresh every 30 seconds
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        </script>
    </body>
    </html>
  `);
  res.end();
});

// Function to start the keep alive server
function keepAlive() {
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    console.log('🌐 Keep-alive server is running on port', port);
  });
}

module.exports = keepAlive;
