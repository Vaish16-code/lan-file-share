// Component import test
import React from 'react';

// Test all component imports
import DeviceList from './src/components/DeviceList';
import FileDropZone from './src/components/FileDropZone';
import TransferStatus from './src/components/TransferStatus';
import QRCodeModal from './src/components/QRCodeModal';
import Header from './src/components/Header';
import Notifications from './src/components/Notifications';
import WebNotice from './src/components/WebNotice';

console.log('Testing component imports...');

console.log('DeviceList:', typeof DeviceList);
console.log('FileDropZone:', typeof FileDropZone);
console.log('TransferStatus:', typeof TransferStatus);
console.log('QRCodeModal:', typeof QRCodeModal);
console.log('Header:', typeof Header);
console.log('Notifications:', typeof Notifications);
console.log('WebNotice:', typeof WebNotice);

console.log('All component imports successful!');
