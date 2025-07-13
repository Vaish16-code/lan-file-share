import React, { useState, useRef } from 'react';
import './FileDropZone.css';

const FileDropZone = ({ peers, onFileSend, isElectron = true }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
      setSelectedFiles(filePaths.map(path => ({ path, name: path.split('\\').pop().split('/').pop() })));
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const filePaths = files.map(file => file.path || file.name).filter(Boolean);
      setSelectedFiles(filePaths.map(path => ({ path, name: path.split('\\').pop().split('/').pop() })));
    }
  };

  const handleSendFiles = async () => {
    if (!selectedPeer || selectedFiles.length === 0) return;
    
    try {
      const filePaths = selectedFiles.map(file => file.path);
      await onFileSend(filePaths, selectedPeer);
      setSelectedFiles([]);
      setSelectedPeer(null);
    } catch (error) {
      console.error('Send files error:', error);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
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
          {selectedFiles.length === 0 ? (
            <>
              <div className="drop-icon">📁</div>
              <div className="drop-text">
                <h3>
                  {isElectron 
                    ? "Drop files here or click to select" 
                    : "File transfer demo"
                  }
                </h3>
                <p>
                  {isElectron 
                    ? "Select multiple files to send to nearby devices" 
                    : "Download the desktop app for file transfer functionality"
                  }
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="files-preview">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <div className="files-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.path)}</span>
                        </div>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="file-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={clearFiles}
                    disabled={!isElectron}
                    title={isElectron ? "Clear all files" : "Only available in desktop app"}
                  >
                    Clear All
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleFileSelect}
                    disabled={!isElectron}
                    title={isElectron ? "Add more files" : "Only available in desktop app"}
                  >
                    Add More
                  </button>
                </div>
              </div>
            </>
          )}
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
