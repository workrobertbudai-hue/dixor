import { MODULE_LIST } from '../nodes/node-data.js';
import { live } from '../net/live.js';
import VOCAB from '../data/vocab.json';
import JOBS from '../data/jobs.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * PERSONAL HUB - az egesz DIXOR-elemleny egy helyen (Section 32).
 * Identitas + aktivitas + tanulasi haladas + jelentkezesek.
 */
export class PersonalView {
  constructor({ stateStore, onEditProfile }) {
    this.stateStore = stateStore;
    this.onEditProfile = onEditProfile;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-personal';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() {
    this.render();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #fmtDate(ms) {
    if (!ms) return 'TODAY';
    return new Date(ms).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).toUpperCase();
  }

  render() {
    const p = this.stateStore.getProfile();
    const visits = this.stateStore.getVisits();
    const apps = this.stateStore.getApplications();
    const lp = this.stateStore.getLearnProgress();
    const since = this.stateStore.memberSince();
    const isLive = live.connected;

    /* aktivitas savok */
    const counts = Object.values(visits);
    const maxV = Math.max(1, ...counts, 1);
    let actRows = '';
    let totalVisits = 0;
    MODULE_LIST.forEach((m) => {
      const v = visits[m.id] ?? 0;
      totalVisits += v;
      actRows +=
        '<div class="dx-lgrow">' +
          '<div class="dx-lgrow__head"><b style="color:' + m.accent + '">' + m.label + '</b><span>' + v + 'x</span></div>' +
          '<div class="dx-disc__bar"><i style="width:' + Math.round((v / maxV) * 100) + '%;background:' + m.accent + ';box-shadow:none"></i></div>' +
        '</div>';
    });
    if (!totalVisits) {
      actRows = '<span class="dx-prof__empty">Your journey starts now - explore the ring.</span>';
    }

    /* tanulasi haladas */
    let learnRows = '';
    let learnedTotal = 0;
    VOCAB.languages.forEach((L) => {
      const s = lp[L.id];
      const known = s ? s.known.length : 0;
      learnedTotal += known;
      const pct = Math.round((known / L.words.length) * 100);
      learnRows +=
        '<div class="dx-lgrow">' +
          '<div class="dx-lgrow__head"><b>' + L.label + '</b><span>' + known + '/' + L.words.length + '</span></div>' +
          '<div class="dx-disc__bar"><i style="width:' + pct + '%"></i></div>' +
        '</div>';
    });

    /* jelentkezesek */
    const latest = [...apps].sort((x, y) => (y.at ?? 0) - (x.at ?? 0))[0];
    const latestJob = latest ? JOBS.jobs.find((j) => j.id === latest.id) : null;
    const appsHtml = latestJob
      ? '<div class="dx-apps__row"><span>LATEST</span><b>' + esc(latestJob.title) + '</b></div>' +
        '<div class="dx-apps__row"><span>SUBMITTED</span><b>' + this.#fmtDate(latest.at) + '</b></div>'
      : '<div class="dx-apps__row"><span>STATUS</span><b>NO APPLICATIONS YET</b></div>';

    const skillCount = p.skills.length;
    const langCount = p.languages.length;

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">PERSONAL &#183; HUB</span>' +
          '<h2 class="dx-jobs__title">MY DIXOR</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +

      '<div class="dx-pv__id">' +
        '<div class="dx-pv__avatar">' + esc(live.handle.slice(0, 2).toUpperCase()) + '</div>' +
        '<div class="dx-pv__idtext">' +
          '<b>' + esc(live.handle.toUpperCase()) +
            (isLive ? ' <i class="dx-livechip">&#9679; ONLINE</i>' : '') +
          '</b>' +
          '<span>' + esc(p.headline) + '</span>' +
          '<small>MEMBER SINCE ' + this.#fmtDate(since) + ' &#183; ' + skillCount + ' SKILLS &#183; ' + langCount + ' LANGUAGES</small>' +
        '</div>' +
      '</div>' +

      '<button class="dx-btn" id="dx-editprofile" style="width:100%;margin-top:12px;">EDIT PROFILE</button>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">ACTIVITY &#183; ' + totalVisits + ' VISITS</div>' + actRows +
      '</div>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">LEARN PROGRESS &#183; ' + learnedTotal + ' WORDS</div>' + learnRows +
      '</div>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">APPLICATIONS &#183; ' + apps.length + '</div>' + appsHtml +
      '</div>' +

      '<footer class="dx-apps__note">YOUR DATA STAYS YOURS &#183; STORED LOCALLY UNTIL THE CLOUD LAYER</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.el.querySelector('#dx-editprofile').addEventListener('click', () => {
      this.close();
      this.onEditProfile ? this.onEditProfile() : null;
    });
  }
}