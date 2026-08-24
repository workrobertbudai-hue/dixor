#!/usr/bin/env node
/**
 * DIXOR scaffold — legenerálja a projektváz hiányzó részeit.
 * Meglévő fájlokat NEM ír felül, csak a hiányzókat hozza létre.
 *
 * Futtatás:  node scripts/scaffold.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

/* ------------------------------------------------------------------ */
/* Adat-alapok — a 2. lépés (node rendszer) ezekből fog dolgozni       */
/* ------------------------------------------------------------------ */

const MODULES = {
  version: '0.1.0',
  source: 'DIXOR_MASTER_CONCEPT §4–§31',
  core: { id: 'core', label: 'DIXOR', position: [0, 0, 0] },
  modules: [
    {
      id: 'work', label: 'WORK',
      tagline: 'Human-potential matching',
      geometry: 'structured-prism',      // §4: stabil, strukturált geometria
      accent: '#57e6d9',
      status: 'planned',
      functions: ['Find Jobs', 'Active Matches', 'Job Radar', 'Open To Me',
                  'My Applications', 'My Profile', 'Discover My Skills']
    },
    {
      id: 'learn', label: 'LEARN',
      tagline: 'Languages · Skills · Practice',
      geometry: 'layered',               // §4: rétegzett struktúrák
      accent: '#9d8cff',
      status: 'planned',
      functions: ['Languages', 'Skills', 'Courses', 'Practice', 'Progress']
    },
    {
      id: 'discover', label: 'DISCOVER',
      tagline: 'Search · Knowledge · Exploration',
      geometry: 'branching',             // §4: elágazó struktúrák
      accent: '#7aa2ff',
      status: 'planned',
      functions: ['Search', 'Topics', 'Explore', 'Research', 'Timeline',
                  'Why?', 'What If?']
    },
    {
      id: 'life', label: 'LIFE',
      tagline: 'Everyday planning & organization',
      geometry: 'orbit-ring',
      accent: '#ffd479',
      status: 'planned',
      functions: ['Planning', 'Travel', 'Organization']
    },
    {
      id: 'wellbeing', label: 'WELLBEING',
      tagline: 'Focus · Calm · Reset',
      geometry: 'concentric-soft',       // §4: lágy koncentrikus geometria
      accent: '#7fe3b2',
      status: 'planned',
      functions: ['60-second Reset', 'Breathing', 'Quiet Mode',
                  'Focus Session', 'Break Reminder']
    },
    {
      id: 'create', label: 'CREATE',
      tagline: 'Documents · Writing · Images',
      geometry: 'assembling',            // §4: összeszerelő elemek
      accent: '#ff9e9e',
      status: 'planned',
      functions: ['Documents', 'Writing', 'Presentations', 'Images']
    },
    {
      id: 'explore', label: 'EXPLORE',
      tagline: 'Open-ended discovery',
      geometry: 'scatter-field',
      accent: '#6fc9ff',
      status: 'planned',
      functions: ['Subjects', 'Concepts', 'Areas of Interest']
    },
    {
      id: 'analyze', label: 'ANALYZE',
      tagline: 'Compare · Understand · Decide',
      geometry: 'faceted-crystal',
      accent: '#c9d1e0',
      status: 'planned',
      functions: ['Compare', 'Research', 'Decision Support', 'What-if']
    },
    {
      id: 'personal', label: 'PERSONAL',
      tagline: 'Profile · Progress · Control',
      geometry: 'core-sphere',
      accent: '#f5f1e8',
      status: 'planned',
      functions: ['Profile', 'History', 'Saved', 'Progress', 'Preferences']
    }
  ]
};

const NAVIGATION = {
  version: '0.1.0',
  trailModel: ['WORLD', 'AREA', 'FUNCTION', 'ACTION'],   // §5
  root: { id: 'core', label: 'DIXOR' },
  transition: { durationSec: 1.4, easing: 'cubic-out' }
};

const THEME = {
  version: '0.1.0',
  colors: {
    bg: '#04070c', accent: '#57e6d9', accentAlt: '#7aa2ff',
    text: '#e8f1f2', textDim: 'rgba(232,241,242,0.45)'
  },
  typography: { family: "'Space Grotesk', sans-serif",
                tracking: '0.22em', uiSize: '11px' },
  motion: { fadeMs: 1600, transitionMs: 1400 }
};

/* ------------------------------------------------------------------ */
/* Fájl-lista                                                          */
/* ------------------------------------------------------------------ */

const mdPlaceholder = (title, ref) =>
  `# ${title}\n\n> ${ref}\n>\n> _Ez a szakasz a koncepció dokumentumból töltendő fel._\n`;

const ENTRIES = [
  // Eszköz-mappák (.gitkeep: a git üres mappát nem követi nyomon)
  ['public/assets/fonts/.gitkeep',    ''],
  ['public/assets/textures/.gitkeep', ''],
  ['public/assets/models/.gitkeep',   ''],
  ['public/assets/audio/.gitkeep',    ''],

  // Adatréteg
  ['src/data/modules.json',    JSON.stringify(MODULES, null, 2) + '\n'],
  ['src/data/navigation.json', JSON.stringify(NAVIGATION, null, 2) + '\n'],
  ['src/data/theme.json',      JSON.stringify(THEME, null, 2) + '\n'],

  // Dokumentáció
  ['docs/DIXOR_MASTER_CONCEPT.md', mdPlaceholder('DIXOR Master Concept',
      'A teljes konceptdokumentum (§1–§36) ide kerül.')],
  ['docs/DIXOR_ARCHITECTURE.md',   mdPlaceholder('DIXOR Architecture',
      'Technikai architektúra: modulok, függőségek, adatfolyam.')],
  ['docs/DIXOR_UI_CONCEPT.md',     mdPlaceholder('DIXOR UI Concept',
      'Vizuális nyelv, színek, tipográfia, geometriai identitások.')],
  ['docs/DIXOR_ROADMAP.md',        mdPlaceholder('DIXOR Roadmap',
      'Építési mérföldkövek: core → nodes → interaction → navigation → UI.')],

  // Teszt-váz
  ['tests/navigation/.gitkeep', ''],
  ['tests/state/.gitkeep',      ''],
  ['tests/world/.gitkeep',      ''],

  // README (ha még nincs)
  ['README.md',
`# DIXOR

**Intelligent Interface & Human Potential Platform**

> Intelligence without unnecessary complexity.

Egy térbeli, navigálható digitális környezet — nem chatbot.
Lásd: \`docs/DIXOR_MASTER_CONCEPT.md\`

## Fejlesztés

\`\`\`bash
npm install
npm run dev        # fejlesztői szerver
node scripts/scaffold.mjs   # vázszerkezet generálása (nem ír felül semmit)
\`\`\`
`]
];

/* ------------------------------------------------------------------ */
/* Végrehajtás                                                         */
/* ------------------------------------------------------------------ */

let created = 0, skipped = 0;

for (const [relPath, content] of ENTRIES) {
  const target = join(ROOT, relPath);
  if (existsSync(target)) {
    console.log(`  · már létezik:  ${relPath}`);
    skipped++;
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
  console.log(`  + létrehozva:   ${relPath}`);
  created++;
}

console.log(`\nKész: ${created} létrehozva, ${skipped} megőrizve.`);
console.log('A meglévő fájlok érintetlenek maradtak.\n');