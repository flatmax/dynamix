import { html } from 'lit';

export class PlayerUI {
  static renderNoTrack() {
    return html`
      <div class="player-container">
        <div class="no-track">
          <md-icon>music_note</md-icon>
          <p>No track selected. Click a track to play.</p>
        </div>
      </div>
    `;
  }

  static renderError(error) {
    return html`
      <div class="error">
        <md-icon>error</md-icon>
        <span>${error}</span>
      </div>
    `;
  }

  static renderLoading() {
    return html`
      <div class="loading">
        <md-linear-progress indeterminate></md-linear-progress>
        <p>Loading track...</p>
      </div>
    `;
  }

  static renderTrackInfo(track) {
    const common = track.metadata?.common || {};
    return html`
      <div class="track-info">
        <h3 class="track-title">${common.title || track.fileName}</h3>
        ${common.artist ? html`<p class="track-artist">${common.artist}</p>` : ''}
      </div>
    `;
  }

  static renderProgressBar(currentTime, duration, onProgressClick) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return html`
      <div class="progress-container">
        <div class="progress-bar" @click=${onProgressClick}>
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="time-display">
          <span>${PlayerUI.formatTime(currentTime)}</span>
          <span>${PlayerUI.formatTime(duration)}</span>
        </div>
      </div>
    `;
  }

  static renderControls(isPlaying, direction, onStop, onTogglePlayPause, onToggleDirection, onSyncWindow) {
    return html`
      <div class="controls">
        <md-icon-button @click=${onStop}>
          <md-icon>stop</md-icon>
        </md-icon-button>

        <md-icon-button @click=${onTogglePlayPause}>
          <md-icon>${isPlaying ? 'pause' : 'play_arrow'}</md-icon>
        </md-icon-button>

        <md-icon-button @click=${onToggleDirection}>
          <md-icon>${direction === 1 ? 'fast_forward' : 'fast_rewind'}</md-icon>
        </md-icon-button>

        <md-icon-button @click=${onSyncWindow} title="Sync window to current position">
          <md-icon>sync</md-icon>
        </md-icon-button>

        <span class="direction-indicator">
          ${direction === 1 ? 'Forward' : 'Reverse'}
        </span>
      </div>
    `;
  }

  static renderWindowSizeControl(windowSize, minWindowSize, maxWindowSize, audioContext, onWindowSizeChange, onDivide, onMultiply) {
    return html`
      <div class="window-size-control">
        <div class="window-size-label">
          <span>Window Size (N)</span>
          <span class="window-size-value">${PlayerUI.formatWindowSize(windowSize, audioContext)}</span>
        </div>
        <div class="window-size-controls">
          <input
            type="range"
            class="window-size-slider"
            min="${minWindowSize}"
            max="${maxWindowSize}"
            step="128"
            .value="${windowSize}"
            @input=${onWindowSizeChange}
          />
          <div class="window-size-buttons">
            <md-icon-button @click=${onDivide} title="Divide window size by 2">
              <md-icon>exposure_neg_1</md-icon>
            </md-icon-button>
            <md-icon-button @click=${onMultiply} title="Multiply window size by 2">
              <md-icon>exposure_plus_1</md-icon>
            </md-icon-button>
          </div>
        </div>
      </div>
    `;
  }

  static formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  static formatWindowSize(frames, audioContext) {
    if (!audioContext) return `${frames} frames`;
    const sampleRate = audioContext.sampleRate;
    const seconds = frames / sampleRate;
    if (seconds < 1) {
      return `${frames} frames (${(seconds * 1000).toFixed(1)} ms)`;
    } else {
      return `${frames} frames (${seconds.toFixed(2)} s)`;
    }
  }
}
