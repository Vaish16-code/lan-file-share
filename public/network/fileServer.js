const EventEmitter = require('events');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const QRCodeGenerator = require('./qrGenerator');

class FileServer extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.server = null;
    this.port = 54323;
    this.sharedFiles = new Map();
    this.uploadDir = path.join(os.homedir(), 'Downloads', 'LAN File Share', 'uploads');
    this.isRunning = false;
    this.qrGenerator = new QRCodeGenerator();
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

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        filesCount: this.sharedFiles.size,
        port: this.port,
        ip: this.getLocalIP()
      });
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

      try {
        // Set proper headers for secure download
        const filename = encodeURIComponent(file.name);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', file.size);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Add security headers to make download trusted
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Download-Options', 'noopen');
        
        console.log(`📥 Starting download: ${file.name} (${file.size} bytes)`);
        
        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(file.path);
        
        fileStream.on('error', (error) => {
          console.error('📥 Download stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
          }
        });
        
        fileStream.on('end', () => {
          console.log(`✅ Download completed: ${file.name}`);
        });
        
        fileStream.pipe(res);
        
      } catch (error) {
        console.error('📥 Download error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
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
      const serverUrl = `http://${this.getLocalIP()}:${this.port}`;
      console.log('🔄 QR API requested for URL:', serverUrl);
      
      try {
        // First try the custom QR generator
        console.log('🔨 Attempting QR generation with custom generator...');
        const qrResult = await this.qrGenerator.generateQRCode(serverUrl);
        
        if (qrResult.success && qrResult.dataURL) {
          console.log('✅ QR code generated successfully with custom generator');
          
          // Return QR code page with auto-redirect
          const qrPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 LAN File Share - QR Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            color: #333;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .qr-image {
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .redirect-btn {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .redirect-btn:hover {
            transform: scale(1.05);
        }
        .url-text {
            word-break: break-all;
            background: #f5f5f5;
            padding: 10px;
            border-radius: 8px;
            margin: 15px 0;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LAN File Share</h1>
        <p>Scan QR code or click the button below:</p>
        <img src="${qrResult.dataURL}" alt="QR Code" class="qr-image" width="200" height="200">
        <div class="url-text">${serverUrl}</div>
        <a href="${serverUrl}" class="redirect-btn">📱 Open File Share</a>
        <br>
        <button onclick="copyUrl()" class="redirect-btn">📋 Copy Link</button>
    </div>
    
    <script>
        function copyUrl() {
            navigator.clipboard.writeText('${serverUrl}').then(() => {
                alert('Link copied to clipboard!');
            }).catch(() => {
                prompt('Copy this URL:', '${serverUrl}');
            });
        }
        
        // Auto-redirect after 3 seconds if accessed directly
        const params = new URLSearchParams(window.location.search);
        if (params.get('auto') === 'true') {
            setTimeout(() => {
                window.location.href = '${serverUrl}';
            }, 3000);
        }
    </script>
</body>
</html>`;
          
          res.send(qrPage);
          return;
        }
        
        // If custom generator fails, try direct QRCode
        console.log('⚠️ Custom generator failed, trying direct QRCode...');
        const directQRCode = await QRCode.toDataURL(serverUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        console.log('✅ QR code generated successfully with direct method');
        res.json({ 
          qrCode: directQRCode, 
          url: serverUrl,
          success: true,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error('❌ All QR generation methods failed:', error.message);
        console.error('🔍 Error stack:', error.stack);
        
        res.status(500).json({ 
          error: 'Failed to generate QR code',
          message: error.message,
          success: false,
          timestamp: Date.now()
        });
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
    const filesList = Array.from(this.sharedFiles.values());
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 LAN File Share - Mobile Access</title>
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
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .connection-info {
            margin-top: 15px;
            padding: 15px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(102, 126, 234, 0.2);
        }
        
        .connection-info p {
            margin: 5px 0;
            font-size: 0.9em;
        }
        
        .share-link {
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
            word-break: break-all;
        }
        
        .share-link:hover {
            text-decoration: underline;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-card .label {
            color: #666;
            font-size: 0.9em;
        }
        
        .files-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .files-header h2 {
            font-size: 1.8em;
            color: #333;
        }
        
        .refresh-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9em;
            transition: transform 0.2s;
        }
        
        .refresh-btn:hover {
            transform: scale(1.05);
        }
        
        .file-grid {
            display: grid;
            gap: 15px;
        }
        
        .file-item {
            background: white;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 2px solid transparent;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .file-item:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }
        
        .file-info {
            display: flex;
            align-items: center;
            flex: 1;
        }
        
        .file-icon {
            font-size: 2.5em;
            margin-right: 15px;
        }
        
        .file-details h3 {
            margin-bottom: 5px;
            color: #333;
            font-size: 1.1em;
        }
        
        .file-size {
            color: #666;
            font-size: 0.9em;
        }
        
        .download-btn {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .download-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }
        
        .download-btn:active {
            transform: scale(0.95);
        }
        
        .no-files {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .no-files .icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        
        .upload-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-top: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            background: rgba(102, 126, 234, 0.05);
            transition: all 0.3s ease;
        }
        
        .upload-area:hover,
        .upload-area.dragover {
            background: rgba(102, 126, 234, 0.1);
            border-color: #764ba2;
        }
        
        .upload-input {
            display: none;
        }
        
        .upload-label {
            cursor: pointer;
            display: inline-block;
        }
        
        .upload-icon {
            font-size: 3em;
            margin-bottom: 15px;
            color: #667eea;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #eee;
            border-radius: 3px;
            margin: 10px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .files-section { padding: 20px; }
            .file-item { 
                flex-direction: column; 
                align-items: flex-start;
                gap: 15px;
            }
            .download-btn { 
                align-self: stretch;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LAN File Share</h1>
            <p>Mobile File Access Portal</p>
            <div class="connection-info">
                <p><strong>✅ Connected to:</strong> ${this.getLocalIP()}:${this.port}</p>
                <p><strong>📱 Share this link:</strong> <a href="http://${this.getLocalIP()}:${this.port}" class="share-link">http://${this.getLocalIP()}:${this.port}</a></p>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="number">${filesList.length}</div>
                <div class="label">Available Files</div>
            </div>
            <div class="stat-card">
                <div class="number" id="total-size">${this.formatBytes(filesList.reduce((total, file) => total + file.size, 0))}</div>
                <div class="label">Total Size</div>
            </div>
            <div class="stat-card">
                <div class="number">📱</div>
                <div class="label">Mobile Ready</div>
            </div>
        </div>
        
        <div class="files-section">
            <div class="files-header">
                <h2>📁 Available Files</h2>
                <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh</button>
            </div>
            
            <div class="file-grid" id="file-list">
                ${filesList.length > 0 ? filesList.map(file => `
                    <div class="file-item">
                        <div class="file-info">
                            <div class="file-icon">${this.getFileIcon(file.type)}</div>
                            <div class="file-details">
                                <h3>${file.name}</h3>
                                <div class="file-size">${this.formatBytes(file.size)}</div>
                            </div>
                        </div>
                        <button class="download-btn" onclick="downloadFile('${file.id}', '${file.name}')">
                            ⬇️ Download
                        </button>
                    </div>
                `).join('') : `
                    <div class="no-files">
                        <div class="icon">📭</div>
                        <h3>No files available</h3>
                        <p>Files will appear here when shared from the desktop app</p>
                    </div>
                `}
            </div>
        </div>
        
        <div class="upload-section">
            <h2 style="margin-bottom: 20px;">📤 Upload Files</h2>
            <div class="upload-area" id="upload-area">
                <label for="file-input" class="upload-label">
                    <div class="upload-icon">📎</div>
                    <h3>Drop files here or click to select</h3>
                    <p>Share files from your mobile device</p>
                </label>
                <input type="file" id="file-input" class="upload-input" multiple>
                <div class="progress-bar" id="progress-bar" style="display: none;">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <div id="upload-status"></div>
            </div>
        </div>
    </div>

    <script>
        function downloadFile(fileId, fileName) {
            const downloadBtn = event.target;
            const originalText = downloadBtn.innerHTML;
            
            downloadBtn.innerHTML = '⏳ Downloading...';
            downloadBtn.disabled = true;
            
            try {
                // Method 1: Try direct download with proper headers
                const downloadUrl = '/api/download/' + fileId;
                
                // Create a temporary anchor element
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                link.style.display = 'none';
                
                // Add to DOM and trigger click
                document.body.appendChild(link);
                link.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(link);
                    downloadBtn.innerHTML = '✅ Downloaded!';
                    downloadBtn.disabled = false;
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        downloadBtn.innerHTML = originalText;
                    }, 3000);
                }, 500);
                
            } catch (error) {
                console.error('Download error:', error);
                downloadBtn.innerHTML = '❌ Failed';
                downloadBtn.disabled = false;
                
                // Fallback: Open in new tab
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    window.open('/api/download/' + fileId, '_blank');
                }, 2000);
            }
        }
        
        // Alternative secure download function
        function secureDownload(fileId, fileName) {
            fetch('/api/download/' + fileId)
                .then(response => {
                    if (!response.ok) throw new Error('Download failed');
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                })
                .catch(error => {
                    console.error('Secure download failed:', error);
                    alert('Download failed. Please try again.');
                });
        }
        
        // File upload functionality
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        const progressBar = document.getElementById('progress-bar');
        const progressFill = document.getElementById('progress-fill');
        const uploadStatus = document.getElementById('upload-status');
        
        fileInput.addEventListener('change', handleFileUpload);
        
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
            fileInput.files = e.dataTransfer.files;
            handleFileUpload();
        });
        
        function handleFileUpload() {
            const files = fileInput.files;
            if (files.length === 0) return;
            
            const formData = new FormData();
            for (let file of files) {
                formData.append('files', file);
            }
            
            progressBar.style.display = 'block';
            uploadStatus.innerHTML = 'Uploading files...';
            
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressFill.style.width = percentComplete + '%';
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    uploadStatus.innerHTML = '✅ Upload successful!';
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    uploadStatus.innerHTML = '❌ Upload failed';
                }
                progressBar.style.display = 'none';
            });
            
            xhr.addEventListener('error', () => {
                uploadStatus.innerHTML = '❌ Upload error';
                progressBar.style.display = 'none';
            });
            
            xhr.open('POST', '/api/upload');
            xhr.send(formData);
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            window.location.reload();
        }, 30000);
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType) {
    const iconMap = {
      'pdf': '📄',
      'doc': '📝', 'docx': '📝',
      'xls': '📊', 'xlsx': '📊',
      'ppt': '📋', 'pptx': '📋',
      'txt': '📄',
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
      'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'wmv': '🎬',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
      'zip': '📦', 'rar': '📦', '7z': '📦',
      'exe': '⚙️', 'msi': '⚙️',
      'js': '💻', 'html': '💻', 'css': '💻', 'json': '💻',
      'py': '🐍', 'java': '☕', 'cpp': '⚡'
    };
    return iconMap[fileType.toLowerCase()] || '📄';
  }
}

module.exports = FileServer;
