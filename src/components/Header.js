import React from 'react';
import './Header.css';

const Header = ({ deviceInfo, onQRCode, onShareFiles, isElectron = true }) => {
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'win32':
        return '🪟';
      case 'darwin':
        return '🍎';
      case 'linux':
        return '🐧';
      default:
        return '💻';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">LAN File Share</span>
          </div>
          {deviceInfo && (
            <div className="device-info">
              <span className="device-icon">{getPlatformIcon(deviceInfo.platform)}</span>
              <span className="device-name">{deviceInfo.name}</span>
              <span className="device-ip">{deviceInfo.ip}</span>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          {isElectron ? (
            <>
              <button 
                className="btn btn-secondary"
                onClick={onShareFiles}
                title="Share files via QR code for mobile devices"
              >
                📱 Share for Mobile
              </button>
              <button 
                className="btn btn-primary"
                onClick={onQRCode}
                title="Generate QR code for mobile access"
              >
                📷 QR Code
              </button>
            </>
          ) : (
            <div className="browser-notice">
              <span className="notice-text">🌐 Browser Preview Mode</span>
              <a 
                href="https://github.com/yourusername/lan-file-share" 
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                📥 Download Desktop App
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
