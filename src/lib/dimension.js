// Dimensional math for feet-inch-fraction expressions.
// Every value is { v, d }: v is in inches^d, d is 0 (number), 1 (length), 2 (area) or 3 (volume).

const UNITS = {
  feet: 12, foot: 12, ft: 12, "'": 12, yd: 36,
  inches: 1, inch: 1, in: 1, '"': 1,
  mm: 1 / 25.4, cm: 1 / 2.54, m: 1 / 0.0254,
};
const UNIT_RE = /^\s*(feet|foot|ft|yd|inches|inch|in|mm|cm|m|'|")(?![a-z])/i;

export function dimName(d) {
  return ["a number", "a length", "an area", "a volume"][d] || "that";
}

export function evaluate(src) {
  const s = src
    .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
    .replace(/[’′]/g, "'").replace(/[”″]/g, '"');
  let pos = 0;
  const ws = () => { while (pos < s.length && /\s/.test(s[pos])) pos++; };
  const peek = () => { ws(); return s[pos]; };
  const fail = (m) => { throw new Error(m); };

  function number() {
    const rest = s.slice(pos);
    let m = rest.match(/^(\d+)(?:-| +)(\d+)\/(\d+)/); // 3-1/2  or  3 1/2
    if (m) {
      pos += m[0].length;
      if (+m[3] === 0) fail("Fraction with zero denominator");
      return +m[1] + m[2] / m[3];
    }
    m = rest.match(/^(\d+)\/(\d+)(?![\d.])/); // 3/4
    if (m) {
      pos += m[0].length;
      if (+m[2] === 0) fail("Fraction with zero denominator");
      return m[1] / m[2];
    }
    m = rest.match(/^(\d*\.\d+|\d+\.?)/); // 12, 12.5, .5
    if (m) { pos += m[0].length; return parseFloat(m[1]); }
    return null;
  }

  function quantity() {
    let total = 0, hasUnit = false, parts = 0;
    while (true) {
      ws();
      const start = pos, n = number();
      if (n === null) { pos = start; break; }
      const u = s.slice(pos).match(UNIT_RE);
      if (u) { pos += u[0].length; total += n * UNITS[u[1].toLowerCase()]; hasUnit = true; }
      else if (hasUnit) { total += n; } // 5' 6  → the 6 is inches
      else if (parts === 0) { total = n; parts++; break; }
      else fail("Missing unit");
      parts++;
      ws();
      if (!/\d|\./.test(s[pos] || "")) break; // keep going only for 5' 6" style runs
    }
    if (!parts) fail(pos >= s.length ? "Expression ends early" : `Unexpected "${s[pos]}"`);
    return { v: total, d: hasUnit ? 1 : 0 };
  }

  function factor() {
    const c = peek();
    if (c === "-") { pos++; const f = factor(); return { v: -f.v, d: f.d }; }
    if (c === "+") { pos++; return factor(); }
    if (c === "(") {
      pos++;
      const e = expr();
      if (peek() !== ")") fail("Missing )");
      pos++;
      return e;
    }
    return quantity();
  }

  function addable(a, b) {
    if (a.d === b.d) return [a, b];
    if (a.d === 0 && b.d === 1) return [{ v: a.v, d: 1 }, b]; // bare number + length → inches
    if (a.d === 1 && b.d === 0) return [a, { v: b.v, d: 1 }];
    fail(`Can't add ${dimName(a.d)} to ${dimName(b.d)}`);
  }

  function term() {
    let a = factor();
    while (true) {
      const c = peek();
      if (c === "*" || c === "x" || c === "X") { pos++; const b = factor(); a = { v: a.v * b.v, d: a.d + b.d }; }
      else if (c === "/") {
        pos++;
        const b = factor();
        if (b.v === 0) fail("Divide by zero");
        a = { v: a.v / b.v, d: a.d - b.d };
      } else break;
      if (a.d < 0 || a.d > 3) fail("Those units don't combine to a length, area, or volume");
    }
    return a;
  }

  function expr() {
    let a = term();
    while (true) {
      const c = peek();
      if (c === "+" || c === "-") {
        pos++;
        let b = term();
        [a, b] = addable(a, b);
        a = { v: c === "+" ? a.v + b.v : a.v - b.v, d: a.d };
      } else break;
    }
    return a;
  }

  if (!s.trim()) return { v: 0, d: 0 };
  const r = expr();
  ws();
  if (pos < s.length) fail(`Unexpected "${s[pos]}"`);
  return r;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** Format inches as 12' 6-1/2" rounded to 1/den. inchesOnly skips the feet part. */
export function fmtFtIn(inches, den = 16, inchesOnly = false) {
  const neg = inches < 0;
  const t = Math.round(Math.abs(inches) * den) / den;
  const ft = inchesOnly ? 0 : Math.floor(t / 12 + 1e-9);
  const rem = t - ft * 12;
  const whole = Math.floor(rem + 1e-9);
  let num = Math.round((rem - whole) * den), d = den;
  if (num) { const g = gcd(num, d); num /= g; d /= g; }
  const inStr = num ? (whole ? `${whole}-${num}/${d}"` : `${num}/${d}"`) : `${whole}"`;
  const out = ft ? `${ft}' ${inStr}` : inStr;
  return (neg && t ? "−" : "") + out;
}

/** Round to dp places and add thousands separators. */
export const nf = (x, dp = 3) =>
  (Math.round(x * 10 ** dp) / 10 ** dp).toLocaleString("en-US", { maximumFractionDigits: dp });

/** Parse a length field. A bare number counts as inches. */
export function asLength(str) {
  const r = evaluate(str);
  if (r.d === 0) return r.v;
  if (r.d !== 1) throw new Error("Enter a length");
  return r.v;
}

/** Parse a plain-number field. */
export function asNumber(str) {
  const r = evaluate(str);
  if (r.d !== 0) throw new Error("Enter a plain number");
  return r.v;
}

export const deg = (rad) => (rad * 180) / Math.PI;
