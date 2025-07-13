const LANFileShareServer = require('./server/index.js');

// Test the server functionality
async function testServer() {
  console.log('Testing LAN File Share Server...');
  
  const server = new LANFileShareServer();
  
  try {
    // Start the server
    const serverUrl = await server.start();
    console.log('✅ Server started successfully at:', serverUrl);
    
    // Test QR code generation
    console.log('Testing QR code generation...');
    const qrResponse = await fetch(`${serverUrl}/api/qr`);
    const qrData = await qrResponse.json();
    
    if (qrData.success) {
      console.log('✅ QR code generated successfully');
      console.log('QR code URL:', qrData.url);
    } else {
      console.log('❌ QR code generation failed:', qrData.error);
    }
    
    // Test health check
    const healthResponse = await fetch(`${serverUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed');
    }
    
    // Stop the server
    await server.stop();
    console.log('✅ Server stopped successfully');
    
  } catch (error) {
    console.error('❌ Server test failed:', error);
  }
}

if (require.main === module) {
  testServer();
}

module.exports = { testServer };
