import { html, css } from 'lit';
import { JRPCClient } from '@flatmax/jrpc-oo/jrpc-client.js';
import { AudioManager } from './AudioManager.js';
import { PlayerUI } from './PlayerUI.js';
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

    .window-size-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .window-size-slider {
      flex: 1;
    }

    .window-size-buttons {
      display: flex;
      gap: 4px;
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
    this.windowSize = 4096;
    
    this.audioManager = new AudioManager();
    this.setupAudioManagerCallbacks();
  }

  setupAudioManagerCallbacks() {
    this.audioManager.onProgressUpdate = (position) => {
      this.currentTime = position;
      this.requestUpdate();
    };

    this.audioManager.onDurationUpdate = (duration) => {
      this.duration = duration;
      this.requestUpdate();
    };

    this.audioManager.onPlayStateChange = (isPlaying) => {
      this.isPlaying = isPlaying;
      this.requestUpdate();
    };

    this.audioManager.onWindowSizeChange = (windowSize) => {
      this.windowSize = windowSize;
      this.requestUpdate();
    };
  }

  async connectedCallback() {
    super.connectedCallback();
    this.addClass(this, 'Player');
    await this.initAudio();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.audioManager.cleanup();
  }

  async initAudio() {
    try {
      await this.audioManager.initialize();
    } catch (error) {
      console.error('Error initializing audio:', error);
      this.error = error.message;
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
    this.audioManager.stop();
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

    this.audioManager.stop();
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

      await this.audioManager.loadAudioData(data.audioData);
      console.log('Track loaded successfully');
      
    } catch (error) {
      console.error('Error loading track:', error);
      this.error = error.message || 'Failed to load track';
    } finally {
      this.isLoading = false;
    }
  }

  loadTapTime(tapTimeData) {
    if (!this.audioManager.audioContext) {
      console.error('Audio context not initialized');
      return;
    }

    const sampleRate = this.audioManager.audioContext.sampleRate;
    const intervalSeconds = tapTimeData.intervalMs / 1000;
    const windowSizeFrames = Math.floor(intervalSeconds * sampleRate);
    
    console.log('Loading tap time to player:', {
      intervalMs: tapTimeData.intervalMs,
      bpm: tapTimeData.bpm,
      windowSizeFrames: windowSizeFrames
    });
    
    this.windowSize = windowSizeFrames;
    this.audioManager.setWindowSize(windowSizeFrames);
    this.audioManager.syncWindow();
  }

  handleProgressClick(e) {
    if (!this.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const position = percent * this.duration;
    
    this.audioManager.seek(position);
  }

  handleWindowSizeChange(e) {
    const value = parseInt(e.target.value);
    this.windowSize = value;
    this.audioManager.setWindowSize(value);
  }

  multiplyWindowSize() {
    const newSize = this.windowSize * 2;
    this.windowSize = newSize;
    this.audioManager.setWindowSize(newSize);
  }

  divideWindowSize() {
    const newSize = Math.floor(this.windowSize / 2);
    this.windowSize = newSize;
    this.audioManager.setWindowSize(newSize);
  }

  extractResponseData(response) {
    if (!response) return null;
    const firstUuid = Object.keys(response)[0];
    return response[firstUuid];
  }

  render() {
    if (!this.currentTrack) {
      return PlayerUI.renderNoTrack();
    }

    return html`
      <div class="player-container">
        ${this.error ? PlayerUI.renderError(this.error) : ''}

        ${PlayerUI.renderTrackInfo(this.currentTrack)}

        ${this.isLoading ? PlayerUI.renderLoading() : html`
          ${PlayerUI.renderProgressBar(
            this.currentTime,
            this.duration,
            (e) => this.handleProgressClick(e)
          )}

          ${PlayerUI.renderControls(
            this.isPlaying,
            this.direction,
            () => this.audioManager.stop(),
            () => this.audioManager.togglePlayPause(),
            () => {
              this.audioManager.toggleDirection();
              this.direction = this.audioManager.direction;
            },
            () => this.audioManager.syncWindow()
          )}

          ${PlayerUI.renderWindowSizeControl(
            this.windowSize,
            this.audioManager.getMinWindowSize(),
            this.audioManager.getMaxWindowSize(),
            this.audioManager.audioContext,
            (e) => this.handleWindowSizeChange(e),
            () => this.divideWindowSize(),
            () => this.multiplyWindowSize()
          )}
        `}
      </div>
    `;
  }
}
