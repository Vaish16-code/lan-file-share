// Test QR code generation in app context
async function testQRInApp() {
  try {
    // Test the QR generator directly
    const QRGen = require('./public/network/qrGenerator');
    const qrGen = new QRGen();
    
    const testUrl = 'http://192.168.29.127:54323';
    console.log('🔄 Testing QR generation for:', testUrl);
    
    const result = await qrGen.generateQRCode(testUrl);
    
    console.log('📋 QR Generation Result:');
    console.log('Success:', result.success);
    console.log('Has Data URL:', !!result.dataURL);
    console.log('Data URL Length:', result.dataURL ? result.dataURL.length : 0);
    console.log('Error:', result.error);
    
    if (result.success && result.dataURL) {
      console.log('🎉 QR code generation is working perfectly!');
      console.log('📱 QR code preview (first 100 chars):', result.dataURL.substring(0, 100) + '...');
      
      // Test if it's a valid data URL
      if (result.dataURL.startsWith('data:image/png;base64,')) {
        console.log('✅ Valid PNG data URL format');
      } else {
        console.log('❌ Invalid data URL format');
      }
    } else {
      console.log('❌ QR code generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testQRInApp();
