import { LitElement, html, css } from 'lit';
import '@material/web/elevation/elevation.js';

export class DynamixApp extends LitElement {
  static properties = {
    title: { type: String },
    connected: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--md-sys-color-background);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      text-align: center;
      color: var(--md-sys-color-on-surface);
      padding: 3rem 0;
    }

    h1 {
      font-size: 3rem;
      margin: 0 0 0.5rem 0;
      font-weight: 400;
      color: var(--md-sys-color-primary);
    }

    .subtitle {
      font-size: 1.25rem;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 400;
    }

    .player-section {
      background: var(--md-sys-color-surface);
      border-radius: 28px;
      padding: 2rem;
      box-shadow: var(--md-sys-elevation-level2);
      margin-bottom: 2rem;
    }

    .tracks-section {
      background: var(--md-sys-color-surface);
      border-radius: 28px;
      padding: 2rem;
      box-shadow: var(--md-sys-elevation-level2);
    }
  `;

  constructor() {
    super();
    this.title = 'Dynamix 2025';
    this.connected = false;
  }

  firstUpdated() {
    this.setupConnection();
    this.setupEventListeners();
  }

  setupConnection() {
    const tracksComponent = this.shadowRoot.querySelector('tracks-component');
    const playerComponent = this.shadowRoot.querySelector('player-component');
    
    if (tracksComponent && playerComponent) {
      const host = 'localhost';
      const port = 9000;
      const useSSL = false;
      
      const protocol = useSSL ? 'wss' : 'ws';
      const serverURI = `${protocol}://${host}:${port}`;
      
      tracksComponent.serverURI = serverURI;
      playerComponent.serverURI = serverURI;
      
      console.log(`Setting server URI to: ${serverURI}`);
    }
  }

  setupEventListeners() {
    this.addEventListener('track-selected', (e) => {
      const playerComponent = this.shadowRoot.querySelector('player-component');
      if (playerComponent) {
        playerComponent.loadTrack(e.detail.track);
      }
    });
  }

  render() {
    return html`
      <div class="container">
        <header>
          <h1>${this.title}</h1>
          <p class="subtitle">Audio Track Playback</p>
        </header>

        <div class="player-section">
          <player-component></player-component>
        </div>

        <div class="tracks-section">
          <tracks-component></tracks-component>
        </div>
      </div>
    `;
  }
}

customElements.define('dynamix-app', DynamixApp);
