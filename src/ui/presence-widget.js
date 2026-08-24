import { MODULE_LIST } from '../nodes/node-data.js';
import { live } from '../net/live.js';

const WEIGHTS = {
  work: 0.21, learn: 0.15, discover: 0.11, life: 0.08, wellbeing: 0.13,
  create: 0.09, explore: 0.07, analyze: 0.06, personal: 0.05,
};

/**
 * PRESENCE WIDGET - online szamlalo.
 * LIVE mod: valodi szerver-adat | SIM mod: helyi ingadozas (nincs szerver).
 */
export class PresenceWidget {
  constructor() {
    live.init();

    this.count = 190 + Math.floor(Math.random() * 90);
    this.popOpen = false;
    this.sim = null;

    this.el = document.createElement('div');
    this.el.className = 'dx-presence';
    this.el.innerHTML =
      '<span class="dx-presence__dot"></span>' +
      '<span><b class="dx-presence__num">' + this.count + '</b> ONLINE</span>' +
      '<span class="dx-presence__badge">LIVE</span>' +
      '<div class="dx-popover" id="dx-pop"></div>';
    document.body.appendChild(this.el);

    this.numEl = this.el.querySelector('.dx-presence__num');

    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.popOpen = !this.popOpen;
      this.el.classList.toggle('is-open', this.popOpen);
      if (this.popOpen) this.#renderPop();
    });

    document.addEventListener('click', (e) => {
      if (this.popOpen && !this.el.contains(e.target)) {
        this.popOpen = false;
        this.el.classList.remove('is-open');
      }
    });

    // SIM ingadozas - csak amig nincs el kapcsolat
    this.#startSim();

    // LIVE esemenyek
    live.on('presence', (d) => {
      if (d && typeof d.count === 'number') {
        this.count = d.count;
        this.numEl.textContent = this.count;
        this.#bump();
        if (this.popOpen) this.#renderPop();
      }
    });

    live.on('rooms', () => {
      if (this.popOpen) this.#renderPop();
    });

    live.on('status', () => {
      this.el.classList.toggle('is-live', live.connected);
      if (live.connected && this.sim) {
        clearInterval(this.sim);
        this.sim = null;
      }
      if (!live.connected) this.#startSim();
      if (this.popOpen) this.#renderPop();
    });

    if (live.connected) this.el.classList.add('is-live');
  }

  #startSim() {
    if (this.sim) return;
    this.sim = setInterval(() => {
      if (live.connected) return;
      const delta = Math.floor(Math.random() * 9) - 3;
      this.count = Math.max(130, Math.min(380, this.count + delta));
      this.numEl.textContent = this.count;
      this.#bump();
      if (this.popOpen) this.#renderPop();
    }, 4000);
  }

  #bump() {
    this.el.classList.add('is-bump');
    setTimeout(() => this.el.classList.remove('is-bump'), 700);
  }

  #renderPop() {
    const pop = this.el.querySelector('#dx-pop');
    const isLive = live.connected;
    let rows = '';

    MODULE_LIST.forEach((m) => {
      const n = isLive
        ? (live.roomCounts[m.id] ?? 0)
        : Math.max(1, Math.round(this.count * (WEIGHTS[m.id] ?? 0)));
      rows +=
        '<div class="dx-popover__row">' +
          '<span><i class="dx-popover__dot" style="background:' + m.accent + '"></i>' + m.label + '</span>' +
          '<b>' + n + '</b>' +
        '</div>';
    });

    pop.innerHTML =
      '<h4>DIXOR RIGHT NOW ' +
        (isLive ? '<i class="dx-popover__live">&#9679; LIVE</i>' : '') +
      '</h4>' +
      rows +
      '<div class="dx-popover__note">' +
        (isLive
          ? 'REAL PEOPLE ON THE DIXOR SERVER &#183; YOU ARE: ' + live.handle.toUpperCase()
          : 'SIMULATED PRESENCE &#183; START THE SERVER FOR LIVE NETWORK') +
      '</div>';
  }
}