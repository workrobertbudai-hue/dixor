# DIXOR - UI Concept

Direction: futuristic, but believable. Calm, geometric, minimal chrome.
Interface first - intelligence stays in the background.

## Palette tokens (src/styles/main.css)

--dx-bg       #04070c   deep space background
--dx-accent   #57e6d9   teal, primary signal color
--dx-accent-2 #7aa2ff   soft blue, secondary
--dx-text     #e8f1f2   primary text
--dx-text-dim rgba(232,241,242,.45)

Every module carries its own accent (modules.json.accent) used for its node,
world light, grid, tooltip border and panel chips.

## Typography

Space Grotesk only. Uppercase micro-labels with wide tracking
(0.18em - 0.5em). Large display titles use thin weight + extreme tracking.

## Chrome

Top bar: DIXOR brand (teal) + current trail hint.
Bottom bar: SYSTEM ONLINE + build version.
Vignette overlay adds cinematic depth over the canvas.

## Geometric identities (concept Section 4)

WORK        gyro-frame       nested rotating frames - precision under load
LEARN       layered          stacked discs - accumulation of knowledge
DISCOVER    branching        radial branches - exploration paths
LIFE        orbit-ring       planet on orbit - everyday cycles
WELLBEING   concentric-soft  translucent shells - calm depth
CREATE      assembling       tetra pieces converging - ideas taking form
EXPLORE     scatter-field    particle cloud inside cage - open space
ANALYZE     faceted-crystal  stretched octahedron - clarity through facets
PERSONAL    core-sphere      polished sphere - the self at the center

## Motion patterns

Camera flights: cubic in-out ~1.15 s. Veil crossfade: 450 ms.
Hover: scale lerp + emissive boost + halo breath (sine).
Function rings counter-rotate slowly; grids rotate at whisper speed.

## Z-index stack

canvas < vignette < node label(20) < chrome/crumbs/back/search-btn/status(30)
< action panel(35) < side panels(36) < transition veil(40)
< search modal(45) < wellbeing calm(55) < welcome(60)

## Quiet mode

body.dx-quiet dims the canvas to 16% opacity and hides chrome/crumbs/status -
the environment recedes; restored by toggling again (state persists).