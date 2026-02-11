let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    // Create a pleasant two-tone notification
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.4);
  } catch {
    // Audio not available
  }
}
