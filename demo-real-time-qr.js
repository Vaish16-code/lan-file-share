const FileServer = require('./public/network/fileServer');
const QRCodeGenerator = require('./public/network/qrGenerator');
const fs = require('fs');
const path = require('path');

async function createDemoFiles() {
  const demoDir = path.join(__dirname, 'demo-files');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }
  
  const demoFiles = [
    {
      name: 'Welcome-README.txt',
      content: `🚀 Welcome to LAN File Share!

This is a demonstration of real-time file sharing over local networks.

Features:
✅ Instant file sharing between devices
✅ QR code generation for mobile access
✅ Beautiful mobile web interface
✅ Drag & drop file uploads
✅ Progress tracking for large files
✅ Cross-platform compatibility (Windows, macOS, Linux)

To test on your mobile device:
1. Scan the QR code that will be generated
2. Download files directly to your phone
3. Upload files from your phone to the desktop

Created: ${new Date().toLocaleString()}
Network: ${require('os').networkInterfaces()['Wi-Fi']?.[1]?.address || 'Local Network'}
`
    },
    {
      name: 'sample-image-info.json',
      content: JSON.stringify({
        title: "LAN File Share Demo",
        description: "Real-time file sharing demonstration",
        features: [
          "QR Code Generation",
          "Mobile Web Interface", 
          "File Upload/Download",
          "Progress Tracking",
          "Beautiful UI"
        ],
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        author: "LAN File Share Team"
      }, null, 2)
    },
    {
      name: 'network-test.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 Network Test File</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 { color: #fff; text-align: center; }
        .feature { 
            margin: 15px 0; 
            padding: 10px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 8px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LAN File Share Network Test</h1>
        <p><strong>Congratulations!</strong> If you can see this file, the network sharing is working perfectly!</p>
        
        <div class="feature">
            <h3>📱 Mobile Access</h3>
            <p>This file was downloaded via the mobile web interface.</p>
        </div>
        
        <div class="feature">
            <h3>🔄 Real-time Sharing</h3>
            <p>Files are shared instantly across your local network.</p>
        </div>
        
        <div class="feature">
            <h3>📋 QR Code Generation</h3>
            <p>Scan QR codes to quickly access files on mobile devices.</p>
        </div>
        
        <div class="feature">
            <h3>⚡ Fast Transfer</h3>
            <p>Direct TCP connections ensure maximum speed.</p>
        </div>
        
        <p><em>Generated: ${new Date().toLocaleString()}</em></p>
    </div>
</body>
</html>`
    }
  ];
  
  const filePaths = [];
  for (const file of demoFiles) {
    const filePath = path.join(demoDir, file.name);
    fs.writeFileSync(filePath, file.content, 'utf8');
    filePaths.push(filePath);
    console.log(`📄 Created demo file: ${file.name} (${fs.statSync(filePath).size} bytes)`);
  }
  
  return filePaths;
}

async function startDemoServer() {
  console.log('🎬 Starting LAN File Share Demo...\n');
  
  try {
    // Create demo files
    console.log('📝 Creating demo files...');
    const filePaths = await createDemoFiles();
    
    // Start file server
    console.log('\n🔧 Starting file server...');
    const fileServer = new FileServer();
    const serverUrl = await fileServer.start(filePaths);
    
    console.log(`✅ File server started successfully!`);
    console.log(`🌐 Server URL: ${serverUrl}`);
    
    // Generate QR code
    console.log('\n📱 Generating QR code for mobile access...');
    const qrGenerator = new QRCodeGenerator();
    const qrResult = await qrGenerator.generateQRCode(serverUrl);
    
    if (qrResult.success) {
      console.log('✅ QR code generated successfully!');
      console.log(`💾 QR code saved to: ${qrResult.filePath}`);
    } else {
      console.log('❌ QR code generation failed:', qrResult.error);
    }
    
    // Display access information
    console.log('\n' + '='.repeat(60));
    console.log('🚀 LAN FILE SHARE DEMO READY!');
    console.log('='.repeat(60));
    console.log(`📱 Mobile Access: ${serverUrl}`);
    console.log(`📋 QR Code API: ${serverUrl}/api/qr`);
    console.log(`💊 Health Check: ${serverUrl}/api/health`);
    console.log(`📁 Files API: ${serverUrl}/api/files`);
    console.log('='.repeat(60));
    
    console.log('\n📋 Instructions:');
    console.log('1. 📱 Open the server URL on your mobile device');
    console.log('2. 📷 Or scan the QR code that was generated');
    console.log('3. ⬇️  Download files directly to your phone');
    console.log('4. ⬆️  Upload files from your phone to desktop');
    console.log('5. 🔄 The interface auto-refreshes every 30 seconds');
    
    console.log('\n⏰ Server is running... Press Ctrl+C to stop');
    
    // Test endpoints after a short delay
    setTimeout(async () => {
      console.log('\n🧪 Testing server endpoints...');
      
      try {
        // Test health endpoint
        const healthResponse = await fetch(`${serverUrl}/api/health`);
        const health = await healthResponse.json();
        console.log(`💚 Health: ${health.status} (${health.filesCount} files)`);
        
        // Test files endpoint
        const filesResponse = await fetch(`${serverUrl}/api/files`);
        const files = await filesResponse.json();
        console.log(`📁 Files available: ${files.length}`);
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name} (${formatBytes(file.size)})`);
        });
        
        console.log('\n✨ All systems operational! Demo ready for testing.');
        
      } catch (error) {
        console.error('❌ Endpoint test failed:', error.message);
      }
    }, 3000);
    
  } catch (error) {
    console.error('💥 Demo startup failed:', error);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down demo server...');
  console.log('Thanks for testing LAN File Share!');
  process.exit(0);
});

// Start the demo
startDemoServer();
