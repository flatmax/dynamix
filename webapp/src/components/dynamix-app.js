import { LitElement, html, css } from 'lit';

export class DynamixApp extends LitElement {
  static properties = {
    title: { type: String },
    connected: { type: Boolean }
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      text-align: center;
      color: white;
      padding: 3rem 0;
    }

    h1 {
      font-size: 3rem;
      margin: 0 0 1rem 0;
      font-weight: 700;
    }

    .subtitle {
      font-size: 1.25rem;
      opacity: 0.9;
    }

    .content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .welcome {
      font-size: 1.125rem;
      line-height: 1.6;
      color: #333;
    }

    .tracks-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
  `;

  constructor() {
    super();
    this.title = 'Dynamix 2025';
    this.connected = false;
  }

  firstUpdated() {
    this.setupConnection();
  }

  setupConnection() {
    const tracksComponent = this.shadowRoot.querySelector('tracks-component');
    if (tracksComponent) {
      const host = 'localhost';
      const port = 9000;
      const useSSL = false;
      
      const protocol = useSSL ? 'wss' : 'ws';
      tracksComponent.serverURI = `${protocol}://${host}:${port}`;
      
      console.log(`Setting server URI to: ${tracksComponent.serverURI}`);
    }
  }

  render() {
    return html`
      <div class="container">
        <header>
          <h1>${this.title}</h1>
          <p class="subtitle">Music Library Manager</p>
        </header>
        
        <div class="content">
          <p class="welcome">
            Welcome to Dynamix 2025! 
            This music library manager allows you to scan directories and view metadata for your music collection.
            Enter a directory path below to get started.
          </p>
        </div>

        <div class="tracks-section">
          <tracks-component></tracks-component>
        </div>
      </div>
    `;
  }
}

customElements.define('dynamix-app', DynamixApp);
