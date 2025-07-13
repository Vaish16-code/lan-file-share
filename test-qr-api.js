// Test QR code generation API
const http = require('http');

// Wait for the server to start
setTimeout(async () => {
  console.log('🔄 Testing QR code API...');
  
  const testUrl = 'http://192.168.29.127:54323/api/qr';
  
  const options = {
    hostname: '192.168.29.127',
    port: 54323,
    path: '/api/qr',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ QR API Response:');
        console.log('Success:', result.success);
        console.log('Has QR Code:', !!result.qrCode);
        console.log('URL:', result.url);
        console.log('QR Code Length:', result.qrCode ? result.qrCode.length : 0);
        
        if (result.success && result.qrCode) {
          console.log('🎉 QR code generation is working!');
        } else {
          console.log('❌ QR code generation failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.end();
}, 8000); // Wait 8 seconds for server to start

console.log('⏳ Waiting for server to start...');
