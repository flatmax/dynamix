export class PlayerEventHandlers {
  constructor(player) {
    this.player = player;
  }

  handleProgressClick(e) {
    if (!this.player.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const position = percent * this.player.duration;
    
    this.player.audioManager.seek(position);
  }

  handleWindowSizeChange(e) {
    const value = parseInt(e.target.value);
    this.player.windowSize = value;
    this.player.audioManager.setWindowSize(value);
  }

  multiplyWindowSize() {
    const newSize = this.player.windowSize * 2;
    this.player.windowSize = newSize;
    this.player.audioManager.setWindowSize(newSize);
  }

  divideWindowSize() {
    const newSize = Math.floor(this.player.windowSize / 2);
    this.player.windowSize = newSize;
    this.player.audioManager.setWindowSize(newSize);
  }

  handleStop() {
    this.player.audioManager.stop();
  }

  handleTogglePlayPause() {
    this.player.audioManager.togglePlayPause();
  }

  handleToggleDirection() {
    this.player.audioManager.toggleDirection();
    this.player.direction = this.player.audioManager.direction;
  }

  handleSyncWindow() {
    this.player.audioManager.syncWindow();
  }

  handleSkipBackToStart() {
    this.player.audioManager.skipBackToStart();
  }
}
