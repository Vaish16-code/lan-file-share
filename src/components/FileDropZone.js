import React, { useState, useRef } from 'react';
import './FileDropZone.css';

const FileDropZone = ({ peers, onFileSend, isElectron = true, selectedFiles = [], onAddFiles, onRemoveFile, onClearFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const filePaths = files.map(file => file.path).filter(Boolean);
      if (onAddFiles && filePaths.length > 0) {
        onAddFiles(filePaths);
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const filePaths = files.map(file => file.path || file.name).filter(Boolean);
      if (onAddFiles && filePaths.length > 0) {
        onAddFiles(filePaths);
      }
    }
    
    // Reset the input value to allow selecting the same files again
    e.target.value = '';
  };

  const handleSendFiles = async () => {
    if (!selectedPeer || selectedFiles.length === 0) return;
    
    try {
      await onFileSend(selectedFiles, selectedPeer);
      if (onClearFiles) {
        onClearFiles();
      }
      setSelectedPeer(null);
    } catch (error) {
      console.error('Send files error:', error);
    }
  };

  const removeFile = (filePath) => {
    if (onRemoveFile) {
      onRemoveFile(filePath);
    }
  };

  const clearFiles = () => {
    if (onClearFiles) {
      onClearFiles();
    }
    setSelectedPeer(null);
  };

  const formatFileSize = (path) => {
    // This would need to be implemented with actual file size detection
    // For now, return a placeholder
    return 'Unknown size';
  };

  return (
    <div className="file-drop-zone">
      <div className="section-header">
        <h2>📁 File Transfer</h2>
      </div>
      
      {!isElectron && (
        <div className="web-limitation-notice">
          <p>📱 File drag & drop is only available in the desktop app</p>
        </div>
      )}
      
      <div
        className={`drop-area ${isDragOver ? 'drag-over' : ''} ${!isElectron ? 'disabled' : ''}`}
        onDragOver={isElectron ? handleDragOver : undefined}
        onDragLeave={isElectron ? handleDragLeave : undefined}
        onDrop={isElectron ? handleDrop : undefined}
        onClick={isElectron ? handleFileSelect : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        
        <div className="drop-content">
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            <h3>
              {isElectron 
                ? selectedFiles.length > 0 
                  ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} ready to transfer`
                  : "Drop files here or click to select"
                : "File transfer demo"
              }
            </h3>
            <p>
              {isElectron 
                ? selectedFiles.length > 0
                  ? "Select a device below to send your files"
                  : "Select multiple files to send to nearby devices" 
                : "Download the desktop app for file transfer functionality"
              }
            </p>
            {isElectron && selectedFiles.length > 0 && (
              <div className="quick-actions">
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={handleFileSelect}
                  title="Add more files to selection"
                >
                  ➕ Add More
                </button>
                <button 
                  className="btn btn-danger btn-small" 
                  onClick={clearFiles}
                  title="Clear all selected files"
                >
                  🗑️ Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="send-section">
          <h3>Send to Device</h3>
          <div className="peer-selection">
            {peers.length === 0 ? (
              <div className="no-peers">
                <span>No devices available</span>
              </div>
            ) : (
              <div className="peers-grid">
                {peers.map((peer) => (
                  <div
                    key={peer.id}
                    className={`peer-option ${selectedPeer?.id === peer.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPeer(peer)}
                  >
                    <div className="peer-info">
                      <span className="peer-icon">
                        {peer.platform === 'win32' ? '🪟' : 
                         peer.platform === 'darwin' ? '🍎' : 
                         peer.platform === 'linux' ? '🐧' : '💻'}
                      </span>
                      <div className="peer-details">
                        <span className="peer-name">{peer.name}</span>
                        <span className="peer-ip">{peer.ip}</span>
                      </div>
                    </div>
                    {selectedPeer?.id === peer.id && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {selectedPeer && (
              <div className="send-actions">
                <button
                  className="btn btn-success send-files-btn"
                  onClick={handleSendFiles}
                  disabled={!isElectron}
                  title={isElectron ? `Send files to ${selectedPeer.name}` : "Only available in desktop app"}
                >
                  📤 Send {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} to {selectedPeer.name}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
