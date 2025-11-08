import { html, css } from 'lit';
import { LitElement } from 'lit';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/icon/icon.js';

export class TapTime extends LitElement {
  static properties = {
    tapTimes: { type: Array },
    averageInterval: { type: Number },
    bpm: { type: Number },
    lastTapTime: { type: Number }
  };

  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }

    .tap-container {
      background: var(--md-sys-color-surface-container);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--md-sys-elevation-level2);
      text-align: center;
    }

    .tap-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 20px 0;
    }

    .tap-button-container {
      margin-bottom: 20px;
    }

    .tap-button {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      font-size: 24px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }

    .tap-button:active {
      transform: scale(0.95);
    }

    .results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .result-item {
      background: var(--md-sys-color-surface-variant);
      padding: 16px;
      border-radius: 12px;
    }

    .result-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .result-value {
      font-size: 32px;
      font-weight: 500;
      color: var(--md-sys-color-primary);
      font-family: 'Roboto Mono', monospace;
    }

    .result-unit {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-left: 4px;
    }

    .tap-count {
      font-size: 14px;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 16px;
    }

    .controls {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .no-data {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 14px;
      padding: 20px;
    }
  `;

  constructor() {
    super();
    this.tapTimes = [];
    this.averageInterval = 0;
    this.bpm = 0;
    this.lastTapTime = null;
  }

  handleTap() {
    const now = performance.now();
    
    if (this.lastTapTime !== null) {
      const interval = now - this.lastTapTime;
      this.tapTimes.push(interval);
      
      // Keep only the last 16 taps
      if (this.tapTimes.length > 16) {
        this.tapTimes.shift();
      }
      
      this.calculateAverage();
    }
    
    this.lastTapTime = now;
    this.requestUpdate();
  }

  calculateAverage() {
    if (this.tapTimes.length === 0) {
      this.averageInterval = 0;
      this.bpm = 0;
      return;
    }
    
    const sum = this.tapTimes.reduce((acc, val) => acc + val, 0);
    this.averageInterval = sum / this.tapTimes.length;
    
    // Convert to BPM (beats per minute)
    // BPM = 60000 / interval_in_ms
    this.bpm = 60000 / this.averageInterval;
  }

  loadToPlayer() {
    if (this.averageInterval === 0) return;
    
    const event = new CustomEvent('tap-time-load', {
      detail: {
        intervalMs: this.averageInterval,
        bpm: this.bpm,
        frequency: 1000 / this.averageInterval
      },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  reset() {
    this.tapTimes = [];
    this.averageInterval = 0;
    this.bpm = 0;
    this.lastTapTime = null;
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="tap-container">
        <h3 class="tap-title">Tap Tempo</h3>

        <div class="tap-button-container">
          <md-filled-button 
            class="tap-button"
            @click=${this.handleTap}>
            <md-icon slot="icon">touch_app</md-icon>
            TAP
          </md-filled-button>
        </div>

        ${this.tapTimes.length > 0 ? html`
          <div class="tap-count">
            ${this.tapTimes.length} tap${this.tapTimes.length !== 1 ? 's' : ''} recorded
          </div>

          <div class="results">
            <div class="result-item">
              <div class="result-label">BPM</div>
              <div class="result-value">
                ${this.bpm.toFixed(1)}
              </div>
            </div>

            <div class="result-item">
              <div class="result-label">Interval</div>
              <div class="result-value">
                ${this.averageInterval.toFixed(0)}
                <span class="result-unit">ms</span>
              </div>
            </div>

            <div class="result-item">
              <div class="result-label">Frequency</div>
              <div class="result-value">
                ${(1000 / this.averageInterval).toFixed(2)}
                <span class="result-unit">Hz</span>
              </div>
            </div>
          </div>

          <div class="controls">
            <md-filled-button @click=${this.loadToPlayer}>
              <md-icon slot="icon">sync</md-icon>
              Load to Player
            </md-filled-button>
            <md-outlined-button @click=${this.reset}>
              <md-icon slot="icon">refresh</md-icon>
              Reset
            </md-outlined-button>
          </div>
        ` : html`
          <div class="no-data">
            Tap the button above to start measuring tempo
          </div>
        `}
      </div>
    `;
  }
}
