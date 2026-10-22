import { useMemo } from "react";
import { asLength, asNumber, nf } from "../../lib/dimension.js";
import { useFields } from "../../hooks.js";
import { Field, Results, attempt } from "../ui.jsx";

export default function Concrete() {
  const [f, bind] = useFields("c", { len: `20'`, wid: `12'`, th: `4"`, waste: "10" });

  const res = useMemo(() => attempt(() => {
    const L = asLength(f.len), W = asLength(f.wid), T = asLength(f.th), w = asNumber(f.waste);
    if (L <= 0 || W <= 0 || T <= 0) throw new Error("Dimensions must be greater than zero.");
    const cf = (L * W * T) / 1728;
    const tot = cf * (1 + w / 100), cy = tot / 27;
    return {
      warn: cy < 1 ? "Under a yard: bags are usually cheaper than a truck minimum." : "",
      rows: [
        { label: "Slab area", value: nf((L * W) / 144, 1) + " sq ft" },
        { label: "Net volume", value: nf(cf / 27, 2) + " cu yd" },
        { label: "With waste", value: nf(cy, 2) + " cu yd", big: true },
        { label: "Order (round up to ¼ yd)", value: nf(Math.ceil(cy * 4) / 4, 2) + " cu yd", big: true },
        { label: "80 lb bags (0.60 cu ft each)", value: Math.ceil(tot / 0.6) },
        { label: "60 lb bags (0.45 cu ft each)", value: Math.ceil(tot / 0.45) },
        { label: "Cubic meters", value: nf(tot * 0.0283168, 2) + " m³" },
      ],
    };
  }), [f]);

  return (
    <div className="tool">
      <div className="fields">
        <Field label="Length" {...bind("len")} />
        <Field label="Width" {...bind("wid")} />
        <Field label="Thickness" {...bind("th")} />
        <Field label="Waste allowance (%)" {...bind("waste")} />
      </div>
      <Results {...res} />
    </div>
  );
}
