#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy static files to standalone build
function copyStaticFiles() {
  const sourceDir = path.join(process.cwd(), '.next', 'static');
  const targetDir = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');
  
  console.log('Copying static files...');
  console.log('Source:', sourceDir);
  console.log('Target:', targetDir);
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Source static directory does not exist:', sourceDir);
    console.log('Available directories in .next:');
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      const contents = fs.readdirSync(nextDir);
      console.log(contents);
    }
    process.exit(1);
  }
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✅ Created target directory:', targetDir);
  }
  
  // Copy files recursively
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  try {
    copyRecursive(sourceDir, targetDir);
    console.log('✅ Static files copied successfully!');
    
    // Verify the copy
    const copiedFiles = fs.readdirSync(targetDir);
    console.log('📁 Copied files:', copiedFiles);
    
  } catch (error) {
    console.error('❌ Error copying static files:', error);
    process.exit(1);
  }
}

// Run the copy function
copyStaticFiles();
