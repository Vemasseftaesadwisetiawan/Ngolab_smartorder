import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Lonceng pertama (Nada D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);

    // Lonceng kedua (Nada A5) 150ms kemudian
    setTimeout(() => {
      try {
        if (ctx.state === 'closed') return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 2.0);
      } catch (err) {}
    }, 150);
  } catch (e) {
    console.error('Gagal membunyikan lonceng:', e);
  }
}

export function playCallBellChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Bunyi Bell Kasir / Service Bell Klasik ("DING-DING!" cerah & metalik khas tuas kasir mekanik/meja layanan)
    const now = ctx.currentTime;

    const createStrike = (startTime: number, freq1: number, freq2: number, freq3: number) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const o3 = ctx.createOscillator();
      const gain = ctx.createGain();

      o1.type = 'sine'; o1.frequency.setValueAtTime(freq1, startTime);
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq2, startTime);
      o3.type = 'triangle'; o3.frequency.setValueAtTime(freq3, startTime); // Warna metalik kuningan

      gain.gain.setValueAtTime(0.6, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

      o1.connect(gain);
      o2.connect(gain);
      o3.connect(gain);
      gain.connect(ctx.destination);

      o1.start(startTime); o1.stop(startTime + 2.0);
      o2.start(startTime); o2.stop(startTime + 2.0);
      o3.start(startTime); o3.stop(startTime + 2.0);
    };

    // Pukulan Pertama seketika (0s)
    createStrike(now, 1318.51, 1567.98, 2093.00); // E6, G6, C7
    // Pukulan Kedua (0.08s kemudian - tempo sangat cepat khas pegas lonceng kasir)
    createStrike(now + 0.08, 1567.98, 2093.00, 2637.02); // G6, C7, E7
  } catch (e) {
    console.error('Gagal membunyikan lonceng kasir:', e);
  }
}
