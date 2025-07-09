# 🚀 LAN File Share

A modern, cross-platform desktop application for instant and secure file sharing between devices on the same local network (Wi-Fi/LAN) — no internet required!

![Platform Support](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Electron](https://img.shields.io/badge/Electron-latest-blue)
![React](https://img.shields.io/badge/React-19.x-blue)

## ✨ Features

### 🔍 **Automatic Peer Discovery**
- Discovers devices on the same network automatically using UDP broadcasting
- Real-time device list with connection status
- Cross-platform device detection (Windows, macOS, Linux)

### 📁 **Drag & Drop File Transfer**
- Intuitive drag-and-drop interface
- Send multiple files simultaneously
- Direct TCP-based secure transfer
- Real-time progress tracking
- Transfer speed monitoring

### 📱 **Mobile Device Support**
- QR code generation for mobile access
- Web-based interface for phones and tablets
- Upload files from mobile devices
- Download shared files via browser
- No app installation required on mobile

### 🔒 **Security & Privacy**
- Fully offline operation - no internet dependency
- Direct peer-to-peer communication
- No data sent to external servers
- Local network only access
- Secure file transfer protocols

### 🎨 **Modern UI**
- Beautiful, responsive interface
- Dark/light theme support
- Cross-platform native feel
- Real-time notifications
- Progress indicators

## 🚀 Quick Start

### Prerequisites
- Node.js (16.x or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lan-file-share.git
   cd lan-file-share
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start in development mode**
   ```bash
   npm run electron-dev
   ```

### Building for Production

Build for your current platform:
```bash
npm run dist
```

The built application will be available in the `dist` folder.

## 🖥️ Usage

### Sending Files to Desktop Devices

1. **Launch the app** on both devices
2. **Wait for discovery** - devices will appear automatically
3. **Select files** using the file picker or drag & drop
4. **Choose target device** from the discovered list
5. **Send files** - watch the progress in real-time

### Sharing with Mobile Devices

1. **Click "Share for Mobile"** to select files
2. **Scan the QR code** with your mobile device
3. **Access the web interface** to download files
4. **Upload from mobile** by dragging files to the web interface

### Network Requirements

- All devices must be on the same Wi-Fi network or LAN
- Ports 54321 (UDP) and 54322 (TCP) should be available
- Firewall may need to allow the application

## 🏗️ Architecture

### Main Components

```
├── public/
│   ├── electron.js          # Main Electron process
│   ├── preload.js           # Secure IPC bridge
│   └── network/
│       ├── discovery.js     # Peer discovery service
│       ├── fileTransfer.js  # File transfer handling
│       └── fileServer.js    # Mobile web server
├── src/
│   ├── App.js              # Main React application
│   └── components/
│       ├── DeviceList.js   # Network device display
│       ├── FileDropZone.js # File selection interface
│       ├── TransferStatus.js # Progress tracking
│       ├── QRCodeModal.js  # Mobile access modal
│       └── Notifications.js # User feedback system
```

### Network Protocol

1. **Discovery Phase**: UDP multicast on port 54321
2. **File Transfer**: Direct TCP connection on port 54322
3. **Mobile Access**: HTTP server on port 54323
4. **Security**: Local network only, no external communication

## 🔧 Configuration

### Default Ports
- **Discovery**: 54321 (UDP)
- **File Transfer**: 54322 (TCP)
- **Mobile Server**: 54323 (HTTP)

### File Storage
- **Downloads**: `~/Downloads/LAN File Share/`
- **Mobile Uploads**: `~/Downloads/LAN File Share/uploads/`

## 🛠️ Development

### Project Structure
```
lan-file-share/
├── build/                 # React build output
├── dist/                  # Electron distribution
├── public/               # Electron main process
├── src/                  # React renderer process
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Available Scripts

- `npm start` - Start React development server
- `npm run electron` - Run Electron with built React app
- `npm run electron-dev` - Run in development mode
- `npm run build` - Build React app for production
- `npm run dist` - Build and package Electron app

### Adding Features

1. **Network Features**: Modify files in `public/network/`
2. **UI Components**: Add React components in `src/components/`
3. **IPC Communication**: Update `preload.js` for new APIs
4. **Main Process**: Extend `electron.js` for system integration

## 🐛 Troubleshooting

### Common Issues

**Devices not showing up**
- Ensure all devices are on the same network
- Check firewall settings
- Verify ports 54321-54323 are available

**File transfer fails**
- Check network stability
- Ensure sufficient disk space
- Verify file permissions

**Mobile access not working**
- Confirm mobile device is on same Wi-Fi
- Try typing the URL manually instead of QR code
- Check if HTTP server started successfully

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm run electron-dev
```

## 📦 Building & Distribution

### Cross-Platform Builds

Build for specific platforms:
```bash
# Windows
npm run dist -- --win

# macOS
npm run dist -- --mac

# Linux
npm run dist -- --linux
```

### Code Signing

For production releases, configure code signing in `package.json`:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password"
    },
    "mac": {
      "identity": "Developer ID Application: Your Name"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Test on multiple platforms
- Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Electron team for the cross-platform framework
- React team for the UI library
- Node.js community for networking libraries
- Contributors and beta testers

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/lan-file-share/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/lan-file-share/discussions)
- 📧 **Email**: support@your-domain.com

---

**Made with ❤️ for seamless local file sharing**
