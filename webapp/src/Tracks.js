import { LitElement, html, css } from 'lit';
import { JRPCClient } from '@flatmax/jrpc-oo/jrpc-client.js';

export class Tracks extends JRPCClient {
  static properties = {
    tracks: { type: Array },
    loading: { type: Boolean },
    error: { type: String },
    directoryPath: { type: String },
    connected: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .connection-status {
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .connection-status.connected {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #4caf50;
    }

    .connection-status.disconnected {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #f44336;
    }

    .connection-status.connecting {
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ff9800;
    }

    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    input[type="text"] {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
    }

    button {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover {
      background: #5568d3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .loading {
      color: #666;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }

    .error {
      color: #d32f2f;
      padding: 12px;
      background: #ffebee;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .track-count {
      margin-bottom: 16px;
      font-weight: bold;
      color: #333;
    }

    .tracks-list {
      display: grid;
      gap: 12px;
    }

    .track-item {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }

    .track-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .track-item.error {
      background: #ffebee;
      border-left: 4px solid #d32f2f;
    }

    .track-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .track-artist {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .track-album {
      font-size: 14px;
      color: #888;
      margin-bottom: 8px;
    }

    .track-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #eee;
    }

    .track-detail {
      display: flex;
      flex-direction: column;
    }

    .track-detail-label {
      font-weight: bold;
      color: #888;
    }

    .track-path {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
      font-family: monospace;
      word-break: break-all;
    }

    .track-error {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 8px;
    }
  `;

  constructor() {
    super();
    this.tracks = [];
    this.loading = false;
    this.error = null;
    this.directoryPath = '';
    this.connected = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addClass(this, 'Tracks');
    this.autoConnect();
  }

  async autoConnect() {
    try {
      const host = 'localhost';
      const port = 9000;
      const useSSL = false;
      
      console.log(`Connecting to JRPC server at ${useSSL ? 'wss' : 'ws'}://${host}:${port}`);
      
      await this.connect(host, port, useSSL);
      this.connected = true;
      console.log('Successfully connected to JRPC server');
    } catch (error) {
      console.error('Failed to connect to JRPC server:', error);
      this.error = `Failed to connect to server: ${error.message}`;
      this.connected = false;
    }
  }

  setupDone() {
    console.log('JRPC setup complete, ready to make calls');
    this.connected = true;
    this.requestUpdate();
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

  async loadDirectory() {
    if (!this.connected) {
      this.error = 'Not connected to server';
      return;
    }

    if (!this.directoryPath) {
      this.error = 'Please enter a directory path';
      return;
    }

    this.loading = true;
    this.error = null;
    this.tracks = [];

    try {
      const response = await this.call['MusicMetadata.parseDirectory'](this.directoryPath);
      const data = this.extractResponseData(response);
      
      if (data.success) {
        this.tracks = data.tracks;
      } else {
        this.error = data.error;
      }
    } catch (error) {
      console.error('Error loading directory:', error);
      this.error = error.message || 'Failed to load directory';
    } finally {
      this.loading = false;
    }
  }

  extractResponseData(response) {
    if (!response) return null;
    const firstUuid = Object.keys(response)[0];
    return response[firstUuid];
  }

  handleInputChange(e) {
    this.directoryPath = e.target.value;
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.loadDirectory();
    }
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
          <div class="track-error">Error: ${track.error}</div>
          <div class="track-path">${track.filePath}</div>
        </div>
      `;
    }

    const common = track.metadata?.common || {};
    const format = track.metadata?.format || {};

    return html`
      <div class="track-item">
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
          ${this.connected ? '✓ Connected to server' : '✗ Not connected to server'}
        </div>

        <div class="controls">
          <input 
            type="text" 
            placeholder="Enter directory path (e.g., /path/to/music)"
            .value=${this.directoryPath}
            @input=${this.handleInputChange}
            @keypress=${this.handleKeyPress}
            ?disabled=${this.loading || !this.connected}
          />
          <button @click=${this.loadDirectory} ?disabled=${this.loading || !this.connected}>
            ${this.loading ? 'Loading...' : 'Load Tracks'}
          </button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        
        ${this.loading ? html`<div class="loading">Scanning directory and parsing metadata...</div>` : ''}
        
        ${this.tracks.length > 0 ? html`
          <div class="track-count">Found ${this.tracks.length} track${this.tracks.length !== 1 ? 's' : ''}</div>
          <div class="tracks-list">
            ${this.tracks.map(track => this.renderTrack(track))}
          </div>
        ` : ''}
      </div>
    `;
  }
}
