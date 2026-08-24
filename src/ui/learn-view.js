import VOCAB from '../data/vocab.json';

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * LEARN VIEW - Languages / Progress munkafelulet (Section 28).
 * Nem chat-alapu: valogatas, kartyak, gyorsteszt - a chat csak ott, ahol tenyleg segit.
 */
export class LearnView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-learn';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() { this.renderPicker(); this.#show(); }
  openProgress() { this.renderProgress(); this.#show(); }

  #show() {
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #frame(title, inner) {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">LEARN &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">' + title + '</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' + inner;
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
  }

  /* ---------- valaszto ---------- */

  renderPicker() {
    const prog = this.stateStore.getLearnProgress();

    const rows = VOCAB.languages.map((L) => {
      const s = prog[L.id];
      const sub = s
        ? s.known.length + '/' + L.words.length + ' words &#183; ' + s.sessions + ' sessions'
        : 'first session';
      return (
        '<button class="dx-calm__opt" data-lang="' + L.id + '">' +
          '<b>' + L.label + '</b><span>' + L.tagline + ' &#183; ' + sub + '</span>' +
        '</button>'
      );
    }).join('');

    this.#frame('LANGUAGES',
      '<div class="dx-jobs__meta">PICK A LANGUAGE TO PRACTICE</div>' +
      '<div class="dx-learn__opts">' + rows + '</div>' +
      '<footer class="dx-apps__note">SMALL SESSIONS BEAT MARATHONS</footer>');

    this.el.querySelectorAll('[data-lang]').forEach((b) =>
      b.addEventListener('click', () => this.renderLength(b.dataset.lang)));
  }

  renderLength(langId) {
    this.langId = langId;
    const L = VOCAB.languages.find((x) => x.id === langId);
    const max = Math.min(6, L.words.length);

    this.#frame(L.label,
      '<div class="dx-jobs__meta">SESSION LENGTH</div>' +
      '<div class="dx-learn__opts">' +
        '<button class="dx-calm__opt" data-len="4"><b>QUICK</b><span>4 words &#183; about 2 minutes</span></button>' +
        '<button class="dx-calm__opt" data-len="' + max + '"><b>STANDARD</b><span>6 words &#183; about 4 minutes</span></button>' +
      '</div>' +
      '<footer class="dx-apps__note">STRUCTURE FIRST - CHAT ONLY WHERE IT HELPS</footer>');

    this.el.querySelectorAll('[data-len]').forEach((b) =>
      b.addEventListener('click', () => this.startSession(parseInt(b.dataset.len, 10))));
  }

  /* ---------- kartyak ---------- */

  startSession(count) {
    const L = VOCAB.languages.find((x) => x.id === this.langId);
    this.langDef = L;
    this.queue = shuffle(L.words).slice(0, Math.min(count, L.words.length));
    this.idx = 0;
    this.markedKnown = [];
    this.markedPractice = [];
    this.renderCard(false);
  }

  renderCard(revealed) {
    if (this.idx >= this.queue.length) return this.startTest();

    const item = this.queue[this.idx];
    const prog = Math.round((this.idx / this.queue.length) * 100);

    const body = revealed
      ? '<div class="dx-lc__word dx-lc__word--small">' + item.w + '</div>' +
        '<div class="dx-lc__trans">' + item.t + '</div>' +
        '<div class="dx-disc__opts">' +
          '<button class="dx-btn dx-btn--big" id="dx-known">I KNEW IT</button>' +
          '<button class="dx-btn dx-btn--big dx-btn--ghost" id="dx-practice">NEEDS PRACTICE</button>' +
        '</div>'
      : '<button class="dx-lc__reveal" id="dx-reveal">' +
          '<span class="dx-lc__word">' + item.w + '</span>' +
          '<span class="dx-lc__hint">TAP TO REVEAL</span>' +
        '</button>';

    this.#frame(this.langDef.label,
      '<div class="dx-disc__meta">CARD ' + (this.idx + 1) + ' / ' + this.queue.length + '</div>' +
      '<div class="dx-disc__bar"><i style="width:' + prog + '%"></i></div>' +
      '<div class="dx-lc">' + body + '</div>');

    if (!revealed) {
      this.el.querySelector('#dx-reveal').addEventListener('click', () => this.renderCard(true));
    } else {
      this.el.querySelector('#dx-known').addEventListener('click', () => {
        this.markedKnown.push(item.w); this.idx++; this.renderCard(false);
      });
      this.el.querySelector('#dx-practice').addEventListener('click', () => {
        this.markedPractice.push(item.w); this.idx++; this.renderCard(false);
      });
    }
  }

  /* ---------- gyorsteszt ---------- */

  startTest() {
    const qs = shuffle(this.queue).map((item) => {
      const wrong = shuffle(
        this.langDef.words.filter((w) => w.t !== item.t)
      ).slice(0, 3).map((w) => w.t);
      return { q: item, opts: shuffle([item.t].concat(wrong)) };
    });

    this.testQs = qs;
    this.qi = 0;
    this.score = 0;
    this.correctWords = [];
    this.renderQuestion(null);
  }

  renderQuestion(feedback) {
    if (this.qi >= this.testQs.length) return this.renderResult();

    const tq = this.testQs[this.qi];
    const prog = Math.round((this.qi / this.testQs.length) * 100);

    const opts = tq.opts.map((o) => {
      let cls = 'dx-lopt';
      if (feedback) {
        if (o === tq.q.t) cls += ' is-right';
        else if (o === feedback.picked) cls += ' is-wrong';
        else cls += ' is-dim';
      }
      return '<button class="' + cls + '" data-t="' + o.replace(/"/g, '&quot;') + '">' + o + '</button>';
    }).join('');

    const fb = !feedback ? ''
      : (feedback.ok
        ? '<div class="dx-lt__fb is-ok">CORRECT</div>'
        : '<div class="dx-lt__fb is-no">IT MEANS &quot;' + tq.q.t + '&quot;</div>');

    this.#frame('QUICK TEST',
      '<div class="dx-disc__meta">QUESTION ' + (this.qi + 1) + ' / ' + this.testQs.length + '</div>' +
      '<div class="dx-disc__bar"><i style="width:' + prog + '%"></i></div>' +
      '<p class="dx-disc__q">WHAT DOES &quot;' + tq.q.w + '&quot; MEAN?</p>' +
      '<div class="dx-learn__opts">' + opts + '</div>' + fb);

    if (!feedback) {
      this.el.querySelectorAll('.dx-lopt').forEach((b) =>
        b.addEventListener('click', () => {
          const ok = b.dataset.t === tq.q.t;
          if (ok) { this.score++; this.correctWords.push(tq.q.w); }
          this.renderQuestion({ picked: b.dataset.t, ok: ok });
          setTimeout(() => { this.qi++; this.renderQuestion(null); }, ok ? 700 : 1500);
        }));
    }
  }

  /* ---------- eredmeny + haladas ---------- */

  renderResult() {
    const total = this.testQs.length;
    const savedSet = [...new Set(this.markedKnown.concat(this.correctWords))];

    this.stateStore.recordLearnSession(this.langId, savedSet);
    const prog = this.stateStore.getLearnProgress()[this.langId];

    this.#frame('SESSION COMPLETE',
      '<div class="dx-lc">' +
        '<div class="dx-lc__score">' + this.score + '<small>/' + total + '</small></div>' +
        '<div class="dx-lc__scorehint">QUICK TEST SCORE</div>' +
        '<p class="dx-lc__saved">' + savedSet.length + ' WORDS SAVED TO PROGRESS</p>' +
        '<p class="dx-lc__saved dx-lc__saved--dim">' + prog.known.length + ' KNOWN IN ' + this.langDef.label + ' OVERALL</p>' +
      '</div>' +
      '<div class="dx-disc__opts">' +
        '<button class="dx-btn dx-btn--big" id="dx-again">ANOTHER SESSION</button>' +
        '<button class="dx-btn dx-btn--ghost" id="dx-toprogress">VIEW PROGRESS</button>' +
      '</div>');

    this.el.querySelector('#dx-again').addEventListener('click', () => this.renderLength(this.langId));
    this.el.querySelector('#dx-toprogress').addEventListener('click', () => this.renderProgress());
  }

  renderProgress() {
    const prog = this.stateStore.getLearnProgress();

    const rows = VOCAB.languages.map((L) => {
      const s = prog[L.id];
      const pct = Math.round(((s ? s.known.length : 0) / L.words.length) * 100);
      const sub = s
        ? s.known.length + '/' + L.words.length + ' words &#183; ' + s.sessions + ' sessions'
        : 'not started';
      return (
        '<div class="dx-lgrow">' +
          '<div class="dx-lgrow__head"><b>' + L.label + '</b><span>' + sub + '</span></div>' +
          '<div class="dx-disc__bar"><i style="width:' + pct + '%"></i></div>' +
        '</div>'
      );
    }).join('');

    this.#frame('PROGRESS',
      '<div class="dx-jobs__meta">KNOWLEDGE GROWS SESSION BY SESSION</div>' +
      '<div class="dx-learn__opts">' + rows + '</div>' +
      '<div class="dx-disc__actions">' +
        '<button class="dx-btn dx-btn--big" id="dx-start">START A SESSION</button>' +
      '</div>' +
      '<footer class="dx-apps__note">TIMELINE VIEW ARRIVES WITH THE TEMPORAL ENGINE</footer>');

    this.el.querySelector('#dx-start').addEventListener('click', () => this.renderPicker());
  }
}