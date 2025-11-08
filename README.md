# Dynamix 2025

An audio track playback application based on the ideas of the original Dynamix project from the 90s.

This is a 2025 version of a 1990s original software from here https://www.ibiblio.org/pub/linux/docs/LSM/LSM.1999-08-30 :
```
Begin3
Title:          Project Dynamic (dynamix)
Version:        0.0.5
Entered-date:   02FEB99
Description:    Real time audio mastering of CDDA to hard drive or sound driver.
	   	With Gui interface. Features include : forwards, backwards and reverse 
		squared play mode. Dumping to hard drive as raw - mono / stereo / variable 
		bits and rates.
Keywords:       CD-DA, CDDA, CD-ROM.
Author:         Matt FLAX
Maintained-by:  Matt FLAX
Primary-site:   sunsite.unc.edu /pub/Linux/apps/sound/cdrom
		844 project.dynamic.lsm
                14 M project.dynamic.mp3
Alternate-site: ftp://ftp.cse.unsw.edu.au /pub/users/flatmax
                144kB dynamic.0.0.5.tar.gz
Original-site:  ftp://ftp.cse.unsw.edu.au /pub/users/flatmax
                144kB dynamic.0.0.5.tar.gz
Platforms:      Linux
Copying-policy: Shareware
```
End

## Overview

Dynamix 2025 provides object-oriented RPC between the browser and Node.js for audio track playback. It scans your music library, extracts metadata from audio files, and displays them in a modern Material Design 3 interface.

## Prerequisites

- Node.js version 14 or higher
- npm or yarn package manager
- A modern web browser with Web Components support

## Installation

### Step 1: Clone the repository

Clone the repository to your local machine.

### Step 2: Install Node.js dependencies

From the project root directory, run:

    cd node
    npm install

### Step 3: Install webapp dependencies

Navigate to the webapp directory and install dependencies:

    cd webapp
    npm install
    cd ..

## Running the Application

### Step 1: Start the Node.js server

From the project root directory, start the Node.js server with your music directory path:

    node node/dynamix2025.js /path/to/your/music/library

For example:

    node node/dynamix2025.js /home/user/Music

Or on Windows:

    node node/dynamix2025.js C:\Users\YourName\Music

The server will:
- Validate that the directory exists and is accessible
- Start a WebSocket server on port 9000 (without SSL)
- Expose the MusicMetadata class with RPC methods

### Step 2: Start the webapp development server

In a separate terminal, navigate to the webapp directory and start the development server:

    cd webapp
    npm run dev

Vite will start the development server, typically on http://localhost:3000

### Step 3: Open the application

Open your web browser and navigate to http://localhost:3000. The application will connect to the Node.js backend and you can start browsing your music library.

## Usage

1. Once the webapp loads, it will automatically connect to the Node.js server
2. The connection status is displayed at the top of the page
3. The root music directory path is shown below the connection status
4. Click the "Refresh Tracks" button to scan the directory and load all audio files
5. Tracks will be displayed with their metadata including title, artist, album, duration, bitrate, and more
6. Files that cannot be parsed will show an error message

## Project Structure

- node/ - Node.js backend classes
  - MusicMetadata.js - Handles music file metadata parsing using music-metadata library
  - dynamix2025.js - Main server file that starts the JRPC server
- webapp/ - Frontend web application
  - src/ - Source files
    - components/ - Web components
      - dynamix-app.js - Main application component
    - Tracks.js - Track listing and management component
    - main.js - Application entry point
  - index.html - HTML entry point
  - vite.config.js - Vite configuration
  - tracks.js - Tracks component registration
- CONVENTIONS.md - Project conventions and architecture documentation

## Architecture

Dynamix 2025 uses JRPC-OO for bidirectional RPC between browser and Node.js:

### JRPC-OO Lifecycle

- setupDone() - Called when the system is finished setup and ready to be used
- remoteDisconnected(uuid) - Notifies that a remote has been disconnected
- remoteIsUp() - Remote is up but not ready to call, see setupDone

### Usage

