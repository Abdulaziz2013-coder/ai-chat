// Web Speech API Voice and Audio Synthesis Service

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // Play sci-fi UI synthesizer beeps
  public playBeep(type: 'send' | 'receive' | 'pride' | 'listen') {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'receive') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1050, now + 0.16);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'listen') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'pride') {
        // Triumphant chime for Creator
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, index) => {
          const o = this.audioCtx!.createOscillator();
          const g = this.audioCtx!.createGain();
          o.connect(g);
          g.connect(this.audioCtx!.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + index * 0.1);
          g.gain.setValueAtTime(0.1, now + index * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.25);
          o.start(now + index * 0.1);
          o.stop(now + index * 0.1 + 0.25);
        });
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  // Speak text with callback on start and end
  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    if (!this.synth) return;

    this.stop();

    // Clean text of markdown formatting for cleaner TTS output
    const cleanText = text
      .replace(/[*#_`~\[\]\(\)>]/g, ' ')
      .replace(/\n+/g, '. ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.05;
    utterance.volume = options.volume ?? 1.0;

    // Pick best matching voice (Uzbek if installed, or Russian/Turkish/English clear voice)
    const voices = this.getVoices();
    const uzbekVoice = voices.find((v) => v.lang.startsWith('uz'));
    const ruVoice = voices.find((v) => v.lang.startsWith('ru'));
    const enVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google'));

    if (uzbekVoice) {
      utterance.voice = uzbekVoice;
    } else if (ruVoice) {
      utterance.voice = ruVoice;
    } else if (enVoice) {
      utterance.voice = enVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }
}

export const speechService = new SpeechService();
