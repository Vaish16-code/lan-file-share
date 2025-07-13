#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting LAN File Share Application...');

// Change to the project directory
process.chdir(__dirname);

// Install dependencies if needed
const npmInstall = spawn('npm', ['install'], { stdio: 'inherit', shell: true });

npmInstall.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
  
  console.log('✅ Dependencies installed successfully');
  
  // Start the application
  const electronDev = spawn('npm', ['run', 'electron-dev'], { stdio: 'inherit', shell: true });
  
  electronDev.on('close', (code) => {
    console.log(`Application closed with code ${code}`);
  });
  
  electronDev.on('error', (error) => {
    console.error('❌ Failed to start application:', error);
  });
});

npmInstall.on('error', (error) => {
  console.error('❌ Failed to install dependencies:', error);
});
