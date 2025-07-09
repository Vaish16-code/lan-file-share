import React from 'react';
import './WebNotice.css';

const WebNotice = () => {
  return (
    <div className="web-notice">
      <div className="web-notice-content">
        <div className="web-notice-icon">🌐</div>
        <div className="web-notice-text">
          <h2>LAN File Share - Web Preview</h2>
          <p>You're viewing the web version of LAN File Share. For full functionality including:</p>
          <ul>
            <li>🔍 Automatic device discovery</li>
            <li>📁 Direct file transfer</li>
            <li>📱 Mobile QR code sharing</li>
            <li>💻 Cross-platform support</li>
          </ul>
          <p>Please download and run the desktop application.</p>
        </div>
        <div className="web-notice-actions">
          <button className="btn btn-primary download-btn">
            📥 Download Desktop App
          </button>
          <button className="btn btn-secondary" onClick={() => window.open('https://github.com/yourusername/lan-file-share', '_blank')}>
            📖 View on GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebNotice;
