# AURA Studio

A responsive conceptual building explorer, built with vanilla JavaScript and Three.js. All geometry and analysis are local and deterministic. No external building-performance dataset is used.

## Run

```sh
npm install
npm run build
npm run dev
```

Open http://127.0.0.1:5173. Run `npm test` for geometry and analysis invariants.

## Implemented

- Compact, Courtyard and Porous massing from shared non-overlapping floor plates.
- Live site, program, dimensions, floors, glazing, shading, orientation, PV and material controls.
- Orbit, zoom, keyboard camera controls, top/front views, cutaway and shadows.
- Six deterministic sustainability estimates with explicit editable source assumptions.
- Two/three-variant comparison, parameter proposals with computed impacts, apply and undo.
- JSON export including design, estimates, variant results, assumptions and units.
- Responsive desktop and mobile interfaces; no browser storage or account setup.

## Advisor limitation

The included advisor is an **offline rule-based advisor**, explicitly labeled in the UI. It is not a connected language model. It uses current structured parameters and analysis to make recommendations, and it never generates analysis values. A live AI integration still requires a server-side model connection and credential setup. No API key is embedded in this client.

## Source

- `src/analysis.js`: assumptions, input normalization, occupied floor plates, exposed facade calculation, sustainability functions and advisor rules.
- `src/viewport.js`: Three.js renderer using the same floor plates and exposed facades.
- `src/app.js`: application UI and state transitions.
- `dist/style.css`: responsive visual system.
- `src/analysis.test.js`: meaningful geometry and analysis invariant tests.

## Estimate boundaries

The application uses an illustrative warm climate. Outputs are teaching proxies, not calibrated energy simulations, compliant daylight analysis, engineering designs, professional carbon assessments or contractor quotations. PV offsets annual demand and does not reduce gross demand. The target area is a goal; variants remove different areas at equal outer dimensions. Cost uses illustrative USD assumptions. See the in-app methodology for complete formulas and coefficients.

PV tiles, cores and columns are conceptual visual representations. The analysis uses the declared roof coverage and facade glazing ratio rather than counting rendered objects. Glazing ratios are attached to the design's original facade names; rotating the model changes their exposure relative to geographic north.