- Both client and server allow you to add an instance of a class using addClass(instance, 'ClassName')
- Methods are parsed out and can be called remotely
- Call remote methods using: this.call['ClassName.method'](args)
- Returns a promise that resolves to an object: {remoteUUID: returnData}
- Use extractResponseData() utility to get data from the first UUID

### File Organization

- Each class is stored in its own file (e.g., Test.js contains class Test)
- Webapp components use kebab-case filenames (e.g., track-play.js)
- Class implementations are in webapp/src/ (e.g., webapp/src/TrackPlay.js)

## UI Components

The webapp uses Material Design 3 (Material Web Components):

- Import from @material/web
- Common components used:
  - md-filled-button, md-outlined-button, md-text-button
  - md-icon-button, md-icon
  - md-linear-progress, md-circular-progress
  - md-list, md-list-item
  - md-card, md-elevated-card, md-outlined-card

## Available RPC Methods

The MusicMetadata class exposes the following methods via JRPC:

- parseFile(filePath, options) - Parse metadata from a single file
- parseBuffer(buffer, fileInfo, options) - Parse metadata from a buffer
- parseStream(filePath, fileInfo, options) - Parse metadata from a stream
- getCommonMetadata(filePath) - Get common metadata fields (title, artist, album, etc.)
- parseDirectory(directoryPath, options) - Recursively parse all audio files in a directory
- getSupportedFileTypes() - Get list of supported audio file extensions
- getRootDirectory() - Get the configured root music directory

All file paths are validated to ensure they are within the configured root directory for security.

## Supported Audio Formats

The application supports the following audio file formats:

- MP3 (.mp3)
- MP4 Audio (.mp4, .m4a, .m4v)
- AAC (.aac)
- FLAC (.flac)
- OGG Vorbis (.ogg)
- Opus (.opus)
- WAV (.wav)
- WMA (.wma)
- Monkey's Audio (.ape)
- Musepack (.mpc)
- WavPack (.wv)
- True Audio (.tta)

## Configuration

### WebSocket connection settings

The default WebSocket connection is configured for localhost:9000 without SSL. If you need to change this, edit the setupConnection method in webapp/src/components/dynamix-app.js:

    const host = 'localhost';
    const port = 9000;
    const useSSL = false;

### Server port

To change the server port, edit node/dynamix2025.js:

    const JrpcServer = new JRPCServer.JRPCServer(9000, 60, useSSL, false);

Change 9000 to your desired port number.

## Troubleshooting

### Connection issues

If the webapp cannot connect to the Node.js server:

1. Verify the Node.js server is running with the correct music directory path
2. Check that the WebSocket port (default 9000) is not blocked by a firewall
3. Verify the connection settings in dynamix-app.js match your server configuration
4. Check the browser console and Node.js console for error messages

### No tracks appearing

If no tracks appear after clicking Refresh:

1. Verify the music directory path provided to the server is correct
2. Check that the directory contains supported audio files
3. Look at the browser console and Node.js console for error messages
4. Ensure the Node.js process has read permissions for the music directory and all subdirectories

### Metadata parsing errors

Some files may fail to parse if they are corrupted or use unsupported encoding. These will be displayed with an error message in the track list. The file path and error details are shown for debugging.

### Server startup errors

If the server fails to start:

- "Root music directory not specified" - You must provide a directory path as an argument
- "Directory does not exist" - The provided path does not exist on the filesystem
- "Path is not a directory" - The provided path is a file, not a directory

## Development

### Adding new features

To add new RPC methods:

1. Add the method to the appropriate class (e.g., MusicMetadata.js)
2. Call the method from the webapp using this.call['ClassName.method'](args)
3. Handle the response using extractResponseData()

### Styling

The application uses CSS custom properties for theming based on Material Design 3:

- --md-sys-color-primary
- --md-sys-color-on-primary
- --md-sys-color-surface
- --md-sys-color-on-surface
- --md-sys-color-background
- --md-sys-color-error
- And many more Material Design 3 color tokens

These are defined in webapp/index.html and can be customized for different themes.

## Security

The MusicMetadata class includes path validation to prevent directory traversal attacks. All file paths are validated to ensure they are within the configured root directory before any file operations are performed.

## License

Add your license information here.

## Contributing

Add contribution guidelines here.
