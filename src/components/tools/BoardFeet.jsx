import { useMemo } from "react";
import { asLength, asNumber, nf } from "../../lib/dimension.js";
import { useFields } from "../../hooks.js";
import { Field, Results, attempt } from "../ui.jsx";

export default function BoardFeet() {
  const [f, bind] = useFields("b", { th: `2"`, w: `10"`, l: `16'`, q: "24", p: "1.85" });

  const res = useMemo(() => attempt(() => {
    const t = asLength(f.th), w = asLength(f.w), l = asLength(f.l), q = asNumber(f.q);
    const price = f.p.trim() ? asNumber(f.p) : null;
    const bf = (t * w * (l / 12)) / 12, total = bf * q;
    const rows = [
      { label: "Board feet per piece", value: nf(bf, 2) },
      { label: "Total board feet", value: nf(total, 2), big: true },
      { label: "Lineal feet", value: nf((l / 12) * q, 1) },
    ];
    if (price !== null) rows.push({ label: "Estimated cost", value: "$" + nf(total * price, 2), big: true });
    return { rows };
  }), [f]);

  return (
    <div className="tool">
      <div className="fields">
        <Field label="Nominal thickness" {...bind("th")} />
        <Field label="Nominal width" {...bind("w")} />
        <Field label="Length" {...bind("l")} />
        <Field label="Quantity" {...bind("q")} />
        <Field label="Price per board foot ($, optional)" {...bind("p")} />
      </div>
      <Results {...res} />
    </div>
  );
}
