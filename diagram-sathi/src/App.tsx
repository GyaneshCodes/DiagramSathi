import { Navbar } from "./components/Navbar";
import { PaneLeftForm } from "./components/PaneLeftForm";
import { PaneCenterCanvas } from "./components/PaneCenterCanvas";
import { PaneRightCode } from "./components/PaneRightCode";

function App() {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 font-sans text-slate-200">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <PaneLeftForm />
        <PaneCenterCanvas />
        <PaneRightCode />
      </div>
    </div>
  );
}

export default App;
