import { PaneLeftForm } from "./components/PaneLeftForm";
import { PaneCenterCanvas } from "./components/PaneCenterCanvas";
import { PaneRightCode } from "./components/PaneRightCode";

function App() {
  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <PaneLeftForm />
      <PaneCenterCanvas />
      <PaneRightCode />
    </div>
  );
}

export default App;
