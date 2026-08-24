# DIXOR - Roadmap

## Shipped - concept build v0.1

01  Core scene, render loop, environment parallax
02  Node ring, geometry identities, hover + click feedback
03  World transitions, breadcrumbs, BACK TO CORE + ESC
04  Welcome screen with entry camera flight; RETURN TO DIXOR for repeat visits
05  Universal search (press /) with keyboard navigation, module-to-module jumps
06  Function level: per-module function nodes + Action Panel placeholders
07  Connection web with pulse-on-hover; persistent AppState
08  WORK / Find Jobs: match %, WHY THIS JOB?, badges, Trust Layer note,
    Apply persisted across reloads
09  WORK / My Applications: pipeline view from stored applications
10  WORK / Job Radar: persistent activation, threshold signals, scan animation
11  WORK / My Profile: living profile (headline, skills, languages, prefs)
12  WORK / Discover My Skills: questionnaire -> transferable skills -> profile
13  WORK / Active Matches + Open To Me: live matching engine with explained scores
14  WELLBEING: 60-second reset, 4-7-8 breathing, Quiet Mode
15  Documentation set (architecture, UI concept, roadmap, readme)

## Next candidates (pick order flexible)

A   LEARN module: session picker (Language > Spanish > 10 minutes style),
    practice skeleton, progress storage
B   DISCOVER entity environment: search term -> Overview/Timeline/People/
    Technology entry points (Section 8)
C   PERSONAL hub: aggregated visits, applications, skills, saved items
D   URL routing + shareable deep links (e.g. #/work/find-jobs)
E   Ambient audio layer + subtle UI ticks + calm-session tones
F   Tests: matching engine + AppState units; Playwright smoke pass
G   Backend + Intelligence Layer (Section 34): real listings, verification
    signals, embedding-based matching, orchestrated AI behind the interface
H   Far horizon: Temporal / Causal / Simulation engines (Sections 10-12)

## Definition of done for any module

- reachable purely by navigation (no prompt required)
- ESC / back / close behave consistently; panels never trap the user
- meaningful state persisted; nothing important hidden from the user
- chat appears only where conversation genuinely helps