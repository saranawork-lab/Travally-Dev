// Web Audio API Ringtone & Call Audio Synthesizer
// Generates audio ringtones without external mp3 files or network dependencies

class RingtoneManager {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private ringInterval: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play realistic incoming call ringtone cadence
  public playIncoming(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Melodic chime sequence: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: 0, dur: 0.22 },
        { freq: 659.25, time: 0.22, dur: 0.22 },
        { freq: 783.99, time: 0.44, dur: 0.28 },
        { freq: 1046.5, time: 0.72, dur: 0.45 },
        // Repeat pulse
        { freq: 523.25, time: 1.3, dur: 0.22 },
        { freq: 659.25, time: 1.52, dur: 0.22 },
        { freq: 783.99, time: 1.74, dur: 0.28 },
        { freq: 1046.5, time: 2.02, dur: 0.5 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + time);

        // Soft bell-like envelope
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.28, now + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    };

    playChord();
    this.ringInterval = setInterval(playChord, 3200);
  }

  // Play outgoing calling tone (soft dial ringback)
  public playOutgoing(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playRingback = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Standard dual tone: 440Hz + 480Hz for 1.8s
      [440, 480].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 1.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.85);
      });
    };

    playRingback();
    this.ringInterval = setInterval(playRingback, 4000);
  }

  // Play short call-ended tone
  public playCallEnded(): void {
    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.22].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const ringtone = new RingtoneManager();
