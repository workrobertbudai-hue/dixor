import TOPICS from '../data/chat-topics.json';
import { live } from '../net/live.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtTime(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function drift(base) {
  const d = Math.floor(Date.now() / 45000) % 9 - 4;
  return Math.max(3, base + d);
}

/**
 * COMMUNITY CHAT - tematikus szobak.
 * LIVE mod: valodi uzenetek a szerveren keresztul (mas bongeszoablakok latak!)
 * SIM mod: helyi tarsalgas-szimulacio. Sajat uzenetek mindig perzisztensek.
 */
export class ChatView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.topic = null;
    this.currentTid = null;
    this.timer = null;
    this._lastTy = 0;
    this._tyTO = null;

    live.init();

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-chat';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);

    /* ---- LIVE esemenyek ---- */

    live.on('chat', (m) => {
      if (!this.isOpen || !this.topic || !m || m.topicId !== this.topic.id) return;
      if (m.from === live.handle) return;
      if (this.stream) {
        this.stream.insertAdjacentHTML('beforeend',
          this.msgHtml(m.from, m.text, m.at, false, false));
        this.scrollDown();
      }
    });

    live.on('typing', (d) => {
      if (!this.isOpen || !this.topic || !d || d.topicId !== this.topic.id) return;
      if (d.who === live.handle) return;
      const ty = this.el.querySelector('#dx-typing');
      if (ty) {
        ty.textContent = d.who + ' is typing...';
        clearTimeout(this._tyTO);
        this._tyTO = setTimeout(() => { ty.textContent = ''; }, 2600);
      }
    });

    live.on('system', (d) => {
      if (!this.isOpen || !this.topic || !d || d.topicId !== this.topic.id) return;
      if (d.type === 'join' && this.stream) {
        this.stream.insertAdjacentHTML('beforeend',
          this.msgSys((d.who || 'Someone') + ' JOINED THE ROOM'));
        this.scrollDown();
      }
    });

    live.on('status', () => {
      if (!this.isOpen || !this.currentTid) return;
      if (live.connected) {
        this.stopSim();
        live.emit('room:join', { topicId: this.currentTid });
        this.renderMain();
      } else {
        this.scheduleSim();
      }
    });
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open(contextModule) {
    this.contextModule = contextModule || null;
    this.render();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.stopSim();
    if (this.currentTid) live.emit('room:leave', { topicId: this.currentTid });
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  stopSim() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  orderedTopics() {
    const ctx = [], rest = [];
    TOPICS.topics.forEach((t) => {
      if (this.contextModule && t.module === this.contextModule) ctx.push(t);
      else rest.push(t);
    });
    return { ctx, rest };
  }

  render() {
    const { ctx, rest } = this.orderedTopics();

    let roomsHtml = '<div class="dx-chat__sechead">' + (ctx.length ? 'THIS AREA' : 'TOPICS') + '</div>';
    ctx.forEach((t) => { roomsHtml += this.roomBtn(t); });
    if (ctx.length && rest.length) roomsHtml += '<div class="dx-chat__sechead">ALL TOPICS</div>';
    rest.forEach((t) => { roomsHtml += this.roomBtn(t); });

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">COMMUNITY</span>' +
          '<h2 class="dx-jobs__title">TOPIC ROOMS</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-jobs__meta">JOIN THE ROOM THAT MATCHES YOUR INTEREST</div>' +
      '<div class="dx-chat__layout">' +
        '<div class="dx-chat__rooms">' + roomsHtml + '</div>' +
        '<div class="dx-chat__main" id="dx-chatmain"></div>' +
      '</div>' +
      '<footer class="dx-apps__note">' +
        (live.connected
          ? 'LIVE ROOMS ON THE DIXOR SERVER &#183; YOUR HANDLE: ' + esc(live.handle.toUpperCase())
          : 'SIMULATED COMPANY FOR NOW &#183; START THE SERVER FOR LIVE CHAT') +
      '</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.dx-room').forEach((b) =>
      b.addEventListener('click', () => this.select(b.dataset.tid)));

    const first = ctx[0] || rest.find((t) => t.id === 'lobby') || rest[0];
    if (first) this.select(first.id);
  }

  roomBtn(t) {
    const n = live.connected ? (live.roomCounts[t.id] ?? 0) : drift(t.members);
    return (
      '<button class="dx-room" data-tid="' + t.id + '">' +
        '<b>' + t.label + '</b>' +
        '<span>' + n + ' members</span>' +
        (t.module ? '<span class="dx-room__mod">' + t.module.toUpperCase() + '</span>' : '') +
      '</button>'
    );
  }

  select(tid) {
    this.stopSim();
    if (this.currentTid && this.currentTid !== tid) {
      live.emit('room:leave', { topicId: this.currentTid });
    }
    this.topic = TOPICS.topics.find((t) => t.id === tid);
    this.currentTid = tid;

    this.el.querySelectorAll('.dx-room').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.tid === tid));

    this.renderMain();

    if (live.connected) {
      live.emit('room:join', { topicId: tid });
    } else {
      this.scheduleSim();
    }
  }

  renderMain() {
    const t = this.topic;
    if (!t) return;
    const log = this.stateStore.getChatLog(t.id);
    const oldN = Math.min(3, t.lines.length);
    const isLive = live.connected;
    const mem = isLive ? Math.max(1, live.roomCounts[t.id] ?? 0) : drift(t.members);

    let html =
      '<div class="dx-chat__roomhead">' +
        '<b>' + t.label + '</b>' +
        '<span>' + mem + ' MEMBERS' + (t.module ? ' &#183; ' + t.module.toUpperCase() : '') + '</span>' +
        (isLive ? '<i class="dx-livechip">&#9679; LIVE</i>' : '') +
      '</div>' +
      '<div class="dx-chat__stream" id="dx-stream">';

    if (isLive && mem <= 1) {
      html += this.msgSys('YOU ARE THE FIRST ONE HERE RIGHT NOW');
    }

    for (let i = 0; i < oldN; i++) {
      const u = t.users[i % t.users.length];
      html += this.msgHtml(u, t.lines[(i + t.users.length) % t.lines.length], null, true, false);
    }
    log.forEach((m) => { html += this.msgHtml('YOU', m.text, m.at, false, true); });

    html +=
      '</div>' +
      '<div class="dx-chat__typing" id="dx-typing"></div>' +
      '<div class="dx-chat__inputrow">' +
        '<input class="dx-field" id="dx-msg" maxlength="240" placeholder="Write to ' + esc(t.label.toLowerCase()) + '..." />' +
        '<button class="dx-btn" id="dx-send">SEND</button>' +
      '</div>';

    this.el.querySelector('#dx-chatmain').innerHTML = html;

    this.stream = this.el.querySelector('#dx-stream');
    this.scrollDown();

    const inp = this.el.querySelector('#dx-msg');

    const send = () => {
      const txt = inp.value.trim();
      if (!txt || !this.topic) return;
      const msg = { text: txt, at: Date.now() };
      this.stateStore.addChatMessage(this.topic.id, msg);
      inp.value = '';
      this.stream.insertAdjacentHTML('beforeend', this.msgHtml('YOU', txt, msg.at, false, true));
      this.scrollDown();
      if (live.connected) {
        live.emit('chat:message', { topicId: this.topic.id, text: txt });
      }
    };

    this.el.querySelector('#dx-send').addEventListener('click', send);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

    inp.addEventListener('input', () => {
      if (!live.connected || !this.topic) return;
      const now = Date.now();
      if (now - this._lastTy > 1500) {
        this._lastTy = now;
        live.emit('typing', { topicId: this.topic.id });
      }
    });
  }

  msgHtml(who, text, at, old, own) {
    const whoHtml = own
      ? '<i style="color:var(--dx-accent)">YOU</i>'
      : '<i>' + esc(who) + '</i>';
    const whenHtml = at ? '<span>' + fmtTime(at) + '</span>' : (old ? '<span>EARLIER</span>' : '<span>NOW</span>');

    return (
      '<div class="dx-cm' + (own ? ' dx-cm--own' : '') + (old ? ' dx-cm--old' : '') + '">' +
        '<div class="dx-cm__meta">' + whoHtml + whenHtml + '</div>' +
        '<p>' + esc(text) + '</p>' +
      '</div>'
    );
  }

  msgSys(text) {
    return '<div class="dx-cm dx-cm--sys"><p>&#9679; ' + esc(text) + '</p></div>';
  }

  scrollDown() {
    requestAnimationFrame(() => {
      if (this.stream) this.stream.scrollTop = this.stream.scrollHeight;
    });
  }

  scheduleSim() {
    const delay = 9000 + Math.random() * 8000;
    this.timer = setTimeout(() => this.simStep(), delay);
  }

  simStep() {
    if (!this.isOpen || !this.topic || live.connected) return;
    const t = this.topic;
    const typer = t.users[Math.floor(Math.random() * t.users.length)];

    const tyEl = this.el.querySelector('#dx-typing');
    if (tyEl) tyEl.textContent = typer + ' is typing...';

    setTimeout(() => {
      if (!this.isOpen || !this.topic || live.connected) return;
      const line = t.lines[Math.floor(Math.random() * t.lines.length)];
      this.stream.insertAdjacentHTML('beforeend', this.msgHtml(typer, line, Date.now(), false, false));
      const ty = this.el.querySelector('#dx-typing');
      if (ty) ty.textContent = '';
      this.scrollDown();
      this.scheduleSim();
    }, 1700);
  }
}