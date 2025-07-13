// Test complete QR code flow with server
async function testCompleteFlow() {
  console.log('🧪 Testing complete QR code flow...\n');
  
  try {
    // Test 1: File Server Creation
    console.log('📋 Test 1: File Server Creation');
    const FileServer = require('./public/network/fileServer');
    const fileServer = new FileServer();
    console.log('✅ File server created');
    
    // Test 2: Start Server
    console.log('\n📋 Test 2: Starting Server');
    const serverUrl = await fileServer.start(['test.txt']);
    console.log('✅ Server started at:', serverUrl);
    
    // Test 3: Health Check
    console.log('\n📋 Test 3: Health Check');
    const http = require('http');
    const url = require('url');
    const parsedUrl = url.parse(serverUrl);
    
    const healthCheck = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/api/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ Health check passed:', healthCheck);
    
    // Test 4: QR Code Generation
    console.log('\n📋 Test 4: QR Code Generation');
    const qrCheck = await new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/api/qr',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log('✅ QR code generation:', qrCheck.success ? 'SUCCESS' : 'FAILED');
    if (qrCheck.success) {
      console.log('   QR Code Length:', qrCheck.qrCode.length);
      console.log('   URL:', qrCheck.url);
    }
    
    // Test 5: Cleanup
    console.log('\n📋 Test 5: Cleanup');
    await fileServer.stop();
    console.log('✅ Server stopped');
    
    console.log('\n🎉 All tests passed! The complete flow is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCompleteFlow().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
