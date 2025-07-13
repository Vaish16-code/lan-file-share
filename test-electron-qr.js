// Test the complete QR code flow in Electron
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'public', 'preload.js')
    }
  });

  // Load the React app
  mainWindow.loadURL('http://localhost:3000');
  
  // Open DevTools for testing
  mainWindow.webContents.openDevTools();
  
  // Test QR code generation after app loads
  mainWindow.webContents.once('did-finish-load', async () => {
    console.log('🧪 Testing QR code generation in Electron...');
    
    // Import the QR Generator
    const QRCodeGenerator = require('./public/network/qrGenerator');
    const qrGenerator = new QRCodeGenerator();
    
    try {
      const testUrl = 'http://192.168.1.100:54324';
      const result = await qrGenerator.generateQRCode(testUrl);
      
      if (result.success) {
        console.log('✅ Electron QR generation test successful!');
        console.log('📄 Data URL length:', result.dataURL.length);
        
        // Send the QR data to the renderer process for display
        mainWindow.webContents.send('qr-test-result', {
          success: true,
          qrCode: result.dataURL,
          url: testUrl,
          message: 'QR code generation working in Electron!'
        });
      } else {
        console.log('❌ Electron QR generation test failed:', result.error);
        mainWindow.webContents.send('qr-test-result', {
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('💥 Electron QR test exception:', error);
      mainWindow.webContents.send('qr-test-result', {
        success: false,
        error: error.message
      });
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
