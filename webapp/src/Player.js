import { html } from 'lit';
import { JRPCClient } from '@flatmax/jrpc-oo/jrpc-client.js';
import { AudioManager } from './AudioManager.js';
import { PlayerUI } from './PlayerUI.js';
import { PlayerEventHandlers } from './PlayerEventHandlers.js';
import { playerStyles } from './styles/PlayerStyles.js';
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

  static styles = playerStyles;

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
    this.windowSize = 96000; // Default to 2 seconds at 48kHz
    
    this.audioManager = new AudioManager();
    this.eventHandlers = new PlayerEventHandlers(this);
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
      // Update windowSize after initialization to reflect actual sample rate
      this.windowSize = this.audioManager.windowSize;
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
            (e) => this.eventHandlers.handleProgressClick(e)
          )}

          ${PlayerUI.renderControls(
            this.isPlaying,
            this.direction,
            () => this.eventHandlers.handleStop(),
            () => this.eventHandlers.handleTogglePlayPause(),
            () => this.eventHandlers.handleToggleDirection(),
            () => this.eventHandlers.handleSyncWindow(),
            () => this.eventHandlers.handleSkipBackToStart()
          )}

          ${PlayerUI.renderWindowSizeControl(
            this.windowSize,
            this.audioManager.getMinWindowSize(),
            this.audioManager.getMaxWindowSize(),
            this.audioManager.audioContext,
            (e) => this.eventHandlers.handleWindowSizeChange(e),
            () => this.eventHandlers.divideWindowSize(),
            () => this.eventHandlers.multiplyWindowSize()
          )}
        `}
      </div>
    `;
  }
}
