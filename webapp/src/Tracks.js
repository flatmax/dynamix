import { html, css } from 'lit';
import { JRPCClient } from '@flatmax/jrpc-oo/jrpc-client.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';

export class Tracks extends JRPCClient {
  static properties = {
    tracks: { type: Array },
    loading: { type: Boolean },
    error: { type: String },
    connected: { type: Boolean },
    rootDirectory: { type: String }
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .connection-status {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .connection-status.connected {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .connection-status.disconnected {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .root-directory {
      padding: 16px;
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
      border-radius: 12px;
      margin-bottom: 16px;
      font-family: 'Roboto Mono', monospace;
      font-size: 14px;
    }

    .root-directory-label {
      font-weight: 500;
      margin-right: 8px;
      font-family: 'Roboto', sans-serif;
    }

    .loading-container {
      padding: 20px;
      text-align: center;
    }

    .loading-text {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 14px;
      margin-top: 12px;
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

    .track-count {
      margin-bottom: 16px;
      font-weight: 500;
      font-size: 16px;
      color: var(--md-sys-color-on-surface);
    }

    .tracks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .track-item {
      background: var(--md-sys-color-surface-container);
      padding: 16px;
      border-radius: 12px;
      transition: background 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }

    .track-item:hover {
      background: var(--md-sys-color-surface-container-high);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .track-item.error {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

    .track-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin-bottom: 8px;
    }

    .track-artist {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 4px;
    }

    .track-album {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 8px;
    }

    .track-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      font-size: 12px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    .track-detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .track-detail-label {
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .track-path {
      font-size: 11px;
      color: var(--md-sys-color-on-surface-variant);
      margin-top: 8px;
      font-family: 'Roboto Mono', monospace;
      word-break: break-all;
      opacity: 0.7;
    }

    .track-error {
      color: var(--md-sys-color-error);
      font-size: 12px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    md-linear-progress {
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.tracks = [];
    this.loading = false;
    this.error = null;
    this.connected = false;
    this.rootDirectory = '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.addClass(this, 'Tracks');
  }

  async setupDone() {
    console.log('JRPC setup complete, ready to make calls');
    this.connected = true;
    this.requestUpdate();
    
    await this.loadRootDirectory();
    await this.loadAllTracks();
  }

  remoteDisconnected(uuid) {
    console.log('Remote disconnected:', uuid);
    this.connected = false;
    this.error = 'Disconnected from server';
    this.requestUpdate();
  }

  remoteIsUp() {
    console.log('Remote is up');
    this.requestUpdate();
  }

  async loadRootDirectory() {
    try {
      const response = await this.call['MusicMetadata.getRootDirectory']();
      const data = this.extractResponseData(response);
      
      if (data.success) {
        this.rootDirectory = data.rootDirectory;
        console.log('Root directory:', this.rootDirectory);
      } else {
        this.error = 'Failed to get root directory';
      }
    } catch (error) {
      console.error('Error getting root directory:', error);
      this.error = error.message || 'Failed to get root directory';
    }
  }

  async loadAllTracks() {
    if (!this.connected) {
      this.error = 'Not connected to server';
      return;
    }

    if (!this.rootDirectory) {
      this.error = 'Root directory not available';
      return;
    }

    this.loading = true;
    this.error = null;
    this.tracks = [];

    try {
      console.log('Loading tracks from:', this.rootDirectory);
      const response = await this.call['MusicMetadata.parseDirectory'](this.rootDirectory);
      const data = this.extractResponseData(response);
      
      if (data.success) {
        this.tracks = data.tracks;
        console.log('Loaded tracks:', this.tracks.length);
      } else {
        this.error = data.error;
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      this.error = error.message || 'Failed to load tracks';
    } finally {
      this.loading = false;
    }
  }

  handleTrackClick(track) {
    if (track.error) return;
    
    const event = new CustomEvent('track-selected', {
      detail: { track },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  extractResponseData(response) {
    if (!response) return null;
    const firstUuid = Object.keys(response)[0];
    return response[firstUuid];
  }

  formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatBitrate(bitrate) {
    if (!bitrate) return 'Unknown';
    return `${Math.round(bitrate / 1000)} kbps`;
  }

  renderTrack(track) {
    if (track.error) {
      return html`
        <div class="track-item error">
          <div class="track-title">${track.fileName}</div>
          <div class="track-error">
            <md-icon>error</md-icon>
            <span>Error: ${track.error}</span>
          </div>
          <div class="track-path">${track.filePath}</div>
        </div>
      `;
    }

    const common = track.metadata?.common || {};
    const format = track.metadata?.format || {};

    return html`
      <div class="track-item" @click=${() => this.handleTrackClick(track)}>
        <div class="track-title">${common.title || track.fileName}</div>
        ${common.artist ? html`<div class="track-artist">${common.artist}</div>` : ''}
        ${common.album ? html`<div class="track-album">${common.album}</div>` : ''}
        
        <div class="track-details">
          ${common.year ? html`
            <div class="track-detail">
              <span class="track-detail-label">Year</span>
              <span>${common.year}</span>
            </div>
          ` : ''}
          ${format.duration ? html`
            <div class="track-detail">
              <span class="track-detail-label">Duration</span>
              <span>${this.formatDuration(format.duration)}</span>
            </div>
          ` : ''}
          ${format.bitrate ? html`
            <div class="track-detail">
              <span class="track-detail-label">Bitrate</span>
              <span>${this.formatBitrate(format.bitrate)}</span>
            </div>
          ` : ''}
          ${format.sampleRate ? html`
            <div class="track-detail">
              <span class="track-detail-label">Sample Rate</span>
              <span>${format.sampleRate} Hz</span>
            </div>
          ` : ''}
          ${format.codec ? html`
            <div class="track-detail">
              <span class="track-detail-label">Codec</span>
              <span>${format.codec}</span>
            </div>
          ` : ''}
          ${common.track?.no ? html`
            <div class="track-detail">
              <span class="track-detail-label">Track #</span>
              <span>${common.track.no}${common.track.of ? `/${common.track.of}` : ''}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="track-path">${track.filePath}</div>
      </div>
    `;
  }

  render() {
    return html`
      <div>
        <div class="connection-status ${this.connected ? 'connected' : 'disconnected'}">
          <md-icon>${this.connected ? 'check_circle' : 'error'}</md-icon>
          <span>${this.connected ? 'Connected to server' : 'Not connected to server'}</span>
        </div>

        ${this.rootDirectory ? html`
          <div class="root-directory">
            <span class="root-directory-label">Music Library:</span>
            ${this.rootDirectory}
          </div>
        ` : ''}

        <div class="controls">
          <md-filled-button 
            @click=${this.loadAllTracks} 
            ?disabled=${this.loading || !this.connected}>
            <md-icon slot="icon">refresh</md-icon>
            ${this.loading ? 'Loading...' : 'Refresh Tracks'}
          </md-filled-button>
        </div>

        ${this.error ? html`
          <div class="error">
            <md-icon>error</md-icon>
            <span>${this.error}</span>
          </div>
        ` : ''}
        
        ${this.loading ? html`
          <div class="loading-container">
            <md-linear-progress indeterminate></md-linear-progress>
            <div class="loading-text">Scanning directory and parsing metadata...</div>
          </div>
        ` : ''}
        
        ${this.tracks.length > 0 ? html`
          <div class="track-count">
            <md-icon>library_music</md-icon>
            Found ${this.tracks.length} track${this.tracks.length !== 1 ? 's' : ''}
          </div>
          <div class="tracks-list">
            ${this.tracks.map(track => this.renderTrack(track))}
          </div>
        ` : ''}
      </div>
    `;
  }
}
