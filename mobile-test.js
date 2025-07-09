// Simple mobile web server test
const express = require('express');
const path = require('path');

const app = express();
const port = 54323;

// Enable CORS for all origins (safe for local network)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>LAN File Share - Mobile Test</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .success {
            background: #28a745;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 18px;
        }
        .info {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LAN File Share</h1>
        <div class="success">✅ Mobile connection successful!</div>
        <div class="info">
            <p><strong>Your IP:</strong> ${req.ip}</p>
            <p><strong>Server working:</strong> Yes</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>The mobile web interface is working correctly. You can now use the QR code feature in the main app!</p>
    </div>
</body>
</html>
  `);
});

const server = app.listen(port, '0.0.0.0', () => {
  const interfaces = require('os').networkInterfaces();
  let localIP = 'localhost';
  
  // Find the WiFi IP address
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        localIP = interface.address;
      }
    });
  });
  
  console.log(`\n🌐 Mobile Test Server Running!`);
  console.log(`📱 Test URL: http://${localIP}:${port}`);
  console.log(`🔗 Direct link: http://192.168.29.127:${port}`);
  console.log(`\n📋 Copy this URL to your phone's browser:`);
  console.log(`   http://192.168.29.127:${port}`);
  console.log(`\n⏹️  Press Ctrl+C to stop`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping test server...');
  server.close();
  process.exit();
});
