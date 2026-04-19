import { useState } from "react";
import { Settings, UserCircle, Share2, Download, X, ArrowLeft, Save } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
import { useDiagramStore } from "../store/useDiagramStore";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { saveProject, projectTitle, projectStatus, currentProjectId } = useDiagramStore();

  const handleSaveAsDraft = async () => {
    if (!session?.user?.id) return;
    await saveProject(session.user.id, true);
  };

  const handleExport = () => {
    const flowEl = document.querySelector(".react-flow") as HTMLElement;
    if (!flowEl) return;

    const filter = (node: HTMLElement) => {
      // Exclude the controls from the exported image
      if (node?.classList?.contains("react-flow__controls")) {
        return false;
      }
      return true;
    };

    toPng(flowEl, {
      backgroundColor: isTransparent ? "transparent" : "#09090b",
      width: flowEl.offsetWidth,
      height: flowEl.offsetHeight,
      style: {
        width: flowEl.offsetWidth.toString() + "px",
        height: flowEl.offsetHeight.toString() + "px",
      },
      filter: filter,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `diagram-${isTransparent ? "transparent" : "bg"}.png`;
        link.href = dataUrl;
        link.click();
        setIsExportOpen(false);
      })
      .catch((err) => {
        console.error("Failed to export diagram", err);
      });
  };

  return (
    <>
      <div className="h-14 bg-[#0f111a]/80 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/home")}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-md hover:bg-slate-800/50 flex items-center justify-center cursor-pointer"
            title="Go to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px]">{projectTitle}</span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${projectStatus === 'draft' ? 'text-amber-500' : 'text-emerald-500'}`}>
               {currentProjectId ? (projectStatus === 'draft' ? 'Draft - Auto Saved' : 'Saved') : 'Unsaved'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <Settings size={20} />
          </button>
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <UserCircle size={24} strokeWidth={1.5} />
          </button>
          
          <div className="w-px h-5 bg-slate-800 mx-1"></div>
          
          <button className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <Share2 size={16} /> SHARE
          </button>

          <button
            onClick={handleSaveAsDraft}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ml-2 cursor-pointer ${
              projectStatus === "draft" 
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                : "bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700"
            }`}
            title="Mark as Draft"
          >
            <Save size={16} /> Mark as Draft
          </button>
          
          <button
            onClick={() => setIsExportOpen(true)}
            className="bg-[#6366f1] hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ml-2 shadow-lg shadow-indigo-900/20"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-slate-800 rounded-xl shadow-2xl w-[400px] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">Export Diagram</h3>
              <button
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-300">Background</span>
                <span className="text-xs text-slate-500 mt-0.5">Toggle PNG Transparency</span>
              </div>
              <button
                onClick={() => setIsTransparent(!isTransparent)}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-all duration-200 ease-in-out ${
                  isTransparent 
                    ? "bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]" 
                    : "bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800"
                }`}
              >
                {isTransparent ? "Transparent" : "Solid Dark"}
              </button>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3 bg-[#6366f1] hover:bg-indigo-500 rounded-lg text-white font-medium flex justify-center items-center gap-2 transition-all duration-200 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
            >
              <Download size={18} /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
};
