# Construction Calculator

A construction calculator built with React and Vite. It does feet-inch-fraction math with automatic conversions, and has stair, rafter, concrete, board-foot and drawing-scale tools.

## Run it

```bash
npm install
npm start        # opens http://localhost:3000 and reloads on save
```

Other scripts:

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Same dev server as `npm start`, without opening a browser |
| `npm test`        | Runs the unit tests for the math in `src/lib`     |
| `npm run build`   | Builds a production bundle into `dist/`           |
| `npm run preview` | Serves the `dist/` build locally to check it      |

## Layout

```
src/
  main.jsx                 entry point, mounts <App />
  App.jsx                  page layout and tool tabs
  hooks.js                 usePersistentState (localStorage) and useFields
  styles.css
  lib/
    dimension.js           expression parser and ft-in-fraction formatting
    scales.js              drawing scales and custom-scale parser
    dimension.test.js      Vitest tests
  components/
    Calculator.jsx         keypad, readout, conversions and tape
    ui.jsx                 Field, SelectField, Results
    tools/                 Stairs, Rafters, Concrete, BoardFeet, ScaleConverter
```

The math in `src/lib` has no React dependency, so it can be reused or tested on its own.
