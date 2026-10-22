/** Labeled text input. Spread bind("name") from useFields into it. */
export function Field({ label, hint, ...input }) {
  return (
    <div className="field">
      <label htmlFor={input.id}>{label}</label>
      <input autoComplete="off" spellCheck={false} {...input} />
      {hint && <small>{hint}</small>}
    </div>
  );
}

/** Labeled <select>. */
export function SelectField({ label, id, value, onChange, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

/** Label/value result rows. rows: [{ label, value, big }]. */
export function Results({ rows = [], warn, error }) {
  if (error) return <div className="results"><div className="warn">{error}</div></div>;
  return (
    <div className="results">
      {rows.map((r) => (
        <div key={r.label} className={r.big ? "big" : undefined}>
          <span>{r.label}</span>
          <b>{r.value}</b>
        </div>
      ))}
      {warn && <div className="warn">{warn}</div>}
    </div>
  );
}

/** Run a calculation, turning thrown errors into { error }. */
export function attempt(fn) {
  try { return fn(); } catch (e) { return { error: e.message }; }
}
