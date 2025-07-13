import React from 'react';
import './FileSelector.css';

const FileSelector = ({ 
  selectedFiles, 
  onAddMore, 
  onRemoveFile, 
  onClearAll, 
  onShare, 
  isElectron = true 
}) => {
  const formatFileName = (filePath) => {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊',
      'ppt': '📋', 'pptx': '📋',
      'txt': '📄',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
      'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wmv': '🎬',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
      'zip': '📦', 'rar': '📦', '7z': '📦',
      'exe': '⚙️', 'msi': '⚙️',
      'js': '💻', 'html': '💻', 'css': '💻', 'json': '💻',
      'py': '🐍', 'java': '☕', 'cpp': '⚡'
    };
    return iconMap[extension] || '📄';
  };



  return (
    <div className="file-selector">
      <div className="file-selector-header">
        <h3>📁 File Selection</h3>
        <div className="file-count">
          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      {!isElectron && (
        <div className="web-limitation-notice">
          <p>📱 File selection is only available in the desktop app</p>
        </div>
      )}

      {selectedFiles.length > 0 ? (
        <div className="selected-files-container">
          <div className="selected-files-list">
            {selectedFiles.map((filePath, index) => (
              <div key={index} className="selected-file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(formatFileName(filePath))}</span>
                  <div className="file-details">
                    <div className="file-name">{formatFileName(filePath)}</div>
                    <div className="file-path">{filePath}</div>
                  </div>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => onRemoveFile(filePath)}
                  title="Remove this file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="file-actions">
            <button 
              className="btn btn-secondary"
              onClick={onAddMore}
              disabled={!isElectron}
              title={isElectron ? "Add more files to the selection" : "Only available in desktop app"}
            >
              ➕ Add More
            </button>
            <button 
              className="btn btn-danger"
              onClick={onClearAll}
              disabled={!isElectron}
              title={isElectron ? "Clear all selected files" : "Only available in desktop app"}
            >
              🗑️ Clear All
            </button>
            <button 
              className="btn btn-primary"
              onClick={onShare}
              disabled={!isElectron}
              title={isElectron ? "Share selected files via QR code" : "Only available in desktop app"}
            >
              📱 Share Files
            </button>
          </div>
        </div>
      ) : (
        <div className="no-files-selected">
          <div className="no-files-icon">📂</div>
          <h4>No files selected</h4>
          <p>
            {isElectron 
              ? "Click \"Add Files\" to start selecting files for sharing" 
              : "File selection is only available in the desktop app. Download the Electron version for full functionality."
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={onAddMore}
            disabled={!isElectron}
            title={isElectron ? "Select files to share" : "Only available in desktop app"}
          >
            📁 Add Files
          </button>
        </div>
      )}
    </div>
  );
};

export default FileSelector;
