import React, { useState, useEffect } from 'react';
import './QRCodeModal.css';

function QRCodeModal({ url, onClose, files = [] }) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('Starting server...');

  useEffect(() => {
    if (url) {
      console.log('🚀 QR Modal opened for URL:', url);
      generateQRCode();
    } else {
      console.error('❌ No server URL provided to QR modal');
      setError('No server URL provided');
      setLoading(false);
      setServerStatus('🔴 Server not started');
    }
  }, [url]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setServerStatus('🔄 Generating QR code...');
      
      console.log('🔄 Requesting QR code generation for URL:', url);
      
      if (window.electronAPI && window.electronAPI.generateQRCode) {
        // Use Electron's QR code generation
        const result = await window.electronAPI.generateQRCode(url);
        
        if (result.success) {
          console.log('✅ QR code generated successfully via Electron!');
          setQrCodeData({
            dataURL: result.dataURL,
            url: url,
            qrPageUrl: `${url}/api/qr`
          });
          setServerStatus('🟢 Server online - QR code ready for scanning');
        } else {
          throw new Error(result.error || 'QR generation failed');
        }
      } else {
        // Fallback: show URL for manual entry
        console.log('⚠️ Electron API not available, showing URL for manual entry');
        setQrCodeData({
          dataURL: null,
          url: url,
          qrPageUrl: `${url}/api/qr`
        });
        setServerStatus('🟡 Manual URL entry mode');
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error.message);
      
      setError(`QR Generation Failed: ${error.message}`);
      setLoading(false);
      setServerStatus('🔴 QR generation error - Using URL manually');
      
      // Still show the URL for manual entry
      setQrCodeData({
        dataURL: null,
        url: url,
        qrPageUrl: `${url}/api/qr`
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('URL copied to clipboard!');
    });
  };

  const refreshQR = () => {
    generateQRCode();
  };

  if (!url) {
    return null;
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={e => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>📱 Mobile File Access</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="qr-modal-content">
          <div className="server-status">
            <p className="status-text">{serverStatus}</p>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Generating QR code...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p className="error-text">❌ {error}</p>
              <button className="btn btn-secondary" onClick={refreshQR}>
                🔄 Retry
              </button>
            </div>
          )}

          {qrCodeData && !loading && (
            <div className="qr-container">
              {qrCodeData.dataURL ? (
                <div className="qr-image-container">
                  <img 
                    src={qrCodeData.dataURL} 
                    alt="QR Code for file sharing" 
                    className="qr-image"
                  />
                  <p className="qr-instructions">
                    📱 Scan with your mobile device to access shared files
                  </p>
                </div>
              ) : (
                <div className="manual-url-container">
                  <p className="manual-instructions">
                    📱 Open this URL on your mobile device:
                  </p>
                  <div className="url-display">
                    <input 
                      type="text" 
                      value={url} 
                      readOnly 
                      className="url-input"
                    />
                    <button 
                      className="btn btn-primary copy-btn" 
                      onClick={copyToClipboard}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="file-info">
                <h3>📁 Shared Files ({files.length})</h3>
                {files.length > 0 ? (
                  <ul className="file-list">
                    {files.slice(0, 5).map((file, index) => (
                      <li key={index} className="file-item">
                        📄 {file.name || file}
                      </li>
                    ))}
                    {files.length > 5 && (
                      <li className="file-item more-files">
                        ... and {files.length - 5} more files
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="no-files">No files currently shared</p>
                )}
              </div>

              <div className="qr-actions">
                <button className="btn btn-secondary" onClick={refreshQR}>
                  🔄 Refresh QR
                </button>
                <button className="btn btn-primary" onClick={copyToClipboard}>
                  📋 Copy URL
                </button>
                {qrCodeData.qrPageUrl && (
                  <a 
                    href={qrCodeData.qrPageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-success"
                  >
                    🔗 Open QR Page
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRCodeModal;