# Copilot Instructions for LAN File Share

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a cross-platform desktop application built with **Electron** and **React** for instant and secure file sharing over local networks (LAN/Wi-Fi) without requiring internet access.

## Key Technologies
- **Electron**: Main process handles system integrations and networking
- **React**: Frontend UI with modern component-based architecture
- **UDP Broadcasting**: For peer discovery on local network
- **TCP Sockets**: For secure file transfer
- **Express Server**: For mobile device file sharing via HTTP
- **QR Code Generation**: For mobile device access

## Architecture
- `public/electron.js`: Main Electron process
- `public/preload.js`: Secure IPC communication bridge
- `public/network/`: Network services (discovery, file transfer, file server)
- `src/`: React application and components
- `src/components/`: Reusable UI components

## Coding Standards
- Use functional React components with hooks
- Implement proper error handling and user feedback
- Follow secure IPC patterns between main and renderer processes
- Use CSS modules or styled components for styling
- Implement responsive design for different screen sizes
- Add proper TypeScript types if migrating to TypeScript

## Security Considerations
- Never expose Node.js APIs directly to renderer process
- Use contextBridge for secure IPC communication
- Validate all file paths and network inputs
- Implement proper CORS and security headers for HTTP server

## File Transfer Protocol
1. Peer discovery via UDP multicast
2. Direct TCP connection for file transfer
3. Progress tracking and error handling
4. Checksum verification for data integrity

## Testing Guidelines
- Test across different operating systems (Windows, macOS, Linux)
- Verify network discovery on different network configurations
- Test file transfer with various file sizes and types
- Ensure mobile web interface works on different devices
