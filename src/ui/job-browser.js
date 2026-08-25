import JOBS from '../data/jobs.json';
import { fetchLiveJobs } from '../work/livejobs.js';
import { computeMatches } from '../work/matching.js';

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/**
 * JOB BROWSER v2 - elo allasok ha elerhetoek, egyebkent mock.
 * Elo mod: OPEN ORIGINAL gomb a valodi hirdeteshez + LIVE jelvény.
 */
export class JobBrowser {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() {
    this.renderLoading();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    this.render();
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  renderLoading() {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div><span class="dx-jobs__chip">WORK · FUNCTION</span>' +
        '<h2 class="dx-jobs__title">FIND JOBS</h2></div>' +
        '<button class="dx-jobs__close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-apps__empty">LOADING LIVE OPPORTUNITIES…</div>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
  }

  async render() {
    const live = await fetchLiveJobs();
    this.liveMode = !!live;
    const list = live ? live.jobs : [...JOBS.jobs].sort((a,b)=>b.matchScore-a.matchScore);

    /* matching: elo adaton kulcsszo-alapu, mock-on a baseline+profil */
    const profile = this.stateStore.getProfile();
    const skills = (profile.skills||[]).map(s=>s.toLowerCase());

    const jobs = list.map(j => {
      if (!live) {
        const m = computeMatches(this.stateStore).find(x=>x.id===j.id);
        return { ...j, dynScore: m ? m.dynScore : j.matchScore, reasons: m?m.reasons:[], live:false };
      }
      const hay = (j.title+' '+j.summary+' '+j.company).toLowerCase();
      let score = 62;
      const reasons = [];
      skills.forEach(s => { if (s && hay.includes(s)) { score += 6; reasons.push('"'+s+'" appears in this role'); } });
      if (/remote/i.test(j.location)) { score += 4; reasons.push('remote-friendly location'); }
      if ((profile.mobility||'').toLowerCase()==='remote' && /remote/i.test(j.location)) { score += 3; reasons.push('matches your remote preference'); }
      if (/support|customer/i.test(hay) && skills.some(s=>/customer|communication/.test(s))) { score += 3; reasons.push('customer-facing match'); }
      if (/dev|developer|engineer|programming/i.test(hay)) { score += 2; reasons.push('technical role'); }
      return { ...j, dynScore: Math.min(97, Math.round(score)), reasons, live:true };
    }).sort((a,b)=>b.dynScore-a.dynScore);

    const cards = jobs.map(j=>this.#card(j)).join('');
    const updated = live && live.updatedAt
      ? new Date(live.updatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
      : '';

    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div><span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
        '<h2 class="dx-jobs__title">FIND JOBS</h2></div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      (this.liveMode
        ? '<div class="dx-livebanner"><i>&#9679;</i> LIVE EUROPEAN FEEDS &#183; '+list.length+' ACTIVE &#183; UPDATED '+updated+
          '</div>'
        : '<div class="dx-jobs__meta">'+jobs.length+' DEMO OPPORTUNITIES &#183; START SERVER FOR LIVE FEEDS</div>')+
      '<div class="dx-jobs__list">'+cards+'</div>'+
      '<footer class="dx-apps__note">QUALITY OVER QUANTITY &#183; ALWAYS APPLY AT THE ORIGINAL SOURCE</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click',()=>this.close());

    this.el.querySelectorAll('.dx-job__apply').forEach(btn=>{
      btn.addEventListener('click',(e)=>{
        e.stopPropagation();
        const id = btn.dataset.jobId;
        if (!this.stateStore.hasApplied(id)) this.stateStore.addApplication(id);
        window.open(btn.dataset.url || '#','_blank');
      });
    });
  }

  #card(j) {
    const applied = this.stateStore.hasApplied(j.id);
    const btnLabel = j.live
      ? (applied ? 'TRACKED ✓' : 'OPEN ORIGINAL ↗')
      : (applied ? 'APPLIED ✓' : 'APPLY');
    const why = (j.reasons&&j.reasons.length)
      ? '<div class="dx-match__reasons"><ul>'+j.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul></div>'
      : '';
    return (
    '<article class="dx-job">'+
      '<div class="dx-job__head-btn dx-job__head-btn--static">'+
        '<span class="dx-job__match">'+j.dynScore+'<small>%</small></span>'+
        '<span class="dx-job__idblock">'+
          '<span class="dx-job__title">'+esc(j.title)+'</span>'+
          '<span class="dx-job__company">'+esc(j.company)+
            (j.live?' <i class="dx-job__verified">&#9679; LIVE</i>':' <i class="dx-job__verified">&#10003; VERIFIED</i>')+'</span>'+
          '<span class="dx-job__facts">'+esc(j.location)+' &#183; '+esc(j.salary)+' &#183; '+esc(j.type)+'</span>'+
        '</span>'+
      '</div>'+
      (j.summary?'<p class="dx-job__summary" style="padding:0 14px;">'+esc(j.summary).slice(0,180)+'…</p>':'')+
      why+
      '<div class="dx-job__foot" style="padding:0 14px 12px;">'+
        '<span class="dx-job__posted">POSTED '+j.postedDaysAgo+'D AGO'+(j.source?' · '+esc(j.source.toUpperCase()):'')+'</span>'+
        '<button class="dx-job__apply'+(applied&&!j.live?' is-applied':'')+'" data-job-id="'+esc(j.id)+'" data-url="'+esc(j.link||'')+'">'+btnLabel+'</button>'+
      '</div>'+
    '</article>');
  }
}