import { MODULE_LIST } from '../nodes/node-data.js';
import VOCAB from '../data/vocab.json';
import { live } from '../net/live.js';

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function dayStr(d){const x=d||new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');}

/**
 * DAILY PULSE - szemelyes reggeli kartya (retencios elem).
 * Naponta egyszer auto-nyilik; streak + osszesites.
 */
export class DailyPulseView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-pulse';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);

    /* kis gomb a dwell gomb ala */
    const wrap = document.createElement('div');
    wrap.className = 'dx-pulsebtn';
    const b = document.createElement('button');
    b.innerHTML = '&#128202;';
    b.title = 'Daily Pulse';
    b.addEventListener('click', () => this.open());
    wrap.appendChild(b);
    document.body.appendChild(wrap);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  /** Naponta egyszer auto; kezi nyitasra mindig */
  maybeAutoOpen() {
    const today = dayStr();
    if (this.stateStore.getKV('pulseShownDay','') === today) return;
    this.stateStore.setKV('pulseShownDay', today);
    this.open();
  }

  open() {
    this.render();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }
  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  render() {
    const st = this.stateStore.getStreak();
    const apps = this.stateStore.getApplications();
    const lp = this.stateStore.getLearnProgress();
    const cons = this.stateStore.getKV('constellation', []);
    const p = this.stateStore.getProfile();

    let words = 0;
    VOCAB.languages.forEach((L)=>{ words += (lp[L.id]?.known.length ?? 0); });
    const sessions = Object.values(lp).reduce((a,s)=>a+(s?.sessions??0),0);

    const flame = st.count > 0 ? '&#128293;' : '&#9711;';

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div><span class="dx-jobs__chip">PERSONAL &#183; TODAY</span>' +
        '<h2 class="dx-jobs__title">DAILY PULSE</h2></div>' +
        '<button class="dx-jobs__close">&#10005;</button>' +
      '</header>' +

      '<div class="dx-pulse__streak">' +
        '<b>'+flame+' '+st.count+' DAY STREAK</b>' +
        '<span>BEST: '+st.best+'</span>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">YOUR MOMENTUM</div>' +
        '<div class="dx-apps__row"><span>KNOWN WORDS</span><b>'+words+'</b></div>' +
        '<div class="dx-apps__row"><span>LEARN SESSIONS</span><b>'+sessions+'</b></div>' +
        '<div class="dx-apps__row"><span>TRACKED JOBS</span><b>'+apps.length+'</b></div>' +
        '<div class="dx-apps__row"><span>CONSTELLATION</span><b>'+cons.length+' STARS</b></div>' +
        '<div class="dx-apps__row"><span>PROFILE SKILLS</span><b>'+p.skills.length+'</b></div>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">NETWORK</div>' +
        '<div class="dx-apps__row"><span>YOU ARE</span><b>'+esc(live.handle.toUpperCase())+'</b></div>' +
        '<div class="dx-apps__row"><span>RADAR</span><b>'+(this.stateStore.isRadarActive()?'ACTIVE':'OFFLINE')+'</b></div>' +
      '</div>' +

      '<footer class="dx-apps__note">COME BACK TOMORROW TO KEEP THE FLAME ALIVE</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click',()=>this.close());
  }
}