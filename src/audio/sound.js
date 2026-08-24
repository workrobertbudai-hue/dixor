/**
 * SOUND SYSTEM - ambient pad + interaction tick (Web Audio, no asset files).
 * Default OFF; state persisted. Starts fully only after a user gesture.
 */
export class SoundSystem {
  constructor(app) {
    this.app = app;
    this.stateStore = app.stateStore;
    this.enabled = this.stateStore.getKV('soundOn', false) === true;
    this.ctx = null;
    this.master = null;
    this.ambientNodes = [];

    this.#buildToggle();

    if (this.enabled) {
      const kick = () => {
        this.setEnabled(true);
        window.removeEventListener('pointerdown', kick);
        window.removeEventListener('keydown', kick);
      };
      window.addEventListener('pointerdown', kick);
      window.addEventListener('keydown', kick);
    }

    const dom = app.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.blip(720, 0.04);
    });
  }

  #buildToggle() {
    const wrap = document.createElement('div');
    wrap.className = 'dx-snd';
    this.btn = document.createElement('button');
    this.btn.title = 'Toggle sound';
    this.btn.innerHTML = this.enabled ? '&#128266;' : '&#128263;';
    this.btn.addEventListener('click', () => this.toggle());
    wrap.appendChild(this.btn);
    document.body.appendChild(wrap);
  }

  toggle() { this.setEnabled(!this.enabled); }

  setEnabled(v) {
    this.enabled = !!v;
    this.stateStore.setKV('soundOn', this.enabled);
    this.btn.innerHTML = this.enabled ? '&#128266;' : '&#128263;';
    if (this.enabled) {
      this.#ensure();
      this.#startAmbient();
      this.#fade(0.5);
    } else {
      this.#fade(0.0001);
    }
  }

  #ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);
  }

  #fade(target) {
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(target, t, 0.9);
  }

  #startAmbient() {
    if (!this.ctx || this.ambientNodes.length) return;
    const mk = (freq, type, vol) => {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      o.connect(g); g.connect(f); f.connect(this.master);
      o.start();
      return [o, g];
    };
    this.ambientNodes.push(mk(55, 'sine', 0.05));
    this.ambientNodes.push(mk(55.4, 'sine', 0.045));
    this.ambientNodes.push(mk(110.3, 'triangle', 0.012));
  }

  blip(freq, vol) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq || 880;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.1);
  }
}