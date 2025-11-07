#!/usr/bin/env node

import JRPCServer from '@flatmax/jrpc-oo/JRPCServer.js';
import MusicMetadata from './MusicMetadata.js';
import fs from 'fs';
import path from 'path';

// Check if root directory is provided
if (process.argv.length < 3) {
  console.error('Error: Root music directory not specified');
  console.error('Usage: node dynamix2025.js <root-music-directory>');
  console.error('Example: node dynamix2025.js /home/user/Music');
  process.exit(1);
}

const rootDirectory = process.argv[2];

// Validate that the directory exists
if (!fs.existsSync(rootDirectory)) {
  console.error(`Error: Directory does not exist: ${rootDirectory}`);
  process.exit(1);
}

// Validate that it's actually a directory
const stats = fs.statSync(rootDirectory);
if (!stats.isDirectory()) {
  console.error(`Error: Path is not a directory: ${rootDirectory}`);
  process.exit(1);
}

// Resolve to absolute path
const absoluteRootDirectory = path.resolve(rootDirectory);

console.log(`Root music directory: ${absoluteRootDirectory}`);

// Create an instance of the MusicMetadata wrapper with the root directory
const musicMetadata = new MusicMetadata();
musicMetadata.rootDirectory = absoluteRootDirectory;

// Start the server without SSL (useSSL = false)
const useSSL = false;
const JrpcServer = new JRPCServer.JRPCServer(9000, 60, useSSL, false);

// Add the music-metadata instance to the server
JrpcServer.addClass(musicMetadata);

console.log('JRPC Server started on port 9000 (without SSL)');
console.log('MusicMetadata class exposed with methods:');
console.log('  - parseFile(filePath, options)');
console.log('  - parseBuffer(buffer, fileInfo, options)');
console.log('  - parseStream(filePath, fileInfo, options)');
console.log('  - getCommonMetadata(filePath)');
console.log('  - parseDirectory(directoryPath, options)');
console.log('  - getSupportedFileTypes()');
