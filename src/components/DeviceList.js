import React, { useState } from 'react';
import './DeviceList.css';

const DeviceList = ({ peers, onFileSelect, onFileSend, isElectron = true }) => {
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'win32':
        return '🪟';
      case 'darwin':
        return '🍎';
      case 'linux':
        return '🐧';
      case 'android':
        return '🤖';
      case 'ios':
        return '📱';
      default:
        return '💻';
    }
  };

  const getDeviceTypeIcon = (type) => {
    switch (type) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📟';
      case 'desktop':
        return '💻';
      default:
        return '📡';
    }
  };

  const handleSendFile = async (peer) => {
    if (isTransferring || !isElectron) return;
    
    try {
      setIsTransferring(true);
      const filePaths = await onFileSelect();
      if (filePaths.length > 0) {
        await onFileSend(filePaths, peer);
      }
    } catch (error) {
      console.error('File send error:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e, peer) => {
    e.preventDefault();
    if (isTransferring || !isElectron) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const filePaths = files.map(file => file.path).filter(Boolean);
      if (filePaths.length > 0) {
        try {
          setIsTransferring(true);
          await onFileSend(filePaths, peer);
        } catch (error) {
          console.error('Drop file send error:', error);
        } finally {
          setIsTransferring(false);
        }
      }
    }
  };

  const formatLastSeen = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 10000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="device-list">
      <div className="section-header">
        <h2>📡 Discovered Devices</h2>
        <span className="device-count">{peers.length} device{peers.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="devices-container">
        {!isElectron ? (
          <div className="browser-demo-notice">
            <div className="demo-icon">🌐</div>
            <div className="demo-text">
              <h3>Browser Preview Mode</h3>
              <p>You're viewing demo devices. Download the desktop app for real device discovery and file sharing.</p>
            </div>
          </div>
        ) : null}
        
        {peers.length === 0 ? (
          <div className="no-devices">
            <div className="no-devices-icon">🔍</div>
            <div className="no-devices-text">
              <h3>No devices found</h3>
              <p>Make sure other devices are running LAN File Share and connected to the same network.</p>
            </div>
          </div>
        ) : (
          <div className="devices-grid">
            {peers.map((peer) => (
              <div
                key={peer.id}
                className={`device-card ${selectedPeer?.id === peer.id ? 'selected' : ''} ${!isElectron ? 'disabled' : ''}`}
                onClick={() => setSelectedPeer(selectedPeer?.id === peer.id ? null : peer)}
                onDragOver={isElectron ? handleDragOver : undefined}
                onDrop={isElectron ? (e) => handleDrop(e, peer) : undefined}
              >
                <div className="device-header">
                  <div className="device-icons">
                    <span className="platform-icon">{getPlatformIcon(peer.platform)}</span>
                    <span className="type-icon">{getDeviceTypeIcon(peer.type)}</span>
                  </div>
                  <div className="device-status">
                    <div className="status-indicator online"></div>
                  </div>
                </div>
                
                <div className="device-info">
                  <h3 className="device-name">{peer.name}</h3>
                  <div className="device-details">
                    <span className="device-ip">{peer.ip}</span>
                    <span className="device-platform">{peer.platform}</span>
                  </div>
                  {peer.lastSeen && (
                    <div className="last-seen">
                      {formatLastSeen(peer.lastSeen)}
                    </div>
                  )}
                </div>
                
                <div className="device-actions">
                  <button
                    className="btn btn-primary send-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendFile(peer);
                    }}
                    disabled={isTransferring || !isElectron}
                    title={isElectron ? (isTransferring ? 'Sending...' : 'Send files to this device') : 'Only available in desktop app'}
                  >
                    {isTransferring ? '📤 Sending...' : '📤 Send File'}
                  </button>
                </div>
                
                {isElectron && (
                  <div className="drop-zone-overlay">
                    <div className="drop-zone-content">
                      <span className="drop-icon">📁</span>
                      <span className="drop-text">Drop files here</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="discovery-status">
        <div className="discovery-indicator">
          <div className="pulse-dot"></div>
          <span>Scanning for devices...</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceList;
