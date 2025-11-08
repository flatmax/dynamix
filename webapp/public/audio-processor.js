class BlockAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioData = null;
    this.position = 0;
    this.direction = 1; // 1 for forward, -1 for reverse
    this.isPlaying = false;
    
    this.port.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'load':
          this.audioData = data.audioData;
          this.position = 0;
          this.isPlaying = false;
          this.port.postMessage({ type: 'loaded', duration: this.audioData.length / sampleRate });
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
          break;
          
        case 'seek':
          this.position = Math.floor(data.position * sampleRate);
          break;
          
        case 'setDirection':
          this.direction = data.direction;
          break;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    if (!this.audioData || !this.isPlaying || output.length === 0) {
      return true;
    }
    
    const blockSize = output[0].length;
    
    for (let channel = 0; channel < output.length; channel++) {
      const outputChannel = output[channel];
      const inputChannel = this.audioData[channel] || this.audioData[0];
      
      for (let i = 0; i < blockSize; i++) {
        if (this.position >= 0 && this.position < inputChannel.length) {
          outputChannel[i] = inputChannel[this.position];
        } else {
          outputChannel[i] = 0;
        }
        
        this.position += this.direction;
        
        if (this.position >= inputChannel.length || this.position < 0) {
          this.isPlaying = false;
          this.port.postMessage({ type: 'ended' });
          break;
        }
      }
    }
    
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
