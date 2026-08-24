import JOBS from '../data/jobs.json';

/**
 * MATCHING ENGINE v1 - dinamikus egyezes-szamitas a felhasznalo profiljabol.
 * Az alap-pontszam a koncepcios adat; a profil atfedesek modositjak.
 */

function scheduleCompatible(pref, type) {
  if (pref === 'Flexible') return true;
  if (pref === 'Part-time') return /part-time/i.test(type);
  return /full-time/i.test(type);
}

function mobilityBonus(mobility, location) {
  const loc = location.toLowerCase();
  if (mobility === 'Remote') return loc.includes('remote') ? 3 : 0;
  if (mobility === 'Hybrid') return (loc.includes('hybrid') || loc.includes('remote')) ? 2 : 0;
  return loc.includes('on-site') ? 2 : 0;
}

export function computeMatches(stateStore) {
  const profile = stateStore.getProfile();
  const skills = (profile.skills ?? []).map((s) => s.toLowerCase());

  return JOBS.jobs
    .map((job) => {
      let score = job.matchScore;
      const reasons = [];

      const transferable = job.why?.transferableSkills ?? [];
      const overlaps = transferable.filter((t) =>
        skills.some((s) => t.includes(s) || s.includes(t))
      );
      if (overlaps.length) {
        score += Math.min(overlaps.length * 2, 6);
        reasons.push(
          overlaps.length === 1
            ? '1 of your profile skills applies directly'
            : overlaps.length + ' of your profile skills apply directly'
        );
      }

      if (scheduleCompatible(profile.schedule, job.type)) {
        score += 2;
        reasons.push(job.type.toLowerCase() + ' matches your preferred schedule');
      }

      const mb = mobilityBonus(profile.mobility, job.location);
      if (mb > 0) {
        score += mb;
        reasons.push(profile.mobility + ' mobility fits this workplace');
      }

      if (job.openToPotential) {
        score += 1;
        reasons.push('employer is open to potential - no perfect CV needed');
      }

      if (!reasons.length) reasons.push('general baseline similarity');

      return {
        ...job,
        dynScore: Math.min(98, Math.round(score)),
        reasons,
      };
    })
    .sort((a, b) => b.dynScore - a.dynScore);
}