import { css } from 'lit';

export const playerStyles = css`
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
