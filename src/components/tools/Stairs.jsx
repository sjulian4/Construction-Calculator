import { useMemo } from "react";
import { asLength, deg, fmtFtIn, nf } from "../../lib/dimension.js";
import { useFields } from "../../hooks.js";
import { Field, Results, attempt } from "../ui.jsx";

export default function Stairs({ den }) {
  const [f, bind] = useFields("s", { rise: `9' 0"`, maxR: `7-3/4"`, tread: `10"` });

  const res = useMemo(() => attempt(() => {
    const rise = asLength(f.rise), maxR = asLength(f.maxR), tread = asLength(f.tread);
    if (rise <= 0 || maxR <= 0 || tread <= 0) throw new Error("All values must be greater than zero.");
    const n = Math.ceil(rise / maxR - 1e-9);
    const r = rise / n, treads = n - 1, run = treads * tread;
    const stringer = Math.hypot(rise, run + tread);
    const rule = 2 * r + tread;
    let warn = "";
    if (r > 7.75) warn = `Riser exceeds the IRC 7-3/4" maximum.`;
    else if (tread < 10) warn = `Tread is below the IRC 10" minimum.`;
    else if (rule < 24 || rule > 25.5) warn = `2R + T = ${nf(rule, 2)}". Most builders aim for 24"–25".`;

    // Sketch: a stepped profile scaled to fit the viewBox.
    const sc = Math.min(280 / (run || 1), 130 / rise), x0 = 10, y0 = 160;
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    const steps = Math.min(n, 40);
    for (let i = 0; i < steps; i++) {
      y -= r * sc; pts.push([x, y]);
      if (i < steps - 1) { x += tread * sc; pts.push([x, y]); }
    }

    return {
      warn,
      rows: [
        { label: "Risers", value: n, big: true },
        { label: "Riser height", value: fmtFtIn(r, den), big: true },
        { label: "Treads", value: treads },
        { label: "Total run", value: fmtFtIn(run, den) },
        { label: "Stringer length (approx.)", value: fmtFtIn(stringer, den) },
        { label: "Stair angle", value: nf(deg(Math.atan(r / tread)), 1) + "°" },
        { label: "2R + T", value: nf(rule, 2) + '"' },
      ],
      sketch: { pts, x0, y0, x, y, run, rise },
    };
  }), [f, den]);

  const s = res.sketch;
  return (
    <div className="tool">
      <div className="fields">
        <Field label="Total rise (floor to floor)" {...bind("rise")} />
        <Field label="Max riser height" hint={`IRC residential max is 7-3/4".`} {...bind("maxR")} />
        <Field label="Tread depth (run per step)" hint={`IRC residential min is 10".`} {...bind("tread")} />
      </div>
      <div>
        <Results {...res} />
        {s && (
          <svg className="sketch" viewBox="0 0 320 170" role="img" aria-label="Stair stringer sketch">
            <polyline points={s.pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")} />
            <line className="dim" x1={s.x0} y1={s.y0} x2={s.x} y2={s.y0} />
            <text x={(s.x0 + s.x) / 2 - 20} y={s.y0 - 4}>{fmtFtIn(s.run, den)}</text>
            <text x={s.x + 6} y={(s.y0 + s.y) / 2}>{fmtFtIn(s.rise, den)}</text>
          </svg>
        )}
      </div>
    </div>
  );
}
