import { LitElement, html, css } from 'lit';

export class DynamixApp extends LitElement {
  static properties = {
    title: { type: String }
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
    }

    .welcome {
      font-size: 1.125rem;
      line-height: 1.6;
      color: #333;
    }
  `;

  constructor() {
    super();
    this.title = 'Dynamix 2025';
  }

  render() {
    return html`
      <div class="container">
        <header>
          <h1>${this.title}</h1>
          <p class="subtitle">Built with Lit Web Components</p>
        </header>
        
        <div class="content">
          <p class="welcome">
            Welcome to your new Dynamix 2025 application! 
            This is a modern web application built with Lit for the frontend 
            and Node.js/Express for the backend.
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define('dynamix-app', DynamixApp);
