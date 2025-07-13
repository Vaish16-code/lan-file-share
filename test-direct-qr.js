// Test the new direct QR code generation
const QRCode = require('qrcode');

async function testDirectQRGeneration() {
  console.log('🧪 Testing Direct QR Code Generation...');
  
  const testUrl = 'http://192.168.29.127:54323';
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(testUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log('✅ QR Code Generation Results:');
    console.log('Success: true');
    console.log('Data URL Length:', qrCodeDataURL.length);
    console.log('Valid PNG Format:', qrCodeDataURL.startsWith('data:image/png;base64,'));
    console.log('Preview:', qrCodeDataURL.substring(0, 100) + '...');
    
    if (qrCodeDataURL.startsWith('data:image/png;base64,') && qrCodeDataURL.length > 1000) {
      console.log('🎉 QR code generation is working perfectly!');
      console.log('📱 The React component should now generate QR codes successfully!');
    } else {
      console.log('❌ QR code generation has issues');
    }
    
  } catch (error) {
    console.error('❌ QR code generation failed:', error.message);
  }
}

testDirectQRGeneration();
