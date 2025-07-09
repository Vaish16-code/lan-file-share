import React from 'react';
import './TransferStatus.css';

const TransferStatus = ({ transfers }) => {
  const activeTransfers = transfers.filter(t => !t.completed && !t.error);
  const completedTransfers = transfers.filter(t => t.completed || t.error);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTransferSpeed = (bytesTransferred, timeElapsed) => {
    if (!timeElapsed || timeElapsed === 0) return '0 KB/s';
    const bytesPerSecond = bytesTransferred / (timeElapsed / 1000);
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const getTransferIcon = (transfer) => {
    if (transfer.error) return '❌';
    if (transfer.completed) return '✅';
    return transfer.type === 'outgoing' ? '📤' : '📥';
  };

  const getTransferTypeText = (type) => {
    return type === 'outgoing' ? 'Sending' : 'Receiving';
  };

  return (
    <div className="transfer-status">
      <div className="section-header">
        <h2>📊 Transfer Status</h2>
        {activeTransfers.length > 0 && (
          <span className="active-count">{activeTransfers.length} active</span>
        )}
      </div>
      
      {transfers.length === 0 ? (
        <div className="no-transfers">
          <div className="no-transfers-icon">📡</div>
          <div className="no-transfers-text">
            <h3>No transfers yet</h3>
            <p>File transfers will appear here when you send or receive files.</p>
          </div>
        </div>
      ) : (
        <div className="transfers-container">
          {/* Active Transfers */}
          {activeTransfers.length > 0 && (
            <div className="transfers-section">
              <h3 className="section-title">Active Transfers</h3>
              <div className="transfers-list">
                {activeTransfers.map((transfer) => (
                  <div key={transfer.transferId} className="transfer-item active">
                    <div className="transfer-header">
                      <div className="transfer-info">
                        <span className="transfer-icon">{getTransferIcon(transfer)}</span>
                        <div className="transfer-details">
                          <span className="file-name">{transfer.fileName}</span>
                          <span className="transfer-type">
                            {getTransferTypeText(transfer.type)}
                          </span>
                        </div>
                      </div>
                      <div className="transfer-progress-text">
                        {Math.round(transfer.progress || 0)}%
                      </div>
                    </div>
                    
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${transfer.progress || 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="transfer-stats">
                      <span className="transfer-size">
                        {formatFileSize(transfer.bytesSent || transfer.bytesReceived || 0)} / {formatFileSize(transfer.fileSize || transfer.totalBytes)}
                      </span>
                      <span className="transfer-speed">
                        {formatTransferSpeed(
                          transfer.bytesSent || transfer.bytesReceived || 0,
                          Date.now() - (transfer.startTime || Date.now())
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Completed Transfers */}
          {completedTransfers.length > 0 && (
            <div className="transfers-section">
              <h3 className="section-title">Recent Transfers</h3>
              <div className="transfers-list">
                {completedTransfers.slice(-5).reverse().map((transfer) => (
                  <div 
                    key={transfer.transferId} 
                    className={`transfer-item ${transfer.error ? 'error' : 'completed'}`}
                  >
                    <div className="transfer-header">
                      <div className="transfer-info">
                        <span className="transfer-icon">{getTransferIcon(transfer)}</span>
                        <div className="transfer-details">
                          <span className="file-name">{transfer.fileName}</span>
                          <span className="transfer-type">
                            {transfer.error ? 'Failed' : 'Completed'} • {getTransferTypeText(transfer.type)}
                          </span>
                        </div>
                      </div>
                      <div className="transfer-result">
                        {transfer.error ? (
                          <span className="error-text">Failed</span>
                        ) : (
                          <span className="success-text">✓</span>
                        )}
                      </div>
                    </div>
                    
                    {transfer.error && (
                      <div className="error-message">
                        {transfer.error}
                      </div>
                    )}
                    
                    {transfer.filePath && !transfer.error && (
                      <div className="file-location">
                        <span>Saved to: {transfer.filePath}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferStatus;
