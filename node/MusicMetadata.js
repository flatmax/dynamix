import * as mm from 'music-metadata';
import fs from 'fs';

// Wrapper class for music-metadata to expose its methods via JRPC
class MusicMetadata {
  constructor() {
    this.name = 'MusicMetadata';
  }

  // Parse metadata from a file path
  async parseFile(filePath, options = {}) {
    try {
      const metadata = await mm.parseFile(filePath, options);
      return {
        success: true,
        metadata: this.serializeMetadata(metadata)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse metadata from a buffer
  async parseBuffer(buffer, fileInfo, options = {}) {
    try {
      const bufferData = Buffer.from(buffer);
      const metadata = await mm.parseBuffer(bufferData, fileInfo, options);
      return {
        success: true,
        metadata: this.serializeMetadata(metadata)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parse metadata from a stream
  async parseStream(filePath, fileInfo, options = {}) {
    try {
      const stream = fs.createReadStream(filePath);
      const metadata = await mm.parseStream(stream, fileInfo, options);
      return {
        success: true,
        metadata: this.serializeMetadata(metadata)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get common metadata formats
  async getCommonMetadata(filePath) {
    try {
      const metadata = await mm.parseFile(filePath);
      return {
        success: true,
        common: metadata.common,
        format: metadata.format
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper method to serialize metadata (convert non-serializable objects)
  serializeMetadata(metadata) {
    return JSON.parse(JSON.stringify(metadata, (key, value) => {
      if (value instanceof Buffer) {
        return {
          type: 'Buffer',
          data: value.toString('base64')
        };
      }
      return value;
    }));
  }

  // Get supported file types
  getSupportedFileTypes() {
    return {
      success: true,
      types: [
        'mp3', 'mp4', 'm4a', 'm4v', 'aac',
        'flac', 'ogg', 'opus', 'wav', 'wma',
        'ape', 'mpc', 'wv', 'tta'
      ]
    };
  }
}

export default MusicMetadata;
