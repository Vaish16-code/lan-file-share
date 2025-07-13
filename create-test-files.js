const fs = require('fs');
const path = require('path');

// Create multiple test files to demonstrate the file selection functionality
async function createMultipleTestFiles() {
  console.log('📁 Creating multiple test files for file selection demo...');
  
  const testDir = path.join(__dirname, 'multi-file-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFiles = [
    {
      name: 'document1.txt',
      content: 'This is the first test document for multi-file selection.',
      emoji: '📄'
    },
    {
      name: 'data.json',
      content: JSON.stringify({
        message: 'JSON test file for multi-selection',
        items: ['file1', 'file2', 'file3'],
        timestamp: new Date().toISOString()
      }, null, 2),
      emoji: '📋'
    },
    {
      name: 'image-info.txt',
      content: 'Information about images:\n- PNG: Portable Network Graphics\n- JPG: Joint Photographic Experts Group\n- GIF: Graphics Interchange Format',
      emoji: '🖼️'
    },
    {
      name: 'network-guide.md',
      content: `# Network File Sharing Guide

## Features
- ✅ Multi-file selection
- ✅ Add/remove individual files
- ✅ Real-time QR code generation
- ✅ Mobile download interface
- ✅ Secure file transfers

## Usage
1. Select multiple files using "Add Files" button
2. Add more files with "Add More" button
3. Remove individual files with the ✕ button
4. Share all selected files via QR code

Generated: ${new Date().toLocaleString()}
`,
      emoji: '📖'
    },
    {
      name: 'settings.ini',
      content: `[Application]
Name=LAN File Share
Version=1.0.0
MultiFileSelection=true
QRCodeGeneration=true

[Network]
DefaultPort=54323
AutoDetectIP=true
SecureTransfer=true

[UI]
Theme=Modern
AnimationsEnabled=true
NotificationsEnabled=true
`,
      emoji: '⚙️'
    }
  ];
  
  const createdFiles = [];
  
  for (const file of testFiles) {
    const filePath = path.join(testDir, file.name);
    fs.writeFileSync(filePath, file.content, 'utf8');
    createdFiles.push(filePath);
    console.log(`${file.emoji} Created: ${file.name} (${fs.statSync(filePath).size} bytes)`);
  }
  
  console.log(`\n✨ Created ${createdFiles.length} test files in: ${testDir}`);
  console.log('\n📋 Instructions for testing:');
  console.log('1. 🖱️  Click "Add Files" in the File Selector component');
  console.log('2. 📁 Select one or more files from the test directory');
  console.log('3. ➕ Click "Add More" to add additional files');
  console.log('4. ✕ Remove individual files using the remove button');
  console.log('5. 📱 Share all selected files via QR code');
  console.log('6. 🗑️  Use "Clear All" to remove all selections');
  
  return createdFiles;
}

createMultipleTestFiles().catch(console.error);
