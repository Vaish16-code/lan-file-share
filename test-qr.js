// QR Code Test - generates a QR code for testing
const QRCode = require('qrcode');

async function testQRCode() {
  try {
    console.log('🔍 Testing QR Code generation...\n');
    
    const testUrl = 'http://192.168.29.127:54323';
    console.log(`📱 Test URL: ${testUrl}`);
    
    // Generate QR code with the same settings as the app
    const qrCode = await QRCode.toDataURL(testUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    console.log('✅ QR Code generated successfully!');
    console.log(`📏 QR Code length: ${qrCode.length} characters`);
    console.log(`🔤 QR Code format: ${qrCode.substring(0, 30)}...`);
    
    // Test if it's a valid data URL
    if (qrCode.startsWith('data:image/png;base64,')) {
      console.log('✅ Valid PNG data URL format');
    } else {
      console.log('❌ Invalid data URL format');
    }
    
    console.log('\n📋 Instructions:');
    console.log('1. Copy the generated QR code data URL from your app');
    console.log('2. Paste it in a browser address bar to see the QR code image');
    console.log('3. Use your phone to scan the displayed QR code');
    console.log('4. Your phone should open: ' + testUrl);
    
    console.log('\n✨ QR Code generation is working correctly!');
    
  } catch (error) {
    console.error('❌ QR Code test failed:', error);
  }
}

testQRCode();
