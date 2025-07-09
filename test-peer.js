// Simple test script to simulate a second device for testing discovery
const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');

const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const port = 54321;
const multicastAddress = '224.0.0.251';
const deviceId = crypto.randomUUID();

const deviceInfo = {
  id: deviceId,
  name: 'Test-Device-' + Math.floor(Math.random() * 1000),
  platform: os.platform(),
  type: 'desktop',
  port: 54323 // Different port for file transfer
};

console.log(`Starting test peer: ${deviceInfo.name}`);

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

socket.on('message', (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.type === 'announce' && data.deviceId !== deviceId) {
      console.log(`Discovered peer: ${data.name} from ${rinfo.address}`);
    }
  } catch (error) {
    // Ignore invalid messages
  }
});

socket.on('listening', () => {
  console.log('Test peer listening on port', port);
  socket.addMembership(multicastAddress);
  
  // Send announcement every 2 seconds
  setInterval(() => {
    const message = JSON.stringify({
      type: 'announce',
      deviceId: deviceId,
      name: deviceInfo.name,
      platform: deviceInfo.platform,
      type: deviceInfo.type,
      port: deviceInfo.port,
      timestamp: Date.now()
    });
    
    socket.send(message, port, multicastAddress, (err) => {
      if (err) {
        console.error('Error sending announcement:', err);
      } else {
        console.log(`Announced: ${deviceInfo.name}`);
      }
    });
  }, 2000);
});

socket.bind(port);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down test peer...');
  socket.close();
  process.exit();
});
