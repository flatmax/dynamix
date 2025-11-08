export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioWorkletNode = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.direction = 1;
    this.windowSize = 96000; // Default to 2 seconds at 48kHz
    this.onProgressUpdate = null;
    this.onDurationUpdate = null;
    this.onPlayStateChange = null;
    this.onWindowSizeChange = null;
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'block-audio-processor');
      this.audioWorkletNode.connect(this.audioContext.destination);
      
      this.audioWorkletNode.port.onmessage = (e) => {
        this.handleWorkletMessage(e.data);
      };
      
      // Set window size to 2 seconds based on actual sample rate
      this.windowSize = Math.floor(2 * this.audioContext.sampleRate);
      this.setWindowSize(this.windowSize);
      return true;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      throw new Error('Failed to initialize audio system');
    }
  }

  handleWorkletMessage(data) {
    const { type, position, duration, windowSize } = data;
    
    switch (type) {
      case 'loaded':
        this.duration = duration;
        if (this.onDurationUpdate) {
          this.onDurationUpdate(duration);
        }
        break;
        
      case 'progress':
        this.currentTime = position;
        if (this.onProgressUpdate) {
          this.onProgressUpdate(position);
        }
        break;
        
      case 'ended':
        this.isPlaying = false;
        if (this.onPlayStateChange) {
          this.onPlayStateChange(false);
        }
        break;
        
      case 'windowSizeChanged':
        this.windowSize = windowSize;
        console.log('Window size changed to:', windowSize);
        if (this.onWindowSizeChange) {
          this.onWindowSizeChange(windowSize);
        }
        break;
    }
  }

  async loadAudioData(base64Data) {
    const audioData = this._base64ToArrayBuffer(base64Data);
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);
    
    const channelData = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }
    
    this.audioWorkletNode.port.postMessage({
      type: 'load',
      data: { audioData: channelData }
    });
  }

  play() {
    if (this.isPlaying) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.audioWorkletNode.port.postMessage({ type: 'play' });
    this.isPlaying = true;
    
    if (this.onPlayStateChange) {
      this.onPlayStateChange(true);
    }
  }

  pause() {
    if (!this.isPlaying) return;
    
    this.audioWorkletNode.port.postMessage({ type: 'pause' });
    this.isPlaying = false;
    
    if (this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }
  }

  stop() {
    this.audioWorkletNode?.port.postMessage({ type: 'stop' });
    this.isPlaying = false;
    this.currentTime = 0;
    
    if (this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setDirection(direction) {
    this.direction = direction;
    this.audioWorkletNode.port.postMessage({ 
      type: 'setDirection', 
      data: { direction } 
    });
  }

  toggleDirection() {
    this.setDirection(this.direction === 1 ? -1 : 1);
  }

  syncWindow() {
    this.audioWorkletNode.port.postMessage({
      type: 'syncWindow'
    });
  }

  skipBackToStart() {
    if (!this.audioContext) return;
    
    const sampleRate = this.audioContext.sampleRate;
    const windowSizeSeconds = this.windowSize / sampleRate;
    
    // Use modulo to find the remainder position close to the beginning
    const newPosition = this.currentTime % windowSizeSeconds;
    
    console.log('Skip back to start using modulo:', {
      currentTime: this.currentTime,
      windowSizeSeconds: windowSizeSeconds,
      newPosition: newPosition
    });
    
    this.seek(newPosition);
  }

  setWindowSize(size) {
    if (!this.audioWorkletNode) return;
    
    const minWindowSize = 128;
    const maxWindowSize = this.audioContext ? Math.floor(10 * this.audioContext.sampleRate) : 480000;
    const clampedSize = Math.max(minWindowSize, Math.min(maxWindowSize, size));
    
    this.audioWorkletNode.port.postMessage({
      type: 'setWindowSize',
      data: { windowSize: clampedSize }
    });
  }

  seek(position) {
    this.audioWorkletNode.port.postMessage({ 
      type: 'seek', 
      data: { position } 
    });
    this.currentTime = position;
  }

  getMinWindowSize() {
    return 128;
  }

  getMaxWindowSize() {
    return this.audioContext ? Math.floor(10 * this.audioContext.sampleRate) : 480000;
  }

  cleanup() {
    this.stop();
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
