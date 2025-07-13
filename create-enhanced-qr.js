const QRCodeGenerator = require('./public/network/qrGenerator');

async function createMobileQRCode() {
  console.log('📱 Creating enhanced mobile QR code...');
  
  const serverUrl = 'http://192.168.29.127:54326';
  const qrGenerator = new QRCodeGenerator();
  
  try {
    // Create QR code with better mobile detection
    const enhancedUrl = `${serverUrl}?mobile=1&src=qr`;
    const result = await qrGenerator.generateQRCode(enhancedUrl, {
      width: 400,
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for better scanning
    });
    
    if (result.success) {
      console.log('✅ Enhanced QR code created!');
      console.log('📄 QR contains URL:', enhancedUrl);
      console.log('💾 Saved to:', result.filePath);
      
      // Create an HTML file with the QR code for easy sharing
      const fs = require('fs');
      const path = require('path');
      
      const qrHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 LAN File Share - Enhanced QR Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            color: white;
            text-align: center;
            padding: 20px;
        }
        .container {
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 20px;
            color: #333;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .qr-image {
            margin: 20px 0;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            border: 3px solid #667eea;
        }
        .scan-instructions {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .url-box {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-family: monospace;
            word-break: break-all;
            border: 1px solid #ddd;
        }
        .action-btn {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 5px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .action-btn:hover {
            transform: scale(1.05);
        }
        .primary-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
        }
        .feature-list {
            text-align: left;
            margin: 20px 0;
        }
        .feature-list li {
            margin: 8px 0;
            padding: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 LAN File Share</h1>
        <h2>📱 Enhanced Mobile Access</h2>
        
        <div class="scan-instructions">
            <h3>📷 How to scan:</h3>
            <ul class="feature-list">
                <li>📱 Open your phone's camera app</li>
                <li>📷 Point at the QR code below</li>
                <li>🔔 Tap the notification that appears</li>
                <li>🌐 Your browser will open automatically</li>
            </ul>
        </div>
        
        <img src="${result.dataURL}" alt="Enhanced QR Code" class="qr-image" width="300" height="300">
        
        <div class="url-box">
            📋 Direct Link: ${enhancedUrl}
        </div>
        
        <a href="${enhancedUrl}" class="action-btn primary-btn">📱 Open on This Device</a>
        <button onclick="copyUrl()" class="action-btn">📋 Copy Link</button>
        <a href="${serverUrl}/api/health" class="action-btn">💊 Test Connection</a>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <h3>✨ Features Available:</h3>
            <ul class="feature-list">
                <li>⬇️ Download files to your phone</li>
                <li>⬆️ Upload files from your phone</li>
                <li>📁 Browse shared files easily</li>
                <li>🔄 Real-time file updates</li>
                <li>🔒 Secure local network sharing</li>
            </ul>
        </div>
    </div>
    
    <script>
        function copyUrl() {
            const url = '${enhancedUrl}';
            navigator.clipboard.writeText(url).then(() => {
                alert('✅ Link copied to clipboard!');
            }).catch(() => {
                prompt('📋 Copy this URL:', url);
            });
        }
        
        // Auto-detect if opened from QR scan
        const params = new URLSearchParams(window.location.search);
        if (params.get('src') === 'qr') {
            // Show success message for QR scan
            const notification = document.createElement('div');
            notification.innerHTML = '✅ QR Code scanned successfully!';
            notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:15px;border-radius:10px;z-index:9999;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    </script>
</body>
</html>`;
      
      const qrHtmlPath = path.join(__dirname, 'enhanced-qr-page.html');
      fs.writeFileSync(qrHtmlPath, qrHtml, 'utf8');
      console.log('📄 Enhanced QR HTML page created:', qrHtmlPath);
      
      return {
        success: true,
        qrCode: result.dataURL,
        url: enhancedUrl,
        htmlFile: qrHtmlPath
      };
    } else {
      console.log('❌ Failed to create enhanced QR code:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('💥 Enhanced QR creation failed:', error);
    return { success: false, error: error.message };
  }
}

createMobileQRCode();
