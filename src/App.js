import React, { useState, useEffect } from 'react';
import './App.css';
import DeviceList from './components/DeviceList';
import FileDropZone from './components/FileDropZone';
import TransferStatus from './components/TransferStatus';
import QRCodeModal from './components/QRCodeModal';
import Header from './components/Header';
import Notifications from './components/Notifications';
import WebNotice from './components/WebNotice';

function App() {
  const [peers, setPeers] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [serverUrl, setServerUrl] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're in Electron environment
    const electronAvailable = window.electronAPI !== undefined;
    setIsElectron(electronAvailable);
    
    // Always set device info for both browser and Electron
    setDeviceInfo({
      name: electronAvailable ? 'Desktop App' : 'Web Browser',
      platform: electronAvailable ? 'desktop' : 'web',
      type: electronAvailable ? 'desktop' : 'browser',
      ip: electronAvailable ? 'Loading...' : 'N/A'
    });

    if (!electronAvailable) {
      // Running in browser - show limited functionality with demo data
      console.log('Running in browser mode with limited functionality');
      
      // Add some demo peers for demonstration
      setPeers([
        {
          id: 'demo-1',
          name: 'Demo Device 1',
          platform: 'win32',
          type: 'desktop',
          ip: '192.168.1.100',
          lastSeen: Date.now()
        },
        {
          id: 'demo-2',
          name: 'Demo Device 2',
          platform: 'darwin',
          type: 'desktop',
          ip: '192.168.1.101',
          lastSeen: Date.now()
        }
      ]);
      
      return;
    }

    // Electron environment - full functionality
    // Get device info
    window.electronAPI.getDeviceInfo().then(setDeviceInfo);

    // Set up event listeners
    const cleanupListeners = setupEventListeners();

    // Initial peer discovery
    window.electronAPI.getPeers().then(setPeers);

    return cleanupListeners;
  }, []);

  const setupEventListeners = () => {
    // Only set up listeners in Electron environment
    if (!window.electronAPI) {
      return () => {}; // Return empty cleanup function
    }

    const handlePeerFound = (event, peer) => {
      setPeers(prevPeers => {
        const existingIndex = prevPeers.findIndex(p => p.id === peer.id);
        if (existingIndex !== -1) {
          const updated = [...prevPeers];
          updated[existingIndex] = peer;
          return updated;
        }
        return [...prevPeers, peer];
      });
      addNotification('info', `Device discovered: ${peer.name}`);
    };

    const handlePeerLost = (event, peerId) => {
      setPeers(prevPeers => prevPeers.filter(p => p.id !== peerId));
      addNotification('warning', 'Device disconnected');
    };

    const handleTransferProgress = (event, data) => {
      setTransfers(prevTransfers => {
        const existingIndex = prevTransfers.findIndex(t => t.transferId === data.transferId);
        if (existingIndex !== -1) {
          const updated = [...prevTransfers];
          updated[existingIndex] = { ...updated[existingIndex], ...data };
          return updated;
        }
        return [...prevTransfers, { ...data, type: 'outgoing' }];
      });
    };

    const handleTransferComplete = (event, data) => {
      setTransfers(prevTransfers =>
        prevTransfers.map(t =>
          t.transferId === data.transferId
            ? { ...t, ...data, completed: true }
            : t
        )
      );
      addNotification('success', `File transfer completed: ${data.fileName}`);
    };

    const handleTransferError = (event, data) => {
      setTransfers(prevTransfers =>
        prevTransfers.map(t =>
          t.transferId === data.transferId
            ? { ...t, ...data, error: true }
            : t
        )
      );
      addNotification('error', `Transfer failed: ${data.error}`);
    };

    const handleFileReceived = (event, data) => {
      setTransfers(prevTransfers => [
        ...prevTransfers,
        { ...data, type: 'incoming', progress: 0 }
      ]);
      addNotification('info', `Receiving file: ${data.fileName}`);
    };

    // Register event listeners
    window.electronAPI.onPeerFound(handlePeerFound);
    window.electronAPI.onPeerLost(handlePeerLost);
    window.electronAPI.onTransferProgress(handleTransferProgress);
    window.electronAPI.onTransferComplete(handleTransferComplete);
    window.electronAPI.onTransferError(handleTransferError);
    window.electronAPI.onFileReceived(handleFileReceived);

    // Return cleanup function
    return () => {
      window.electronAPI.removeAllListeners('peer-found');
      window.electronAPI.removeAllListeners('peer-lost');
      window.electronAPI.removeAllListeners('transfer-progress');
      window.electronAPI.removeAllListeners('transfer-complete');
      window.electronAPI.removeAllListeners('transfer-error');
      window.electronAPI.removeAllListeners('file-received');
    };
  };

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleFileSelect = async () => {
    if (!window.electronAPI) {
      addNotification('warning', 'File selection only available in Electron app');
      return [];
    }
    
    try {
      console.log('Calling electronAPI.selectFiles...');
      const result = await window.electronAPI.selectFiles();
      console.log('File selection result:', result);
      
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        console.log('Selected file paths:', result.filePaths);
        return result.filePaths;
      } else {
        console.log('No files selected or dialog was canceled');
        return [];
      }
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      addNotification('error', `Failed to select files: ${error.message || error}`);
      return [];
    }
  };

  const handleFileSend = async (filePaths, targetPeer) => {
    if (!window.electronAPI) {
      addNotification('warning', 'File sending only available in Electron app');
      return;
    }
    
    try {
      for (const filePath of filePaths) {
        await window.electronAPI.sendFile(filePath, targetPeer);
      }
    } catch (error) {
      addNotification('error', `Failed to send file: ${error.message}`);
    }
  };

  const handleQRCode = async () => {
    if (!window.electronAPI) {
      addNotification('warning', 'QR code generation only available in Electron app');
      return;
    }
    
    try {
      // Start file server if not already running
      const url = await window.electronAPI.startFileServer([]);
      setServerUrl(url);
      setShowQRModal(true);
    } catch (error) {
      addNotification('error', 'Failed to start file server');
    }
  };

  const handleShareFiles = async () => {
    if (!window.electronAPI) {
      addNotification('warning', 'File sharing only available in Electron app');
      return;
    }
    
    try {
      console.log('Starting file selection...');
      const filePaths = await handleFileSelect();
      console.log('Selected files:', filePaths);
      
      if (filePaths.length === 0) {
        addNotification('info', 'No files selected');
        return;
      }
      
      console.log('Starting file server with files:', filePaths);
      const url = await window.electronAPI.startFileServer(filePaths);
      console.log('File server started at:', url);
      
      setServerUrl(url);
      setSharedFiles(filePaths); // Store the shared files
      setShowQRModal(true);
      addNotification('success', 'Files are now available for mobile download');
    } catch (error) {
      console.error('Error in handleShareFiles:', error);
      addNotification('error', `Failed to share files: ${error.message || error}`);
    }
  };

  return (
    <div className="App">
      <Header 
        deviceInfo={deviceInfo}
        onQRCode={handleQRCode}
        onShareFiles={handleShareFiles}
        isElectron={isElectron}
      />
      
      <main className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            <DeviceList 
              peers={peers}
              onFileSelect={handleFileSelect}
              onFileSend={handleFileSend}
              isElectron={isElectron}
            />
          </div>
          
          <div className="right-panel">
            <FileDropZone 
              peers={peers}
              onFileSend={handleFileSend}
              isElectron={isElectron}
            />
            
            <TransferStatus 
              transfers={transfers}
              isElectron={isElectron}
            />
          </div>
        </div>
      </main>

      {showQRModal && (
        <QRCodeModal 
          url={serverUrl}
          files={sharedFiles}
          onClose={() => setShowQRModal(false)}
        />
      )}

      <Notifications 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default App;
