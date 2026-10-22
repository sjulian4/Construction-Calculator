import { useEffect, useState } from "react";

/** useState that remembers its value in localStorage between visits. */
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved != null ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ }
  }, [key, value]);
  return [value, setValue];
}

/** A set of text inputs. bind("rise") returns { id, value, onChange } for an <input>. */
export function useFields(prefix, defaults) {
  const [values, setValues] = useState(defaults);
  const bind = (name) => ({
    id: `${prefix}-${name}`,
    value: values[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  return [values, bind];
}
