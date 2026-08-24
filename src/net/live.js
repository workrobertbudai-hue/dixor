import { io } from 'socket.io-client';

const HANDLE_KEY = 'dixor.handle';
const ADJ = ['Swift', 'Calm', 'Bright', 'Quiet', 'Bold', 'Kind', 'Sharp', 'Steady'];
const NOUN = ['Otter', 'Falcon', 'Willow', 'Comet', 'Harbor', 'Ember', 'Maple', 'Nimbus'];

/** Munkanev TAB-onkent (sessionStorage) - igy ket ful ket kulon resztvevo. */
export function getHandle() {
  try {
    let h = sessionStorage.getItem(HANDLE_KEY);
    if (!h) {
      h =
        ADJ[Math.floor(Math.random() * ADJ.length)] +
        NOUN[Math.floor(Math.random() * NOUN.length)] +
        Math.floor(10 + Math.random() * 89);
      sessionStorage.setItem(HANDLE_KEY, h);
    }
    return h;
  } catch {
    return 'Guest';
  }
}

/**
 * LIVE LINK - kapcsolat a DIXOR szerverrel.
 * Ha nincs szerver, a connected marad false -> a widgetek szimulaciora buknak vissza.
 */
export const live = {
  socket: null,
  connected: false,
  handle: getHandle(),
  roomCounts: {},
  _subs: {},

  init() {
    if (this.socket) return;
    try {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        reconnectionDelayMax: 5000,
      });
    } catch {
      return;
    }

    const s = this.socket;

    s.on('connect', () => {
      this.connected = true;
      s.emit('hello', { handle: this.handle });
      this._emit('status');
    });

    s.on('disconnect', () => {
      this.connected = false;
      this._emit('status');
    });

    s.on('connect_error', () => {
      /* csendes: a felulet szimulacioban megy tovabb */
    });

    s.on('presence', (d) => this._emit('presence', d));
    s.on('rooms', (counts) => {
      this.roomCounts = counts || {};
      this._emit('rooms', this.roomCounts);
    });
    s.on('chat', (m) => this._emit('chat', m));
    s.on('typing', (d) => this._emit('typing', d));
    s.on('system', (d) => this._emit('system', d));
  },

  on(ev, fn) {
    (this._subs[ev] = this._subs[ev] || []).push(fn);
  },

  off(ev, fn) {
    this._subs[ev] = (this._subs[ev] || []).filter((f) => f !== fn);
  },

  _emit(ev, data) {
    (this._subs[ev] || []).forEach((fn) => {
      try { fn(data); } catch {}
    });
  },

  emit(ev, data) {
    if (this.connected && this.socket) this.socket.emit(ev, data);
  },
};