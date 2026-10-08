/**
 * Web Audio API procedural sound synthesizer.
 * All sounds are generated procedurally — zero external audio files.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true; // Default muted — no autoplay
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  // Every node created for the ambient drone (oscillators, gains, filters,
  // LFOs). stopAmbient disconnects all of them — previously only the
  // oscillators were tracked, leaking Gain/Filter nodes per start cycle.
  private ambientNodes: AudioNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.08, this.ctx.currentTime, 0.5);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
    if (!this.isMuted) {
      this.startAmbient();
    }
    return this.isMuted;
  }

  /** Soft romantic ambient background drone */
  public startAmbient() {
    if (this.isAmbientPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      this.isAmbientPlaying = true;

      const master = this.ctx.createGain();
      master.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
      master.connect(this.ctx.destination);
      this.ambientGain = master;

      // Chord frequencies: C3, G3, B3, E4 (peaceful, romantic Cmaj7/9)
      const freqs = [130.81, 196.00, 246.94, 329.63, 392.00];
      const created: AudioNode[] = [];
      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (i * 0.3), this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + i * 50, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.04 / (i + 1), this.ctx.currentTime);

        // Gentle tremolo
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + i * 0.05, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        created.push(lfo, lfoGain, gain, filter);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        osc.start();
        created.push(osc);
      });
      this.ambientNodes = created;
    } catch {
      // Audio context might fail before interaction — intentional silent fallback.
      this.isAmbientPlaying = false;
    }
  }

  /** Stop the ambient drone and release all ambient nodes. */
  public stopAmbient() {
    try {
      for (const node of this.ambientNodes) {
        try {
          // Oscillators expose stop(); other nodes only need disconnect.
          (node as OscillatorNode).stop?.();
        } catch {
          /* already stopped */
        }
        try {
          node.disconnect();
        } catch {
          /* already disconnected */
        }
      }
    } finally {
      this.ambientNodes = [];
      if (this.ambientGain) {
        try {
          this.ambientGain.disconnect();
        } catch {
          /* already disconnected */
        }
        this.ambientGain = null;
      }
      this.isAmbientPlaying = false;
    }
  }

  /** Fully release the AudioContext (call on page teardown if needed). */
  public dispose() {
    this.stopAmbient();
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      void ctx.close().catch(() => {
        /* intentional: context may already be closed */
      });
    }
  }

  /** Blooming chime cascade */
  public playBloomChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.3);
      });
    } catch { /* noop */ }
  }
}

export const soundManager = new SoundManager();
