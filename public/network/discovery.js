const EventEmitter = require('events');
const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');

class NetworkDiscovery extends EventEmitter {
  constructor() {
    super();
    this.port = 54321;
    this.multicastAddress = '224.0.0.251';
    this.socket = null;
    this.peers = new Map();
    this.deviceId = crypto.randomUUID();
    this.deviceInfo = {
      id: this.deviceId,
      name: os.hostname(),
      platform: os.platform(),
      type: 'desktop',
      ip: this.getLocalIP(),
      port: 54322, // Port for file transfer
      timestamp: Date.now()
    };
    this.announceInterval = null;
    this.cleanupInterval = null;
  }

  start() {
    try {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.socket.on('error', (err) => {
        console.error('Discovery socket error:', err);
        this.emit('error', err);
      });

      this.socket.on('message', (msg, rinfo) => {
        this.handleMessage(msg, rinfo);
      });

      this.socket.on('listening', () => {
        const address = this.socket.address();
        console.log(`Discovery service listening on ${address.address}:${address.port}`);
        
        // Join multicast group
        this.socket.addMembership(this.multicastAddress);
        
        // Start announcing presence
        this.startAnnouncing();
        
        // Start cleanup routine
        this.startCleanup();
      });

      this.socket.bind(this.port);
    } catch (error) {
      console.error('Failed to start discovery service:', error);
      this.emit('error', error);
    }
  }

  stop() {
    if (this.announceInterval) {
      clearInterval(this.announceInterval);
      this.announceInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.socket) {
      try {
        this.socket.dropMembership(this.multicastAddress);
        this.socket.close();
      } catch (error) {
        console.error('Error closing discovery socket:', error);
      }
      this.socket = null;
    }

    this.peers.clear();
  }

  handleMessage(msg, rinfo) {
    try {
      const data = JSON.parse(msg.toString());
      
      if (data.type === 'announce' && data.deviceId !== this.deviceId) {
        const peer = {
          id: data.deviceId,
          name: data.name,
          platform: data.platform,
          type: data.type,
          ip: rinfo.address,
          port: data.port,
          lastSeen: Date.now()
        };

        const existingPeer = this.peers.get(peer.id);
        if (!existingPeer) {
          this.peers.set(peer.id, peer);
          this.emit('peer-found', peer);
          console.log(`New peer found: ${peer.name} (${peer.ip})`);
        } else {
          // Update last seen time
          existingPeer.lastSeen = Date.now();
        }
      }
    } catch (error) {
      console.error('Error parsing discovery message:', error);
    }
  }

  startAnnouncing() {
    const announce = () => {
      const message = JSON.stringify({
        type: 'announce',
        deviceId: this.deviceId,
        name: this.deviceInfo.name,
        platform: this.deviceInfo.platform,
        type: this.deviceInfo.type,
        port: this.deviceInfo.port,
        timestamp: Date.now()
      });

      if (this.socket) {
        this.socket.send(message, this.port, this.multicastAddress, (err) => {
          if (err) {
            console.error('Error sending discovery announcement:', err);
          }
        });
      }
    };

    // Announce immediately
    announce();
    
    // Then announce every 5 seconds
    this.announceInterval = setInterval(announce, 5000);
  }

  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 15000; // 15 seconds timeout

      for (const [peerId, peer] of this.peers.entries()) {
        if (now - peer.lastSeen > timeout) {
          this.peers.delete(peerId);
          this.emit('peer-lost', peerId);
          console.log(`Peer lost: ${peer.name} (${peer.ip})`);
        }
      }
    }, 5000);
  }

  getPeers() {
    return Array.from(this.peers.values());
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
}

module.exports = { networkDiscovery: NetworkDiscovery };
