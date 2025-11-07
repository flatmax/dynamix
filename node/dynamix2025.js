#!/usr/bin/env node

import JRPCServer from '@flatmax/jrpc-oo/JRPCServer.js';
import MusicMetadata from './MusicMetadata.js';

// Create an instance of the MusicMetadata wrapper
const musicMetadata = new MusicMetadata();

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
console.log('  - getSupportedFileTypes()');
