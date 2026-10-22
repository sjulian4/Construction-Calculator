import { useMemo, useState } from "react";
import { asLength, fmtFtIn, nf } from "../../lib/dimension.js";
import { ALL_SCALES, COMMON_RATIOS, SCALES, parseScale } from "../../lib/scales.js";
import { useFields, usePersistentState } from "../../hooks.js";
import { Field, Results, SelectField, attempt } from "../ui.jsx";

function ScaleOptions() {
  return (
    <>
      {SCALES.map(({ group, list }) => (
        <optgroup key={group} label={group}>
          {list.map(([name, ratio]) => <option key={name} value={ratio}>{name}</option>)}
        </optgroup>
      ))}
      <option value="custom">Custom…</option>
    </>
  );
}

const nameOf = (sel, custom) =>
  sel === "custom" ? custom.trim() : ALL_SCALES.find(([, r]) => String(r) === sel)?.[0];
const ratioOf = (sel, custom) => (sel === "custom" ? parseScale(custom) : +sel);
const drawStr = (inches, den) => `${fmtFtIn(inches, den, true)} · ${nf(inches * 25.4, 1)} mm`;

/** Describe a ratio (real in per drawing in) the three ways drawings label scales. */
function scaleLabels(ratio) {
  const perFoot = 12 / ratio; // drawing inches per real foot
  const exact = Math.abs(perFoot * 64 - Math.round(perFoot * 64)) < 0.02;
  return {
    arch: `${exact ? "" : "≈ "}${fmtFtIn(perFoot, 64, true)} = 1'-0"`,
    eng: `1" = ${nf(ratio / 12, 2)}'`,
    metric: `1:${nf(ratio, ratio < 10 ? 2 : 1)}`,
  };
}

/** Closest standard scale to a ratio, with how far off it is. */
function nearestStandard(ratio) {
  let best = null;
  for (const [name, r] of ALL_SCALES) {
    const off = Math.abs(Math.log(ratio / r));
    if (!best || off < best.off) best = { name, r, off };
  }
  return best;
}

const MODES = {
  draw: "A length I measured on the sheet",
  real: "A dimension written on the drawing",
  calibrate: "Find the scale from a written dimension",
};

const RESOLUTIONS = [2, 4, 8, 16, 32, 64];

