const QRCodeGenerator = require('./public/network/qrGenerator');

async function testQRGeneration() {
  console.log('🧪 Testing QR Code Generation...');
  
  const qrGenerator = new QRCodeGenerator();
  const testUrl = 'http://192.168.1.100:54323';
  
  try {
    console.log('🔄 Generating QR code for:', testUrl);
    const result = await qrGenerator.generateQRCode(testUrl);
    
    if (result.success) {
      console.log('✅ QR Code generation successful!');
      console.log('📄 Data URL length:', result.dataURL.length);
      console.log('📁 File saved to:', result.filePath);
      console.log('🔗 URL:', result.url);
      
      // Test direct file generation too
      const fileResult = await qrGenerator.generateQRCodeFile(testUrl, './test-qr.png');
      if (fileResult.success) {
        console.log('✅ QR Code file generation also successful!');
      } else {
        console.log('❌ QR Code file generation failed:', fileResult.error);
      }
    } else {
      console.log('❌ QR Code generation failed:', result.error);
    }
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
  }
}

testQRGeneration();
