// Network diagnostic script
const dgram = require('dgram');
const os = require('os');

console.log('=== Network Diagnostic ===\n');

// Get network interfaces
const interfaces = os.networkInterfaces();
console.log('Available Network Interfaces:');
Object.keys(interfaces).forEach(name => {
  interfaces[name].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      console.log(`  ${name}: ${interface.address} (${interface.netmask})`);
    }
  });
});

// Test multicast
const testSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const multicastAddress = '224.0.0.251';
const port = 54321;

testSocket.on('error', (err) => {
  console.error('\n❌ Multicast test failed:', err.message);
  if (err.code === 'EACCES') {
    console.log('   This might be a firewall/permission issue');
  }
  process.exit(1);
});

testSocket.on('listening', () => {
  console.log('\n✅ UDP socket bound successfully');
  try {
    testSocket.addMembership(multicastAddress);
    console.log('✅ Multicast membership added successfully');
    console.log(`✅ Listening for announcements on ${multicastAddress}:${port}`);
    
    setTimeout(() => {
      console.log('\n📡 Sending test announcement...');
      const testMessage = JSON.stringify({
        type: 'test',
        message: 'Network diagnostic test',
        timestamp: Date.now()
      });
      
      testSocket.send(testMessage, port, multicastAddress, (err) => {
        if (err) {
          console.error('❌ Failed to send test message:', err.message);
        } else {
          console.log('✅ Test message sent successfully');
        }
      });
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to join multicast group:', error.message);
    process.exit(1);
  }
});

testSocket.on('message', (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.type === 'test') {
      console.log(`✅ Received our own test message from ${rinfo.address}`);
      console.log('✅ Multicast is working correctly!');
      process.exit(0);
    }
  } catch (error) {
    // Ignore non-JSON messages
  }
});

console.log('\n🔍 Testing multicast functionality...');
testSocket.bind(port);

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n⚠️  No multicast response received within 5 seconds');
  console.log('   This might indicate firewall or network configuration issues');
  process.exit(1);
}, 5000);
