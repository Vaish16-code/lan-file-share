const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Peer discovery
  getPeers: () => ipcRenderer.invoke('get-peers'),
  
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  sendFile: (filePath, targetPeer) => ipcRenderer.invoke('send-file', { filePath, targetPeer }),
  
  // Device info
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  
  // File server for mobile devices
  startFileServer: (files) => ipcRenderer.invoke('start-file-server', files),
  stopFileServer: () => ipcRenderer.invoke('stop-file-server'),
  
  // QR Code generation
  generateQRCode: (url) => ipcRenderer.invoke('generate-qr-code', url),
  
  // Event listeners
  onPeerFound: (callback) => ipcRenderer.on('peer-found', callback),
  onPeerLost: (callback) => ipcRenderer.on('peer-lost', callback),
  onTransferProgress: (callback) => ipcRenderer.on('transfer-progress', callback),
  onTransferComplete: (callback) => ipcRenderer.on('transfer-complete', callback),
  onTransferError: (callback) => ipcRenderer.on('transfer-error', callback),
  onFileReceived: (callback) => ipcRenderer.on('file-received', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Utility
  platform: process.platform,
  versions: process.versions
});
