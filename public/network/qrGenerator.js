const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class QRCodeGenerator {
  constructor() {
    this.qrCodesDir = path.join(__dirname, '..', 'temp', 'qrcodes');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    try {
      if (!fs.existsSync(this.qrCodesDir)) {
        fs.mkdirSync(this.qrCodesDir, { recursive: true });
        console.log('Created QR codes directory:', this.qrCodesDir);
      }
    } catch (error) {
      console.warn('Failed to create QR codes directory:', error.message);
    }
  }

  async generateQRCode(url, options = {}) {
    console.log('🔄 Starting QR code generation for URL:', url);
    
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided for QR code generation');
      }

      // Simplified options to avoid any complex configuration issues
      const qrOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' // Medium error correction for better compatibility
      };

      console.log('📝 Using QR options:', qrOptions);
      
      // Generate QR code directly - no complex validation
      console.log('🔨 Calling QRCode.toDataURL...');
      const qrCodeDataURL = await QRCode.toDataURL(url, qrOptions);
      
      console.log('✅ QR code generation successful!');
      console.log('📏 Data URL length:', qrCodeDataURL.length);
      console.log('🔍 Data URL prefix:', qrCodeDataURL.substring(0, 50) + '...');
      
      // Try to save file but don't fail if it doesn't work
      let savedFilePath = null;
      try {
        const filename = `qr-${Date.now()}.png`;
        const filepath = path.join(this.qrCodesDir, filename);
        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(filepath, base64Data, 'base64');
        savedFilePath = filepath;
        console.log('💾 QR code saved to file:', filepath);
      } catch (fileError) {
        console.warn('⚠️ Failed to save QR code file (not critical):', fileError.message);
      }
      
      return {
        success: true,
        dataURL: qrCodeDataURL,
        filePath: savedFilePath,
        url: url
      };
    } catch (error) {
      console.error('❌ QR code generation failed:', error.message);
      console.error('🔍 Error stack:', error.stack);
      
      // Return failure result
      return {
        success: false,
        error: error.message,
        url: url
      };
    }
  }

  async generateQRCodeFile(url, outputPath) {
    try {
      await QRCode.toFile(outputPath, url, {
        width: 300,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      return {
        success: true,
        filePath: outputPath,
        url: url
      };
    } catch (error) {
      console.error('QR code file generation failed:', error);
      return {
        success: false,
        error: error.message,
        url: url
      };
    }
  }

  cleanupOldQRCodes() {
    try {
      const files = fs.readdirSync(this.qrCodesDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      files.forEach(file => {
        const filePath = path.join(this.qrCodesDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up old QR code:', file);
        }
      });
    } catch (error) {
      console.error('Error cleaning up QR codes:', error);
    }
  }
}

module.exports = QRCodeGenerator;
