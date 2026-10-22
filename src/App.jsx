import Calculator from "./components/Calculator.jsx";
import Stairs from "./components/tools/Stairs.jsx";
import Rafters from "./components/tools/Rafters.jsx";
import Concrete from "./components/tools/Concrete.jsx";
import BoardFeet from "./components/tools/BoardFeet.jsx";
import ScaleConverter from "./components/tools/ScaleConverter.jsx";
import { usePersistentState } from "./hooks.js";

const TOOLS = [
  { id: "stairs", label: "Stairs", Component: Stairs },
  { id: "rafter", label: "Rafters", Component: Rafters },
  { id: "concrete", label: "Concrete", Component: Concrete },
  { id: "board", label: "Board feet", Component: BoardFeet },
  { id: "scale", label: "Scale", Component: ScaleConverter },
];

export default function App() {
  const [den, setDen] = usePersistentState("jsc:prec", 16);
  const [mode, setMode] = usePersistentState("jsc:mode", "ftin");
  const [tab, setTab] = usePersistentState("jsc:tab", "stairs");

  return (
    <div className="wrap">
      <header>
        <h1>Construction <span>Calculator</span></h1>
        <p className="sub">
          Feet-inch-fraction math with automatic conversions, plus stair, rafter, concrete, board-foot, and scale
          tools. Every length field accepts the same notation as the keypad.
        </p>
      </header>

      <div className="grid">
        <Calculator den={den} setDen={setDen} mode={mode} setMode={setMode} />

        <section className="unit" aria-label="Layout tools">
          <div className="tabs" role="tablist">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* All tools stay mounted so each keeps its inputs when you switch tabs. */}
          {TOOLS.map(({ id, Component }) => (
            <div key={id} hidden={tab !== id}>
              <Component den={den} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
