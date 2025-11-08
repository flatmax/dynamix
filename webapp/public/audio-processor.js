class BlockAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioData = null;
    this.position = 0;
    this.direction = 1; // 1 for forward, -1 for reverse
    this.isPlaying = false;
    this.windowSize = 4096; // Default window size (N frames)
    this.windowBuffer = null; // Buffer to hold the current window
    this.windowPosition = 0; // Position within the current window
    this.pendingWindowSize = null; // Pending window size change
    
    this.port.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'load':
          this.audioData = data.audioData;
          this.position = 0;
          this.isPlaying = false;
          this.windowBuffer = null;
          this.windowPosition = 0;
          this.pendingWindowSize = null;
          this.port.postMessage({ type: 'loaded', duration: this.audioData[0].length / sampleRate });
          break;
          
        case 'play':
          this.isPlaying = true;
          break;
          
        case 'pause':
          this.isPlaying = false;
          break;
          
        case 'stop':
          this.isPlaying = false;
          this.position = 0;
          this.windowBuffer = null;
          this.windowPosition = 0;
          this.pendingWindowSize = null;
          break;
          
        case 'seek':
          this.position = Math.floor(data.position * sampleRate);
          this.windowBuffer = null;
          this.windowPosition = 0;
          break;
          
        case 'setDirection':
          this.direction = data.direction;
          this.windowBuffer = null;
          this.windowPosition = 0;
          break;
          
        case 'setWindowSize':
          const minSize = 128;
          const maxSize = Math.floor(10 * sampleRate); // 10 seconds
          const newSize = Math.max(minSize, Math.min(maxSize, data.windowSize));
          
          // Store the pending window size change instead of applying immediately
          this.pendingWindowSize = newSize;
          break;
          
        case 'syncWindow':
          // Force reload of window at current position
          this.windowBuffer = null;
          this.windowPosition = 0;
          break;
      }
    };
  }
  
  applyPendingWindowSize() {
    if (this.pendingWindowSize !== null) {
      this.windowSize = this.pendingWindowSize;
      this.pendingWindowSize = null;
      this.port.postMessage({ type: 'windowSizeChanged', windowSize: this.windowSize });
    }
  }
  
  loadWindow() {
    if (!this.audioData || this.audioData.length === 0) {
      return false;
    }
    
    // Apply pending window size change before loading new window
    this.applyPendingWindowSize();
    
    const numChannels = this.audioData.length;
    const audioLength = this.audioData[0].length;
    
    // Allocate window buffer if needed
    if (!this.windowBuffer || this.windowBuffer.length !== numChannels) {
      this.windowBuffer = [];
      for (let ch = 0; ch < numChannels; ch++) {
        this.windowBuffer[ch] = new Float32Array(this.windowSize);
      }
    } else if (this.windowBuffer[0].length !== this.windowSize) {
      // Reallocate if window size changed
      for (let ch = 0; ch < numChannels; ch++) {
        this.windowBuffer[ch] = new Float32Array(this.windowSize);
      }
    }
    
    // Load N samples into the window buffer
    for (let ch = 0; ch < numChannels; ch++) {
      const inputChannel = this.audioData[ch];
      const windowChannel = this.windowBuffer[ch];
      
      if (this.direction === 1) {
        // Forward direction - copy window starting at current position
        const startPos = this.position;
        const endPos = Math.min(startPos + this.windowSize, audioLength);
        const copyLength = endPos - startPos;
        
        if (copyLength > 0) {
          windowChannel.set(inputChannel.subarray(startPos, endPos), 0);
        }
        
        // Fill remaining with zeros if we hit the end
        if (copyLength < this.windowSize) {
          windowChannel.fill(0, copyLength);
        }
      } else {
        // Reverse direction - copy window BEFORE current position, but keep samples in forward order
        // Position points to the END of the window we want to load
        const endPos = this.position;
        const startPos = Math.max(0, endPos - this.windowSize);
        const copyLength = endPos - startPos;
        
        if (copyLength > 0) {
          windowChannel.set(inputChannel.subarray(startPos, endPos), 0);
        }
        
        // Fill remaining with zeros if we hit the beginning
        if (copyLength < this.windowSize) {
          windowChannel.fill(0, copyLength);
        }
      }
    }
    
    // Update position to the end of the window
    this.position += this.windowSize * this.direction;
    this.windowPosition = 0;
    
    // Check if we've reached the end
    if (this.direction === 1 && this.position >= audioLength) {
      return false;
    }
    if (this.direction === -1 && this.position < 0) {
      return false;
    }
    
    return true;
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    if (!this.audioData || !this.isPlaying || output.length === 0) {
      return true;
    }
    
    const blockSize = output[0].length; // 128 frames
    const numChannels = output.length;
    let outputOffset = 0;
    
    while (outputOffset < blockSize) {
      // Load a new window if we've exhausted the current one
      if (!this.windowBuffer || this.windowPosition >= this.windowSize) {
        const loaded = this.loadWindow();
        if (!loaded) {
          // Reached the end of the audio
          this.isPlaying = false;
          this.port.postMessage({ type: 'ended' });
          
          // Fill remaining samples with silence
          for (let ch = 0; ch < numChannels; ch++) {
            output[ch].fill(0, outputOffset);
          }
          return true;
        }
      }
      
      // Calculate how many samples we can copy from the window buffer
      const samplesAvailable = this.windowSize - this.windowPosition;
      const samplesNeeded = blockSize - outputOffset;
      const samplesToCopy = Math.min(samplesAvailable, samplesNeeded);
      
      // Copy chunk from window buffer to output for each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const windowChannel = this.windowBuffer[ch] || this.windowBuffer[0];
        output[ch].set(
          windowChannel.subarray(this.windowPosition, this.windowPosition + samplesToCopy),
          outputOffset
        );
      }
      
      this.windowPosition += samplesToCopy;
      outputOffset += samplesToCopy;
    }
    
    // Send progress updates periodically
    if (this.isPlaying && this.position % 4800 === 0) {
      this.port.postMessage({ 
        type: 'progress', 
        position: this.position / sampleRate 
      });
    }
    
    return true;
  }
}

registerProcessor('block-audio-processor', BlockAudioProcessor);
