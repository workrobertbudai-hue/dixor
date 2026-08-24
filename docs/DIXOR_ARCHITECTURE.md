# DIXOR - Technical Architecture

Status: mirrors the running concept build (v0.1)

## Stack
- Vite 6 (dev server + bundling)
- Vanilla ES modules (no UI framework)
- three.js for WebGL rendering
- localStorage for persistence (no backend yet)

## Layer map

    src/
      core/        app bootstrap: scene, camera, renderer, lights, environment, main loop
      world/       core-world (hub object), module-world (destination worlds),
                   world-transition (camera flights + veil)
      nodes/       node-data (loads modules.json), node-factory (geometry identities),
                   node-manager (ring layout + animation), function-node (function rings)
      interaction/ mouse -> raycaster -> hover -> click chain
      navigation/  navigation-manager (state machine), breadcrumbs, back-to-core
      ui/          welcome, search, node label, status bar, action panel,
                   job browser, applications, radar, profile, skills discovery,
                   active/open matches, wellbeing
      visual/      glow sprites, connection web, easing helpers
      work/        matching engine v1
      state/       app-state (localStorage, schema dixor.state.v1)
      data/        modules.json, jobs.json, navigation.json, theme.json

## Bootstrap flow

main.js -> new App(#app).init():
scene/camera/renderer -> lights -> environment (stars + dust parallax)
-> coreWorld -> transition -> nodes -> connection web
-> UI layers -> welcome screen -> search -> interaction chain
-> renderer.setAnimationLoop(tick)

## Update loop

Any system may register fn(deltaTime, elapsed) via app.registerUpdate().
deltaTime is clamped to 50 ms. The active module world animates because the
loop calls navigation.current.update(dt, t) while state === "module".

## Interaction chain

Mouse (NDC coords) -> RaycasterService.pick(camera, targets, ndc)
-> HoverController (tooltip, cursor, node.isHovered)
-> ClickController (press+release on same node, drag threshold 6 px).

Raycast targets depend on nav state: core ring nodes in CORE, function-ring
nodes inside a MODULE. During travel/welcome nothing is pickable.

## Navigation state machine

core --enterModule(node)--> traveling --> module --returnToCore()--> traveling --> core

- enterModule: fly toward the node (stop 3.4 units away) -> veil fades in ->
  hide core groups -> show/build ModuleWorld -> arrive pose -> breadcrumb +
  status bar updated -> veil out. Visit counter persisted.
- Search can jump module -> module: target queued as pending, resolved after
  the intermediate return-to-core completes.
- Every transition calls #closePanels(): action panel + all registered panels.

## Node system

Each module declares a geometry identity key in modules.json; BUILDERS maps
key -> builder. A builder returns { group, reactive materials, spin,
customUpdate }. An invisible hitbox sphere carries userData.nodeRef.

Hover effect: smooth scale (lerp dt*9), emissiveIntensity =
baseEI * (1 + growth*2.5 + pulse*1.5), breathing glow sprite behind.

Function nodes are generated per module from modules.json.functions;
id format: "moduleId:function-slug" (e.g. work:find-jobs). The app routes
these ids to feature panels - this is the WORLD > AREA > FUNCTION > ACTION
model made concrete.

## Panel conventions

Fixed-position aside, is-open class toggling, re-render on open, ESC closes
(capture-phase listener so it wins over BackToCore), auto-closed on any
navigation change.

## Persistence - AppState (dixor.state.v1)

visits{}, lastModule, enteredOnce,
applications [{id, at}],
radarActive, radarSinceMs,
profile { headline, skills[], languages[], location, mobility, schedule }

All views read live from AppState on open; changes persist immediately.

## Matching engine v1 (work/matching.js)

score = baseline matchScore from jobs.json
+ 2 per transferable-skill overlap with profile skills (cap +6)
+ 2 if schedule preference matches job type
+ mobility fit (hybrid +2 / remote +3 / on-site +2)
+ 1 if employer openToPotential; result capped at 98.
Every point yields a human-readable reason string shown in the UI.

## Known limitations / next

- No URL routing, no backend, heuristic local matching, mock dataset.
- tests/ folders still empty; no CI yet.