import { html, css } from 'lit';
import { JRPCClient } from '@flatmax/jrpc-oo/jrpc-client.js';
import '@material/web/button/filled-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/slider/slider.js';

export class Player extends JRPCClient {
  static properties = {
    currentTrack: { type: Object },
    isPlaying: { type: Boolean },
    isLoading: { type: Boolean },
    error: { type: String },
    currentTime: { type: Number },
    duration: { type: Number },
    direction: { type: Number },
    connected: { type: Boolean },
    windowSize: { type: Number }
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .player-container {
      background: var(--md-sys-color-surface-container);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level2);
    }

    .track-info {
      margin-bottom: 20px;
    }

    .track-title {
      font-size: 20px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 8px 0;
    }

    .track-artist {
      font-size: 16px;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--md-sys-color-outline-variant);
      border-radius: 2px;
      cursor: pointer;
      position: relative;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: var(--md-sys-color-primary);
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    .time-display {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      font-family: 'Roboto Mono', monospace;
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .direction-indicator {
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      padding: 4px 12px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 12px;
    }

    .window-size-control {
      margin-top: 20px;
      padding: 16px;
      background: var(--md-sys-color-surface-variant);
      border-radius: 12px;
    }

    .window-size-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .window-size-value {
      font-family: 'Roboto Mono', monospace;
      color: var(--md-sys-color-primary);
    }

    .window-size-slider {
      width: 100%;
      margin-top: 8px;
    }

    .error {
      padding: 16px;
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
      border-radius: 12px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .loading {
      text-align: center;
      padding: 20px;
    }

    .no-track {
      text-align: center;
      padding: 40px;
      color: var(--md-sys-color-on-surface-variant);
    }
  `;

  constructor() {
    super();
    this.currentTrack = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.error = null;
    this.currentTime = 0;
    this.duration = 0;
    this.direction = 1;
    this.connected = false;
    this.windowSize = 4096; // Default window size
    
    this.audioContext = null;
    this.audioWorkletNode = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.addClass(this, 'Player');
    await this.initAudioContext();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'block-audio-processor');
      this.audioWorkletNode.connect(this.audioContext.destination);
      
      this.audioWorkletNode.port.onmessage = (e) => {
        const { type, position, duration, windowSize } = e.data;
        
        switch (type) {
          case 'loaded':
            this.duration = duration;
            this.requestUpdate();
            break;
            
          case 'progress':
            this.currentTime = position;
            this.requestUpdate();
            break;
            
          case 'ended':
            this.isPlaying = false;
            this.requestUpdate();
            break;
            
          case 'windowSizeChanged':
            this.windowSize = windowSize;
            console.log('Window size changed to:', windowSize);
            this.requestUpdate();
            break;
        }
      };
      
      // Set initial window size
      this.setWindowSize(this.windowSize);
    } catch (error) {
      console.error('Error initializing audio context:', error);
      this.error = 'Failed to initialize audio system';
    }
  }

  async setupDone() {
    console.log('Player: JRPC setup complete');
    this.connected = true;
    this.requestUpdate();
  }

  remoteDisconnected(uuid) {
    console.log('Player: Remote disconnected:', uuid);
    this.connected = false;
    this.error = 'Disconnected from server';
    this.stop();
    this.requestUpdate();
  }

  remoteIsUp() {
    console.log('Player: Remote is up');
    this.requestUpdate();
  }

  async loadTrack(track) {
    if (!this.connected) {
      this.error = 'Not connected to server';
      return;
    }

    this.stop();
    this.currentTrack = track;
    this.isLoading = true;
    this.error = null;

    try {
      console.log('Loading track:', track.filePath);
      
      const response = await this.call['MusicMetadata.getAudioData'](track.filePath);
      const data = this.extractResponseData(response);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load audio data');
      }

      const audioData = this._base64ToArrayBuffer(data.audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      
      const channelData = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }
      
      this.audioWorkletNode.port.postMessage({
        type: 'load',
        data: { audioData: channelData }
      });
      
      console.log('Track loaded successfully');
      
    } catch (error) {
      console.error('Error loading track:', error);
      this.error = error.message || 'Failed to load track';
    } finally {
      this.isLoading = false;
    }
  }

  play() {
    if (!this.currentTrack || this.isPlaying) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.audioWorkletNode.port.postMessage({ type: 'play' });
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying) return;
    
    this.audioWorkletNode.port.postMessage({ type: 'pause' });
    this.isPlaying = false;
  }

  stop() {
    this.audioWorkletNode?.port.postMessage({ type: 'stop' });
    this.isPlaying = false;
    this.currentTime = 0;
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleDirection() {
    this.direction = this.direction === 1 ? -1 : 1;
    this.audioWorkletNode.port.postMessage({ 
      type: 'setDirection', 
      data: { direction: this.direction } 
    });
  }

  setWindowSize(size) {
    if (!this.audioWorkletNode) return;
    
    this.audioWorkletNode.port.postMessage({
      type: 'setWindowSize',
      data: { windowSize: size }
    });
  }

  handleWindowSizeChange(e) {
    const value = parseInt(e.target.value);
    this.windowSize = value;
    this.setWindowSize(value);
  }

  handleProgressClick(e) {
    if (!this.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const position = percent * this.duration;
    
    this.audioWorkletNode.port.postMessage({ 
      type: 'seek', 
      data: { position } 
    });
    this.currentTime = position;
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

  extractResponseData(response) {
    if (!response) return null;
    const firstUuid = Object.keys(response)[0];
    return response[firstUuid];
  }

  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatWindowSize(frames) {
    if (!this.audioContext) return `${frames} frames`;
    const sampleRate = this.audioContext.sampleRate;
    const seconds = frames / sampleRate;
    if (seconds < 1) {
      return `${frames} frames (${(seconds * 1000).toFixed(1)} ms)`;
    } else {
      return `${frames} frames (${seconds.toFixed(2)} s)`;
    }
  }

  render() {
    if (!this.currentTrack) {
      return html`
        <div class="player-container">
          <div class="no-track">
            <md-icon>music_note</md-icon>
            <p>No track selected. Click a track to play.</p>
          </div>
        </div>
      `;
    }

    const common = this.currentTrack.metadata?.common || {};
    const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    
    // Calculate min and max window size
    const minWindowSize = 128;
    const maxWindowSize = this.audioContext ? Math.floor(10 * this.audioContext.sampleRate) : 480000;

    return html`
      <div class="player-container">
        ${this.error ? html`
          <div class="error">
            <md-icon>error</md-icon>
            <span>${this.error}</span>
          </div>
        ` : ''}

        <div class="track-info">
          <h3 class="track-title">${common.title || this.currentTrack.fileName}</h3>
          ${common.artist ? html`<p class="track-artist">${common.artist}</p>` : ''}
        </div>

        ${this.isLoading ? html`
          <div class="loading">
            <md-linear-progress indeterminate></md-linear-progress>
            <p>Loading track...</p>
          </div>
        ` : html`
          <div class="progress-container">
            <div class="progress-bar" @click=${this.handleProgressClick}>
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="time-display">
              <span>${this.formatTime(this.currentTime)}</span>
              <span>${this.formatTime(this.duration)}</span>
            </div>
          </div>

          <div class="controls">
            <md-icon-button @click=${this.stop}>
              <md-icon>stop</md-icon>
            </md-icon-button>

            <md-icon-button @click=${this.togglePlayPause}>
              <md-icon>${this.isPlaying ? 'pause' : 'play_arrow'}</md-icon>
            </md-icon-button>

            <md-icon-button @click=${this.toggleDirection}>
              <md-icon>${this.direction === 1 ? 'fast_forward' : 'fast_rewind'}</md-icon>
            </md-icon-button>

            <span class="direction-indicator">
              ${this.direction === 1 ? 'Forward' : 'Reverse'}
            </span>
          </div>

          <div class="window-size-control">
            <div class="window-size-label">
              <span>Window Size (N)</span>
              <span class="window-size-value">${this.formatWindowSize(this.windowSize)}</span>
            </div>
            <input
              type="range"
              class="window-size-slider"
              min="${minWindowSize}"
              max="${maxWindowSize}"
              step="128"
              .value="${this.windowSize}"
              @input=${this.handleWindowSizeChange}
            />
          </div>
        `}
      </div>
    `;
  }
}
