const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { networkDiscovery } = require('./network/discovery');
const { fileTransfer } = require('./network/fileTransfer');
const FileServer = require('./network/fileServer');
const QRCodeGenerator = require('./network/qrGenerator');

let mainWindow;
let discoveryService;
let transferService;
let serverService;
let qrGenerator;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Add security headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "font-src 'self' data:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        ]
      }
    });
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigins = [
      'http://localhost:3000',
      'file://'
    ];
    
    const isAllowed = allowedOrigins.some(origin => 
      navigationUrl.startsWith(origin)
    );
    
    if (!isAllowed) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Initialize network services
  initializeNetworkServices();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Cleanup services
  if (discoveryService) discoveryService.stop();
  if (transferService) transferService.stop();
  if (serverService) serverService.stop();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup on quit
  if (discoveryService) discoveryService.stop();
  if (transferService) transferService.stop();
  if (serverService) serverService.stop();
});

// Initialize network services
function initializeNetworkServices() {
  try {
    discoveryService = new networkDiscovery();
    transferService = new fileTransfer();
    serverService = new FileServer();
    qrGenerator = new QRCodeGenerator();

    // Start discovery service
    discoveryService.start();
    
    // Forward discovery events to renderer
    discoveryService.on('peer-found', (peer) => {
      mainWindow.webContents.send('peer-found', peer);
    });

    discoveryService.on('peer-lost', (peerId) => {
      mainWindow.webContents.send('peer-lost', peerId);
    });

    // Forward transfer events to renderer
    transferService.on('transfer-progress', (data) => {
      mainWindow.webContents.send('transfer-progress', data);
    });

    transferService.on('transfer-complete', (data) => {
      mainWindow.webContents.send('transfer-complete', data);
    });

    transferService.on('transfer-error', (data) => {
      mainWindow.webContents.send('transfer-error', data);
    });

    transferService.on('file-received', (data) => {
      mainWindow.webContents.send('file-received', data);
    });

  } catch (error) {
    console.error('Failed to initialize network services:', error);
  }
}

// IPC handlers
ipcMain.handle('get-peers', () => {
  return discoveryService ? discoveryService.getPeers() : [];
});

ipcMain.handle('send-file', async (event, { filePath, targetPeer }) => {
  try {
    if (!transferService) throw new Error('Transfer service not initialized');
    return await transferService.sendFile(filePath, targetPeer);
  } catch (error) {
    console.error('Failed to send file:', error);
    throw error;
  }
});

ipcMain.handle('select-files', async () => {
  try {
    console.log('File selection dialog requested...');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    console.log('File selection result:', result);
    return result;
  } catch (error) {
    console.error('Failed to select files:', error);
    throw error;
  }
});

ipcMain.handle('get-device-info', () => {
  const os = require('os');
  return {
    name: os.hostname(),
    platform: os.platform(),
    type: 'desktop',
    ip: getLocalIP()
  };
});

ipcMain.handle('start-file-server', async (event, files) => {
  try {
    console.log('🚀 Starting file server with files:', files);
    
    if (!serverService) {
      console.error('❌ Server service not initialized');
      throw new Error('Server service not initialized');
    }
    
    if (!files || files.length === 0) {
      console.log('⚠️ No files provided, starting server with empty file list');
      files = [];
    }
    
    console.log('🔧 Calling serverService.start...');
    const serverUrl = await serverService.start(files);
    
    if (!serverUrl) {
      throw new Error('Server started but returned no URL');
    }
    
    console.log('✅ File server started successfully at:', serverUrl);
    
    // Give the server a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return serverUrl;
  } catch (error) {
    console.error('❌ Failed to start file server:', error);
    console.error('Error details:', error.stack);
    throw new Error(`File server startup failed: ${error.message}`);
  }
});

ipcMain.handle('stop-file-server', async () => {
  try {
    if (serverService) {
      await serverService.stop();
    }
  } catch (error) {
    console.error('Failed to stop file server:', error);
    throw error;
  }
});

ipcMain.handle('generate-qr-code', async (event, url) => {
  try {
    console.log('🔄 QR code generation requested for URL:', url);
    
    if (!qrGenerator) {
      console.error('❌ QR Generator not initialized');
      throw new Error('QR Generator service not initialized');
    }
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided for QR code generation');
    }
    
    console.log('🔧 Calling qrGenerator.generateQRCode...');
    const result = await qrGenerator.generateQRCode(url);
    
    if (!result) {
      throw new Error('QR Generator returned no result');
    }
    
    console.log('✅ QR code generation completed:', result.success ? 'Success' : 'Failed');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to generate QR code:', error);
    console.error('Error details:', error.stack);
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
});

// Utility functions
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Security: Prevent new window creation and handle web contents
app.on('web-contents-created', (event, contents) => {
  // Prevent navigation to external URLs
  contents.on('will-navigate', (event, navigationUrl) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'file://'
    ];
    
    const isAllowed = allowedOrigins.some(origin => 
      navigationUrl.startsWith(origin)
    );
    
    if (!isAllowed) {
      event.preventDefault();
    }
  });

  // Prevent new window creation
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Prevent webview creation
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});
