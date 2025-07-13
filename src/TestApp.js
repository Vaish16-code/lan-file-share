import React from 'react';
import './App.css';

// Test imports one by one
import Header from './components/Header';
import DeviceList from './components/DeviceList';
import FileDropZone from './components/FileDropZone';
import TransferStatus from './components/TransferStatus';
import Notifications from './components/Notifications';
import WebNotice from './components/WebNotice';
import QRCodeModal from './components/QRCodeModal';

function TestApp() {
  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <div className="content-grid">
          <div className="left-panel">
            <DeviceList peers={[]} deviceInfo={null} />
            <FileDropZone onFilesSelected={() => {}} />
          </div>
          <div className="right-panel">
            <TransferStatus transfers={[]} />
            <Notifications notifications={[]} />
          </div>
        </div>
      </div>
      <WebNotice />
      <QRCodeModal url="http://test.com" onClose={() => {}} />
    </div>
  );
}

export default TestApp;
