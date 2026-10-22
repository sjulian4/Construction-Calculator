import { useMemo } from "react";
import { asLength, asNumber, deg, fmtFtIn, nf } from "../../lib/dimension.js";
import { useFields } from "../../hooks.js";
import { Field, Results, attempt } from "../ui.jsx";

export default function Rafters({ den }) {
  const [f, bind] = useFields("r", { span: `24'`, pitch: "6", over: `1' 6"`, ridge: `1-1/2"` });

  const res = useMemo(() => attempt(() => {
    const span = asLength(f.span), p = asNumber(f.pitch), over = asLength(f.over), ridge = asLength(f.ridge);
    if (span <= 0 || p <= 0) throw new Error("Span and pitch must be greater than zero.");
    const run = span / 2 - ridge / 2;
    const k = Math.sqrt(1 + (p / 12) ** 2); // rafter length per inch of run
    const rise = ((span / 2) * p) / 12, len = run * k, tail = over * k;
    const ang = deg(Math.atan(p / 12));

    const sc = Math.min(300 / (span + 2 * over), 110 / (rise || 1));
    return {
      rows: [
        { label: "Rafter length (ridge to plate)", value: fmtFtIn(len, den), big: true },
        { label: "Tail (overhang)", value: fmtFtIn(tail, den) },
        { label: "Total rafter length", value: fmtFtIn(len + tail, den), big: true },
        { label: "Roof rise", value: fmtFtIn(rise, den) },
        { label: "Roof angle", value: nf(ang, 2) + "°" },
        { label: "Plumb cut", value: nf(ang, 2) + "° from square" },
        { label: "Seat cut", value: nf(90 - ang, 2) + "° from square" },
        { label: "Length per foot of run", value: nf(12 * k, 3) + '"' },
        { label: "Min. board (next std. length)", value: Math.ceil((len + tail) / 24) * 2 + "'" },
      ],
      sketch: { cx: 160, base: 135, half: (span / 2) * sc, h: rise * sc, o: over * sc, oh: ((over * p) / 12) * sc, p, span },
    };
  }), [f, den]);

  const s = res.sketch;
  return (
    <div className="tool">
      <div className="fields">
        <Field label="Building span (wall to wall)" {...bind("span")} />
        <Field label={`Pitch (rise per 12" run)`} {...bind("pitch")} />
        <Field label="Overhang (horizontal)" {...bind("over")} />
        <Field label="Ridge board thickness" hint="Half of this is deducted from each rafter's run." {...bind("ridge")} />
      </div>
      <div>
        <Results {...res} />
        {s && (
          <svg className="sketch" viewBox="0 0 320 150" role="img" aria-label="Rafter sketch">
            <polyline points={`${s.cx - s.half - s.o},${s.base + s.oh} ${s.cx},${s.base - s.h} ${s.cx + s.half + s.o},${s.base + s.oh}`} />
            <line className="dim" x1={s.cx - s.half} y1={s.base} x2={s.cx + s.half} y2={s.base} />
            <line className="dim" x1={s.cx} y1={s.base} x2={s.cx} y2={s.base - s.h} />
            <text x={s.cx + 4} y={s.base - s.h / 2}>{s.p}/12</text>
            <text x={s.cx - s.half} y={s.base - 4}>{fmtFtIn(s.span, den)}</text>
          </svg>
        )}
      </div>
    </div>
  );
}
