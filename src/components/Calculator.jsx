import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { evaluate, fmtFtIn, nf } from "../lib/dimension.js";
import { usePersistentState } from "../hooks.js";

// [text inserted, label shown, style class, aria-label]
const KEYS = [
  ["C", "C", "op", "Clear"], ["BS", "⌫", "op", "Backspace"], ["(", "(", "op"], [")", ")", "op"], [" ÷ ", "÷", "op", "Divide"],
  ["7"], ["8"], ["9"], ["' ", "ft", "unitk", "Feet"], [" × ", "×", "op", "Multiply"],
  ["4"], ["5"], ["6"], ['" ', "in", "unitk", "Inches"], [" − ", "−", "op", "Subtract"],
  ["1"], ["2"], ["3"], ["/", "⁄", "unitk", "Fraction bar"], [" + ", "+", "op", "Add"],
  ["0"], ["."], ["-", "-", "unitk", "Fraction dash"], ["=", "=", "eq", "Equals"],
];

const EXAMPLE_TAPE = [
  { ex: `16' × 9' 6"`, res: "152 sq ft", reuse: `16' × 9' 6"` },
  { ex: `96" ÷ 7`, res: `1' 1-11/16"`, reuse: `1' 1-23/32"` },
];

/** Main readout plus conversion rows for a result. */
function describe(r, den, mode) {
  if (r.d === 0) return { main: nf(r.v, 6), rows: [] };
  if (r.d === 1) {
    const i = r.v;
    const main =
      mode === "in" ? fmtFtIn(i, den, true)
      : mode === "ft" ? `${nf(i / 12, 4)} ft`
      : mode === "m" ? `${nf(i * 0.0254, 4)} m`
      : fmtFtIn(i, den);
    return {
      main,
      rows: [
        ["ft-in", fmtFtIn(i, den)], ["inches", nf(i, 4) + '"'], ["dec. ft", nf(i / 12, 4)],
        ["mm", nf(i * 25.4, 1)], ["meters", nf(i * 0.0254, 4)], ["yards", nf(i / 36, 4)],
      ],
    };
  }
  if (r.d === 2) {
    const sf = r.v / 144;
    return {
      main: mode === "m" ? `${nf(sf * 0.09290304, 3)} m²` : `${nf(sf, 2)} sq ft`,
      rows: [
        ["sq ft", nf(sf, 2)], ["sq in", nf(r.v, 1)], ["sq yd", nf(sf / 9, 3)],
        ["m²", nf(sf * 0.09290304, 3)], ["squares", nf(sf / 100, 3)], ["4×8 sheets", nf(sf / 32, 2)],
      ],
    };
  }
  const cf = r.v / 1728;
  return {
    main: mode === "m" ? `${nf(cf * 0.0283168, 3)} m³` : `${nf(cf, 2)} cu ft`,
    rows: [
      ["cu ft", nf(cf, 2)], ["cu yd", nf(cf / 27, 3)], ["cu in", nf(r.v, 0)],
      ["m³", nf(cf * 0.0283168, 3)], ["liters", nf(cf * 28.3168, 1)], ["US gal", nf(cf * 7.48052, 1)],
    ],
  };
}

export default function Calculator({ den, setDen, mode, setMode }) {
  const [expr, setExpr] = usePersistentState("jsc:expr", `12' 6-1/2" + 3' 9-3/4"`);
  const [tape, setTape] = useState(EXAMPLE_TAPE);
  const inputRef = useRef(null);
  const pendingCursor = useRef(null);
  const lastGood = useRef({ v: 0, d: 0 });

  const parsed = useMemo(() => {
    try { return { r: evaluate(expr) }; } catch (e) { return { error: e.message }; }
  }, [expr]);
  if (parsed.r) lastGood.current = parsed.r;
  const shown = describe(lastGood.current, den, mode);

  // Put the caret back where it belongs after a keypad edit.
  useLayoutEffect(() => {
    if (pendingCursor.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  }, [expr]);

  function commit() {
    if (!parsed.r || !expr.trim()) return;
    const r = parsed.r;
    const res = r.d === 1 ? fmtFtIn(r.v, den) : r.d === 0 ? String(+r.v.toFixed(6)) : shown.main;
    const reuse = r.d === 1 ? fmtFtIn(r.v, 64) : r.d === 0 ? String(+r.v.toFixed(6)) : expr;
    setTape((t) => [{ ex: expr, res, reuse }, ...t].slice(0, 30));
    if (r.d <= 1) { setExpr(reuse); pendingCursor.current = reuse.length; }
  }

  function press(k) {
    const el = inputRef.current;
    const a = el?.selectionStart ?? expr.length, b = el?.selectionEnd ?? a;
    if (k === "=") return commit();
    if (k === "C") { setExpr(""); pendingCursor.current = 0; return; }
    if (k === "BS") {
      if (a !== b) { setExpr(expr.slice(0, a) + expr.slice(b)); pendingCursor.current = a; }
      else {
        const head = expr.slice(0, a).replace(/\s*.\s*$/, "");
        setExpr(head + expr.slice(a));
        pendingCursor.current = head.length;
      }
      return;
    }
    setExpr(expr.slice(0, a) + k + expr.slice(b));
    pendingCursor.current = a + k.length;
  }

  return (
    <section className="unit" aria-label="Dimensional calculator">
      <div className="lcd">
        <input
          ref={inputRef}
          id="expr"
          type="text"
          autoComplete="off"
          spellCheck={false}
          aria-label="Expression"
          placeholder={`e.g. 12' 6-1/2" + 3' 9-3/4"`}
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") setExpr("");
          }}
        />
        <div className="main" aria-live="polite">{shown.main}</div>
        <div className="err">{parsed.error ?? ""}</div>
        <div className="conv">
          {shown.rows.map(([k, v]) => (
            <div key={k}><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="small" htmlFor="prec">
          Round to
          <select id="prec" value={den} onChange={(e) => setDen(+e.target.value)}>
            {[2, 4, 8, 16, 32, 64].map((d) => <option key={d} value={d}>1/{d}"</option>)}
          </select>
        </label>
        <label className="small" htmlFor="mode">
          Show
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="ftin">Feet-inches</option>
            <option value="in">Inches</option>
            <option value="ft">Decimal feet</option>
            <option value="m">Metric</option>
          </select>
        </label>
      </div>

      <div className="keys">
        {KEYS.map(([k, label = k, cls, aria]) => (
          <button key={k + label} type="button" className={cls} aria-label={aria} onClick={() => press(k)}>
            {label}
          </button>
        ))}
      </div>

      <p className="hint">
        Type or tap: <code>5' 3-1/2"</code>, <code>63.5in</code>, <code>1.6m</code>. Lengths × lengths give area,
        × again gives volume. A bare number added to a length counts as inches. Use <code>-</code> with no spaces
        for fractions and <code> − </code> with spaces to subtract.
      </p>

      <div>
        <h2>Tape</h2>
        <div className="tape">
          {tape.length === 0 && <p className="hint">Results you calculate with = are listed here. Tap one to reuse it.</p>}
          {tape.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setExpr(t.reuse); inputRef.current?.focus(); }}
            >
              <span className="ex">{t.ex}</span>
              <b>{t.res}</b>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
