const EventEmitter = require('events');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class FileServer extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.server = null;
    this.port = 54323;
    this.sharedFiles = new Map();
    this.uploadDir = path.join(require('os').homedir(), 'Downloads', 'LAN File Share', 'uploads');
    this.isRunning = false;
  }

  async start(files = []) {
    if (this.isRunning) {
      await this.stop();
    }

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    this.setupRoutes();
    this.addFiles(files);

    // Try to find an available port starting from 54323
    return this.startWithAvailablePort();
  }

  async startWithAvailablePort(startPort = 54323, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const port = startPort + attempt;
      try {
        return await this.startOnPort(port);
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying ${port + 1}...`);
          continue;
        } else {
          throw error; // Re-throw non-port-conflict errors
        }
      }
    }
    throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
  }

  async startOnPort(port) {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.port = port; // Update the port number
        this.isRunning = true;
        const serverUrl = `http://${this.getLocalIP()}:${port}`;
        console.log(`File server started on ${serverUrl}`);
        resolve(serverUrl);
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          this.server = null;
          this.sharedFiles.clear();
          console.log('File server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  setupRoutes() {
    // Security middleware - relaxed for local network usage
    this.app.use((req, res, next) => {
      // Allow cross-origin requests for local network
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Basic security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow same origin for local use
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // More permissive CSP for local network usage
      res.setHeader('Content-Security-Policy', 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob: http: https:; " +
        "font-src 'self' data: http: https:; " +
        "connect-src 'self' http: https:; " +
        "object-src 'self';"
      );
      next();
    });

    // Serve static files
    this.app.use('/files', express.static(path.dirname('')));
    
    // Upload configuration
    const upload = multer({ 
      dest: this.uploadDir,
      limits: {
        fileSize: 1024 * 1024 * 1024 // 1GB limit
      }
    });

    // Main page
    this.app.get('/', (req, res) => {
      const html = this.generateMainPage();
      res.send(html);
    });

    // API to get shared files list
    this.app.get('/api/files', (req, res) => {
      const filesList = Array.from(this.sharedFiles.values()).map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      res.json(filesList);
    });

    // Download shared file
    this.app.get('/api/download/:fileId', (req, res) => {
      const file = this.sharedFiles.get(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File no longer exists' });
      }

      // Set proper headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', file.size);
      
      // Create read stream and pipe to response
      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Download stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      });
    });

    // Upload files from mobile devices
    this.app.post('/api/upload', upload.array('files'), (req, res) => {
      try {
        const uploadedFiles = req.files.map(file => {
          const originalName = file.originalname || 'unknown';
          const newPath = path.join(this.uploadDir, originalName);
          
          // Move file to proper location with original name
          fs.renameSync(file.path, newPath);
          
          return {
            name: originalName,
            size: file.size,
            path: newPath
          };
        });

        this.emit('files-uploaded', uploadedFiles);
        res.json({ 
          success: true, 
          files: uploadedFiles.map(f => ({ name: f.name, size: f.size }))
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
      }
    });

    // Generate QR code for the server URL
    this.app.get('/api/qr', async (req, res) => {
      try {
        const serverUrl = `http://${this.getLocalIP()}:${this.port}`;
        console.log('Generating QR code for URL:', serverUrl);
        
        // Generate QR code with better options for mobile scanning
        const qrCode = await QRCode.toDataURL(serverUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        console.log('QR code generated successfully');
        res.json({ qrCode, url: serverUrl });
      } catch (error) {
        console.error('QR code generation failed:', error);
        res.status(500).json({ error: 'Failed to generate QR code' });
      }
    });

    // Error handling
    this.app.use((error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
      }
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  addFiles(files) {
    files.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileId = uuidv4();
        
        this.sharedFiles.set(fileId, {
          id: fileId,
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          type: path.extname(filePath).substring(1) || 'unknown',
          addedAt: Date.now()
        });
      }
    });
  }

  generateMainPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LAN File Share</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .section {
            margin-bottom: 40px;
            padding: 20px;
            border-radius: 15px;
            background: #f8f9fa;
        }
        
        .section h2 {
            color: #555;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        
        .file-list {
            list-style: none;
        }
        
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .file-info {
            flex: 1;
        }
        
        .file-name {
            font-weight: bold;
            color: #333;
        }
        
        .file-size {
            color: #666;
            font-size: 0.9em;
        }
        
        .download-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            font-weight: bold;
            transition: background 0.3s;
        }
        
        .download-btn:hover {
            background: #0056b3;
        }
        
        .upload-area {
            border: 2px dashed #007bff;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-area:hover {
            border-color: #0056b3;
            background: #f0f8ff;
        }
        
        .upload-area.dragover {
            border-color: #28a745;
            background: #f0fff0;
        }
        
        #fileInput {
            display: none;
        }
        
        .upload-text {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        
        .upload-subtext {
            color: #999;
            font-size: 0.9em;
        }
        
        .qr-section {
            text-align: center;
        }
        
        #qrcode {
            margin: 20px auto;
            max-width: 200px;
        }
        
        .url-display {
            background: #e9ecef;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            word-break: break-all;
            margin-top: 10px;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: #28a745;
            width: 0%;
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LAN File Share</h1>
        
        <div class="section">
            <h2>📱 Share this page</h2>
            <div class="qr-section">
                <p>Scan QR code to access from mobile device:</p>
                <div id="qrcode"></div>
                <div class="url-display" id="serverUrl">Loading...</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📂 Available Files</h2>
            <ul class="file-list" id="fileList">
                <li style="text-align: center; color: #666;">Loading files...</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>📤 Upload Files</h2>
            <div class="upload-area" id="uploadArea">
                <div class="upload-text">Click here or drag files to upload</div>
                <div class="upload-subtext">Support for multiple files</div>
                <input type="file" id="fileInput" multiple>
            </div>
            <div id="uploadProgress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <div id="progressText">Uploading...</div>
            </div>
        </div>
    </div>

    <script>
        // Load QR code and server URL
        fetch('/api/qr')
            .then(response => response.json())
            .then(data => {
                const qrElement = document.getElementById('qrcode');
                qrElement.innerHTML = '<img src="' + data.qrCode + '" style="max-width: 100%;">';
                document.getElementById('serverUrl').textContent = data.url;
            });

        // Load file list
        function loadFiles() {
            fetch('/api/files')
                .then(response => response.json())
                .then(files => {
                    const fileList = document.getElementById('fileList');
                    if (files.length === 0) {
                        fileList.innerHTML = '<li style="text-align: center; color: #666;">No files shared</li>';
                        return;
                    }
                    
                    fileList.innerHTML = files.map(file => 
                        '<li class="file-item">' +
                            '<div class="file-info">' +
                                '<div class="file-name">' + file.name + '</div>' +
                                '<div class="file-size">' + formatBytes(file.size) + '</div>' +
                            '</div>' +
                            '<a href="/api/download/' + file.id + '" class="download-btn">Download</a>' +
                        '</li>'
                    ).join('');
                });
        }

        // Format file size
        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            uploadFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            uploadFiles(e.target.files);
        });

        function uploadFiles(files) {
            if (files.length === 0) return;

            const formData = new FormData();
            for (let file of files) {
                formData.append('files', file);
            }

            uploadProgress.style.display = 'block';
            progressText.textContent = 'Uploading ' + files.length + ' file(s)...';

            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    progressText.textContent = 'Upload complete!';
                    setTimeout(() => {
                        uploadProgress.style.display = 'none';
                        progressFill.style.width = '0%';
                        fileInput.value = '';
                        loadFiles();
                    }, 2000);
                } else {
                    progressText.textContent = 'Upload failed!';
                }
            });

            xhr.addEventListener('error', () => {
                progressText.textContent = 'Upload error!';
            });

            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        }

        // Initial load
        loadFiles();
        
        // Refresh files every 5 seconds
        setInterval(loadFiles, 5000);
    </script>
</body>
</html>`;
  }

  getLocalIP() {
    const os = require('os');
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

module.exports = { fileServer: FileServer };
