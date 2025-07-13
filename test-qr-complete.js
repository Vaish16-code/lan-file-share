// Complete QR code test
const QRCode = require('qrcode');

async function testCompleteQRFlow() {
  console.log('🧪 Testing complete QR code flow...\n');
  
  // Test 1: Direct QRCode library
  console.log('📋 Test 1: Direct QRCode library');
  try {
    const directQR = await QRCode.toDataURL('http://test.com');
    console.log('✅ Direct QRCode works:', directQR.substring(0, 50) + '...');
  } catch (error) {
    console.log('❌ Direct QRCode failed:', error.message);
  }
  
  // Test 2: Custom QR Generator
  console.log('\n📋 Test 2: Custom QR Generator');
  try {
    const QRGen = require('./public/network/qrGenerator');
    const qrGen = new QRGen();
    const customQR = await qrGen.generateQRCode('http://test.com');
    console.log('✅ Custom QRGen works:', customQR.success);
    if (customQR.success) {
      console.log('   Data URL length:', customQR.dataURL.length);
    }
  } catch (error) {
    console.log('❌ Custom QRGen failed:', error.message);
  }
  
  // Test 3: File Server
  console.log('\n📋 Test 3: File Server (if running)');
  try {
    const FileServer = require('./public/network/fileServer');
    const fileServer = new FileServer();
    console.log('✅ FileServer instantiated');
    
    // Try to test QR generation
    const qrResult = await fileServer.qrGenerator.generateQRCode('http://test.com');
    console.log('✅ FileServer QR generation works:', qrResult.success);
  } catch (error) {
    console.log('❌ FileServer test failed:', error.message);
  }
  
  console.log('\n🎉 QR code testing complete!');
}

testCompleteQRFlow().catch(console.error);
