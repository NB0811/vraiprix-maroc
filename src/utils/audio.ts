/**
 * Audio feedback management for VraiPrix Maroc.
 * Web Audio API with strict lifecycle, immediate cancellation and cleanup.
 */

// Track active audio nodes and context globally so they can be immediately cut off
let globalAudioCtx: AudioContext | null = null;
const activeOscillators = new Set<OscillatorNode>();
const activeGains = new Set<GainNode>();

/**
 * Immediately stops all playing and scheduled beeps, disconnects audio nodes,
 * and suspends/closes the AudioContext.
 */
export function stopAllAudio() {
  // 1. Immediately stop and disconnect all active oscillators
  activeOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Already stopped or disconnected
    }
  });
  activeOscillators.clear();

  // 2. Disconnect all gain nodes
  activeGains.forEach((gain) => {
    try {
      gain.disconnect();
    } catch {
      // Already disconnected
    }
  });
  activeGains.clear();

  // 3. Suspend or close audio context if active
  if (globalAudioCtx) {
    try {
      if (globalAudioCtx.state !== 'closed') {
        globalAudioCtx.close().catch(() => {});
      }
    } catch {
      // Ignore audio context close errors
    }
    globalAudioCtx = null;
  }
}

/**
 * Plays a pleasant, subtle electronic scan confirmation chime via Web Audio API.
 * 100% offline, zero audio file dependencies.
 * Automatically tracks nodes for instant cutoff on page exit.
 */
export function playScanBeep(enabled = true) {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
      globalAudioCtx = new AudioContextClass();
    }

    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }

    const ctx = globalAudioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency chirp: 880Hz to 1760Hz
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Register active nodes
    activeOscillators.add(osc);
    activeGains.add(gain);

    osc.onended = () => {
      try {
        osc.disconnect();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
      activeOscillators.delete(osc);
      activeGains.delete(gain);
    };

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (err) {
    console.debug('Audio play skipped:', err);
  }
}

/**
 * Triggers light haptic feedback on mobile if supported.
 */
export function triggerHaptic(enabled = true, durationMs = 60) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    // Haptics not allowed or unsupported
  }
}
