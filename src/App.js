import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import DeviceList from './components/DeviceList';
import FileDropZone from './components/FileDropZone';
import FileSelector from './components/FileSelector';
import TransferStatus from './components/TransferStatus';
import QRCodeModal from './components/QRCodeModal';
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
  const [selectedFiles, setSelectedFiles] = useState([]); // New state for file selection
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

  const handleFileSelect = async (addToExisting = false) => {
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
        
        if (addToExisting) {
          // Add to existing selection, avoiding duplicates
          setSelectedFiles(prev => {
            const newFiles = result.filePaths.filter(path => !prev.includes(path));
            const updatedFiles = [...prev, ...newFiles];
            console.log('Updated file selection:', updatedFiles);
            return updatedFiles;
          });
        } else {
          // Replace existing selection
          setSelectedFiles(result.filePaths);
        }
        
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

  const addMoreFiles = async () => {
    const newFiles = await handleFileSelect(true);
    if (newFiles.length > 0) {
      addNotification('success', `Added ${newFiles.length} more file(s) to selection`);
    }
  };

  const addFiles = (filePaths) => {
    if (!filePaths || filePaths.length === 0) return;
    
    setSelectedFiles(prev => {
      const newFiles = filePaths.filter(path => !prev.includes(path));
      const updatedFiles = [...prev, ...newFiles];
      console.log('Added files via drop/selection:', newFiles);
      console.log('Updated file selection:', updatedFiles);
      
      if (newFiles.length > 0) {
        addNotification('success', `Added ${newFiles.length} file(s) to selection`);
      }
      
      return updatedFiles;
    });
  };

  const removeFile = (filePath) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(path => path !== filePath);
      console.log('Removed file, updated selection:', updated);
      return updated;
    });
    addNotification('info', 'File removed from selection');
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    addNotification('info', 'All files cleared from selection');
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
      // Check if we already have files selected or server running
      if (serverUrl && selectedFiles.length > 0) {
        console.log('Server already running with selected files, showing QR modal for:', serverUrl);
        setShowQRModal(true);
        addNotification('info', 'QR code generated for mobile access');
        return;
      }
      
      // If no files are selected, prompt user to select files first
      if (selectedFiles.length === 0) {
        addNotification('info', 'Please select files to share for mobile access');
        const filePaths = await handleFileSelect();
        if (filePaths.length === 0) {
          addNotification('warning', 'No files selected - QR code generation cancelled');
          return;
        }
      }
      
      // Start file server with selected files
      console.log('Starting file server with selected files:', selectedFiles);
      addNotification('info', 'Starting file server...');
      
      const url = await window.electronAPI.startFileServer(selectedFiles);
      console.log('File server started at:', url);
      
      if (!url) {
        throw new Error('File server failed to start - no URL returned');
      }
      
      setServerUrl(url);
      setSharedFiles(selectedFiles);
      
      // Give the server a moment to fully start
      setTimeout(() => {
        setShowQRModal(true);
        addNotification('success', `${selectedFiles.length} file(s) now available for mobile download at ${url}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error in handleQRCode:', error);
      addNotification('error', `Failed to generate QR code: ${error.message || error}`);
    }
  };

  const handleShareFiles = async () => {
    if (!window.electronAPI) {
      addNotification('warning', 'File sharing only available in Electron app');
      return;
    }
    
    try {
      // Use selected files if available, otherwise prompt for selection
      let filesToShare = selectedFiles;
      
      if (filesToShare.length === 0) {
        console.log('No files selected, starting file selection...');
        const filePaths = await handleFileSelect();
        console.log('Selected files:', filePaths);
        
        if (filePaths.length === 0) {
          addNotification('info', 'No files selected');
          return;
        }
        filesToShare = filePaths;
      }
      
      console.log('Starting file server with files:', filesToShare);
      const url = await window.electronAPI.startFileServer(filesToShare);
      console.log('File server started at:', url);
      
      setServerUrl(url);
      setSharedFiles(filesToShare);
      setShowQRModal(true);
      addNotification('success', `${filesToShare.length} file(s) are now available for mobile download`);
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
            <FileSelector
              selectedFiles={selectedFiles}
              onAddMore={addMoreFiles}
              onRemoveFile={removeFile}
              onClearAll={clearAllFiles}
              onShare={handleShareFiles}
              isElectron={isElectron}
            />
            
            <FileDropZone 
              peers={peers}
              onFileSend={handleFileSend}
              selectedFiles={selectedFiles}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
              onClearFiles={clearAllFiles}
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
          files={selectedFiles.map(filePath => {
            const parts = filePath.split(/[/\\]/);
            return { name: parts[parts.length - 1], path: filePath };
          })}
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