export default function ScaleConverter({ den: calcDen }) {
  // "calc" follows the calculator's Round to setting; a number overrides it for this tab only.
  const [prec, setPrec] = usePersistentState("jsc:scale-prec", "calc");
  const den = prec === "calc" ? calcDen : +prec;
  const [mode, setMode] = useState("draw");
  const [from, setFrom] = useState("48");
  const [to, setTo] = useState("50");
  const [f, bind] = useFields("sc", {
    val: `2-3/8"`, fromC: `1/4" = 1'`, toC: "1:75",
    written: `12' 0"`, measured: `3"`, other: `1-5/8"`,
  });

  const res = useMemo(() => attempt(() => {
    const b = ratioOf(to, f.toC);
    const toName = nameOf(to, f.toC);
    let a, real, rows = [], warn = "", calib = null;

    if (mode === "calibrate") {
      const written = asLength(f.written), measured = asLength(f.measured);
      if (written <= 0 || measured <= 0) throw new Error("Enter the written dimension and what it measures on the sheet.");
      a = written / measured;
      const labels = scaleLabels(a), near = nearestStandard(a);
      const pct = (near.r / a) * 100; // how the sheet was printed relative to the standard scale
      const matches = Math.abs(pct - 100) < 1.5;
      calib = [
        { label: "This drawing's scale", value: labels.arch, big: true },
        { label: "Same scale as", value: `${labels.eng} · ${labels.metric}` },
        {
          label: matches ? "Matches standard scale" : "Closest standard scale",
          value: matches ? near.name : `${near.name} (printed at ${nf(pct, 1)}%)`,
          big: matches,
        },
      ];
      if (!matches) {
        warn = `This sheet doesn't match ${near.name}. It may be a reduced or enlarged copy, so measure with the scale found here, not the one in the title block.`;
      }
      if (f.other.trim()) {
        const other = asLength(f.other);
        real = other * a;
        rows = [
          { label: "Real-world size", value: fmtFtIn(real, den), big: true },
          { label: "Real (decimal / metric)", value: `${nf(real / 12, 3)} ft · ${nf(real * 0.0254, 3)} m` },
          { label: `On drawing at ${toName}`, value: drawStr(real / b, den) },
        ];
      }
    } else {
      const v = asLength(f.val);
      if (v <= 0) throw new Error("Enter a length greater than zero.");
      a = ratioOf(from, f.fromC);
      real = mode === "draw" ? v * a : v;
      const pct = (a / b) * 100;
      if (pct > 400 || pct < 25) warn = "That's beyond most copiers' 25–400% range; redraw or plot at the new scale instead.";
      rows = [
        { label: "Real-world size", value: fmtFtIn(real, den), big: true },
        { label: "Real (decimal / metric)", value: `${nf(real / 12, 3)} ft · ${nf(real * 0.0254, 3)} m` },
        { label: `On drawing at ${nameOf(from, f.fromC)}`, value: drawStr(real / a, den), big: mode === "real" },
        { label: `On drawing at ${toName}`, value: drawStr(real / b, den), big: true },
        { label: "Enlarge / reduce sheet by", value: nf(pct, 1) + "%" },
      ];
    }

    const table = real != null
      ? ALL_SCALES.filter(([, r]) => COMMON_RATIOS.includes(r)).map(([name, r]) => ({ label: name, value: drawStr(real / r, den) }))
      : null;
    return { calib, rows, warn, table };
  }), [f, from, to, mode, den]);

  return (
    <div className="tool">
      <div className="fields">
        <SelectField label="I have" id="sc-mode" value={mode} onChange={setMode}>
          {Object.entries(MODES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </SelectField>

        {mode === "calibrate" ? (
          <>
            <Field
              label="Dimension written on the drawing"
              hint={`The real size printed on a dimension line, e.g. 12' 0".`}
              {...bind("written")}
            />
            <Field
              label="That line measures on the sheet"
              hint="What your ruler reads end to end. Metric works too, e.g. 73mm."
              {...bind("measured")}
            />
            <Field
              label="Measure something else (optional)"
              hint="Any other length off the same sheet. It's converted with the scale found above."
              {...bind("other")}
            />
          </>
        ) : (
          <>
            <Field
              label={mode === "draw" ? "Length on the sheet" : "Written dimension (real size)"}
              hint={mode === "draw"
                ? "What your ruler reads on the sheet. Metric works too, e.g. 60mm."
                : `The size as written on the drawing, e.g. 14' 6". You'll get how long it should be drawn.`}
              {...bind("val")}
            />
            <SelectField label="Drawing scale" id="sc-from" value={from} onChange={setFrom}><ScaleOptions /></SelectField>
            {from === "custom" && (
              <Field label="Custom scale" hint={`Write it as 3/16" = 1', 1" = 30' or 1:75.`} {...bind("fromC")} />
            )}
          </>
        )}

        <SelectField label="Convert to scale" id="sc-to" value={to} onChange={setTo}><ScaleOptions /></SelectField>
        {to === "custom" && <Field label="Custom scale" {...bind("toC")} />}

        <SelectField label="Round to" id="sc-prec" value={String(prec)} onChange={setPrec}>
          <option value="calc">Same as calculator (1/{calcDen}")</option>
          {RESOLUTIONS.map((d) => <option key={d} value={String(d)}>1/{d}"</option>)}
        </SelectField>
        <small className="hint">Match the finest marks on your ruler or scale.</small>
      </div>

      <div>
        {res.error ? (
          <Results error={res.error} />
        ) : (
          <>
            {res.calib && <Results rows={res.calib} />}
            {res.calib && res.rows.length > 0 && <h2 className="spaced">Your other measurement</h2>}
            <Results rows={res.rows} warn={res.warn} />
            {res.table && (
              <>
                <h2 className="spaced">Same length at other scales</h2>
                <Results rows={res.table} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}