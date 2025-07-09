const EventEmitter = require('events');
const net = require('net');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class FileTransfer extends EventEmitter {
  constructor() {
    super();
    this.port = 54322;
    this.server = null;
    this.activeTransfers = new Map();
    this.downloadDir = path.join(require('os').homedir(), 'Downloads', 'LAN File Share');
  }

  start() {
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    this.server = net.createServer((socket) => {
      this.handleIncomingConnection(socket);
    });

    this.server.on('error', (err) => {
      console.error('File transfer server error:', err);
      this.emit('error', err);
    });

    this.server.listen(this.port, () => {
      console.log(`File transfer server listening on port ${this.port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Cancel active transfers
    for (const [transferId, transfer] of this.activeTransfers.entries()) {
      if (transfer.socket) {
        transfer.socket.destroy();
      }
    }
    this.activeTransfers.clear();
  }

  async sendFile(filePath, targetPeer) {
    return new Promise((resolve, reject) => {
      const transferId = uuidv4();
      
      if (!fs.existsSync(filePath)) {
        reject(new Error('File does not exist'));
        return;
      }

      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      
      const socket = new net.Socket();
      const transfer = {
        id: transferId,
        socket,
        fileName,
        fileSize: stats.size,
        bytesSent: 0,
        startTime: Date.now()
      };

      this.activeTransfers.set(transferId, transfer);

      socket.connect(targetPeer.port, targetPeer.ip, () => {
        console.log(`Connected to ${targetPeer.name} for file transfer`);
        
        // Send file metadata
        const metadata = {
          type: 'file-metadata',
          transferId,
          fileName,
          fileSize: stats.size,
          checksum: this.calculateChecksum(filePath)
        };

        socket.write(JSON.stringify(metadata) + '\n');

        // Send file data
        const readStream = fs.createReadStream(filePath);
        
        readStream.on('data', (chunk) => {
          transfer.bytesSent += chunk.length;
          
          // Emit progress
          this.emit('transfer-progress', {
            transferId,
            fileName,
            bytesSent: transfer.bytesSent,
            totalBytes: transfer.fileSize,
            progress: (transfer.bytesSent / transfer.fileSize) * 100
          });
        });

        readStream.on('end', () => {
          console.log(`File transfer completed: ${fileName}`);
          this.emit('transfer-complete', {
            transferId,
            fileName,
            success: true
          });
          
          this.activeTransfers.delete(transferId);
          socket.end();
          resolve({ transferId, success: true });
        });

        readStream.on('error', (err) => {
          console.error('Error reading file:', err);
          this.emit('transfer-error', {
            transferId,
            fileName,
            error: err.message
          });
          
          this.activeTransfers.delete(transferId);
          socket.destroy();
          reject(err);
        });

        readStream.pipe(socket, { end: false });
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
        this.emit('transfer-error', {
          transferId,
          fileName,
          error: err.message
        });
        
        this.activeTransfers.delete(transferId);
        reject(err);
      });

      socket.on('close', () => {
        this.activeTransfers.delete(transferId);
      });
    });
  }

  handleIncomingConnection(socket) {
    let metadata = null;
    let writeStream = null;
    let receivedBytes = 0;
    let buffer = '';

    socket.on('data', (data) => {
      if (!metadata) {
        // First, receive metadata
        buffer += data.toString();
        const newlineIndex = buffer.indexOf('\n');
        
        if (newlineIndex !== -1) {
          const metadataStr = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);
          
          try {
            metadata = JSON.parse(metadataStr);
            
            if (metadata.type === 'file-metadata') {
              const filePath = path.join(this.downloadDir, metadata.fileName);
              writeStream = fs.createWriteStream(filePath);
              
              console.log(`Receiving file: ${metadata.fileName} (${metadata.fileSize} bytes)`);
              
              this.emit('file-received', {
                transferId: metadata.transferId,
                fileName: metadata.fileName,
                fileSize: metadata.fileSize,
                filePath
              });

              // Process any remaining data in buffer
              if (buffer.length > 0) {
                const bufferData = Buffer.from(buffer, 'binary');
                writeStream.write(bufferData);
                receivedBytes += bufferData.length;
                buffer = '';
              }
            }
          } catch (err) {
            console.error('Error parsing metadata:', err);
            socket.destroy();
            return;
          }
        }
      } else {
        // Receive file data
        writeStream.write(data);
        receivedBytes += data.length;

        // Emit progress
        this.emit('transfer-progress', {
          transferId: metadata.transferId,
          fileName: metadata.fileName,
          bytesReceived: receivedBytes,
          totalBytes: metadata.fileSize,
          progress: (receivedBytes / metadata.fileSize) * 100
        });

        // Check if transfer is complete
        if (receivedBytes >= metadata.fileSize) {
          writeStream.end();
          
          this.emit('transfer-complete', {
            transferId: metadata.transferId,
            fileName: metadata.fileName,
            success: true,
            filePath: writeStream.path
          });
          
          socket.end();
        }
      }
    });

    socket.on('error', (err) => {
      console.error('Incoming connection error:', err);
      if (writeStream) {
        writeStream.destroy();
      }
    });

    socket.on('close', () => {
      if (writeStream && !writeStream.destroyed) {
        writeStream.end();
      }
    });
  }

  calculateChecksum(filePath) {
    const hash = crypto.createHash('md5');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  }

  getActiveTransfers() {
    return Array.from(this.activeTransfers.values());
  }
}

module.exports = { fileTransfer: FileTransfer };
