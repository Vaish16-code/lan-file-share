const FileServer = require('./public/network/fileServer');
const fs = require('fs');
const path = require('path');

async function testFileServer() {
  console.log('🧪 Testing File Server...');
  
  // Create some test files
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFiles = [
    { name: 'sample-document.txt', content: 'This is a sample text document for testing file sharing.' },
    { name: 'test-data.json', content: JSON.stringify({ message: 'Hello from LAN File Share!', timestamp: Date.now() }, null, 2) }
  ];
  
  const filePaths = [];
  testFiles.forEach(file => {
    const filePath = path.join(testDir, file.name);
    fs.writeFileSync(filePath, file.content, 'utf8');
    filePaths.push(filePath);
    console.log('📄 Created test file:', filePath);
  });
  
  try {
    const fileServer = new FileServer();
    console.log('🔄 Starting file server with test files...');
    
    const serverUrl = await fileServer.start(filePaths);
    console.log('✅ File server started at:', serverUrl);
    
    // Test the health endpoint
    setTimeout(async () => {
      try {
        const response = await fetch(`${serverUrl}/api/health`);
        const health = await response.json();
        console.log('💚 Health check:', health);
        
        // Test the files endpoint
        const filesResponse = await fetch(`${serverUrl}/api/files`);
        const files = await filesResponse.json();
        console.log('📁 Available files:', files);
        
        console.log('🌐 Open in browser:', serverUrl);
        console.log('📱 Mobile interface ready for testing!');
        
        // Keep server running for manual testing
        console.log('⏰ Server will keep running for testing. Press Ctrl+C to stop.');
        
      } catch (error) {
        console.error('❌ Test request failed:', error.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('💥 File server test failed:', error);
  }
}

testFileServer();
