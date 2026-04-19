import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutGrid, List, Bot, ArrowRight, MoreVertical, FolderOpen, Loader2, Plus } from "lucide-react";
import { useDiagramStore } from "../../store/useDiagramStore";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProjects, type Project } from "../../lib/projects";

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 172800000) return "Yesterday";
  return `${Math.floor(diff / 86400000)} days ago`;
}

interface ProjectViewLayoutProps {
  title: string;
  emptyMessage?: string;
  showControls?: boolean;
}

export const ProjectViewLayout = ({
  title,
  emptyMessage = "This folder is empty or hasn't been implemented with backend data yet.",
  showControls = true,
}: ProjectViewLayoutProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");

  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const setProjectDescription = useDiagramStore((state) => state.setProjectDescription);
  const setIsGenerating = useDiagramStore((state) => state.setIsGenerating);

  // If we are not on the generic pages that have data, don't show diagrams
  const hasData = ["Home", "Recent", "Drafts", "All Diagrams", "All Projects", "Projects", "Trash"].includes(title);
  
  const fetchProjects = () => {
    setLoading(true);
    setFetchError(null);

    let statusFilter: "draft" | "active" | "trashed" | undefined = undefined;
    if (title === "Drafts") statusFilter = "draft";
    if (title === "Trash") statusFilter = "trashed";

    // Safety timeout: if Supabase doesn't respond within 10s, stop the spinner
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setFetchError("Connection timed out. Please check your network and try again.");
    }, 10000);

    getUserProjects(statusFilter)
      .then((data) => {
        clearTimeout(timeoutId);
        let displayedData = data;
        if (title === "Recent" || title === "Home") {
          const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
          displayedData = data.filter((d) => {
            const dateStr = d.updated_at || d.created_at;
            if (!dateStr) return false;
            return new Date(dateStr).getTime() > twoDaysAgo;
          });
        }
        setProjectsData(displayedData);
        setLoading(false);
        setFetchError(null);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Failed to fetch projects:", err);
        setLoading(false);
        setFetchError("Failed to load diagrams. Please try again.");
      });
  };

  useEffect(() => {
    if (!hasData) {
      setLoading(false);
      return;
    }
    fetchProjects();
  }, [title, hasData]);

  const rawDiagrams = projectsData.map(p => {
    const validDate = p.updated_at || p.created_at || new Date().toISOString();
    return {
      id: p.id,
      title: p.title || "Untitled Diagram",
      date: formatTimeAgo(validDate),
      timestamp: new Date(validDate).getTime(),
      type: p.diagram_type
    };
  });

  const filteredDiagrams = hasData 
    ? rawDiagrams.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          if (sortOption === "name_asc") return a.title.localeCompare(b.title);
          if (sortOption === "date_asc") return a.timestamp - b.timestamp;
          return b.timestamp - a.timestamp;
        })
    : [];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setProjectDescription(prompt);
    setIsGenerating(true);
    navigate("/editor");
  };

  const handleNewBlank = () => {
    useDiagramStore.getState().resetToBlank();
    navigate("/editor");
  };

  return (
    <div className="flex flex-col gap-14 w-full">
      {/* AI GENERATION HEADER */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
            <span className="text-transparent [-webkit-text-stroke:1px_var(--color-neutral)] opacity-60 mr-3">
              Hello,
            </span>
            Architect
          </h1>
          <p className="text-sm text-neutral/50 font-light">
            Describe the logic of your system to generate a highly structured diagram.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative rounded-2xl glass-card overflow-hidden bg-white/[0.03] border border-white/10 group focus-within:border-primary/40 focus-within:shadow-[0_0_40px_-10px_rgba(var(--color-primary-rgb),0.15)] transition-all duration-500"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A library system where the user registers, checks out a book, and the database updates..."
            rows={3}
            className="w-full bg-transparent resize-none p-5 text-sm md:text-base outline-none text-neutral placeholder:text-neutral/25 selection:bg-primary/20"
            style={{ scrollbarWidth: "none" }}
          />

          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-neutral/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                DFD / ER Supported
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNewBlank}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-neutral/80 font-medium text-sm hover:bg-white/10 hover:text-neutral hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Blank Diagram
              </button>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-neutral font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/20 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                Generate Diagram
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ACTIVE VIEW CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight text-neutral/90">
              {title}
            </h2>

            {/* View Controls */}
            {showControls && (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="w-4 h-4 text-neutral/40 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm outline-none focus:border-primary/50 focus:w-48 w-32 transition-all duration-300 placeholder-neutral/30"
                  />
                </div>

                <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-center ${
                      viewMode === "grid"
                        ? "bg-white/10 text-neutral shadow-sm"
                        : "text-neutral/40 hover:text-neutral/70"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-center ${
                      viewMode === "list"
                        ? "bg-white/10 text-neutral shadow-sm"
                        : "text-neutral/40 hover:text-neutral/70"
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-neutral/80 outline-none cursor-pointer focus:border-primary/50 appearance-none"
                >
                  <option className="bg-[#12101a] text-neutral" value="date_desc">
                    Last Modified
                  </option>
                  <option className="bg-[#12101a] text-neutral" value="date_asc">
                    Oldest First
                  </option>
                  <option className="bg-[#12101a] text-neutral" value="name_asc">
                    Alphabetical
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* LIST/GRID View Wrapper */}
          {loading ? (
            <div className="h-64 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-neutral/60">Loading diagrams...</p>
            </div>
          ) : fetchError ? (
            <div className="h-64 border-2 border-dashed border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
              <p className="text-sm text-red-400">{fetchError}</p>
              <button
                onClick={fetchProjects}
                className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral/80 hover:bg-white/10 hover:text-neutral transition-all duration-200 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : hasData && filteredDiagrams.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredDiagrams.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative cursor-pointer"
                    onClick={() => navigate(`/editor/${item.id}`)}
                  >
                    <div className="glass-card aspect-video mb-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden group-hover:border-primary/30 transition-colors duration-300">
                      {/* Placeholder abstract representation of a diagram */}
                      <div className="w-full h-full opacity-20 group-hover:opacity-40 transition-opacity duration-300 flex items-center justify-center">
                        {item.type === "dfd" ? (
                          <div className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-primary/50" />
                            <div className="h-0.5 w-8 bg-neutral/30" />
                            <div className="w-8 h-8 rotate-45 border-2 border-neutral/50" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="w-12 h-6 border-2 border-neutral/50" />
                            <div className="flex justify-center gap-4">
                              <div className="w-px h-6 bg-neutral/30" />
                            </div>
                            <div className="flex gap-4">
                              <div className="w-12 h-6 border-2 border-neutral/50 rounded-full" />
                              <div className="w-12 h-6 border-2 border-neutral/50 rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-start px-1">
                      <div>
                        <h3 className="text-sm font-semibold text-neutral/90 truncate max-w-[180px] group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-neutral/40 mt-0.5">{item.date}</p>
                      </div>
                      <button className="text-neutral/30 hover:text-neutral/80 p-1 cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredDiagrams.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center justify-between p-4 glass-card rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/editor/${item.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#12101a] border border-white/10 flex items-center justify-center shrink-0">
                        {item.type === "dfd" ? (
                          <ArrowRight className="w-4 h-4 text-primary" />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral/90 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-neutral/40 mt-0.5 capitalize">
                          {item.type} Diagram
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-neutral/40">{item.date}</span>
                      <button className="text-neutral/30 hover:text-neutral/80 p-1 cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="h-64 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="w-5 h-5 text-neutral/30" />
              </div>
              <h3 className="text-sm font-medium text-neutral/60 mb-1">
                No files found in {title.toLowerCase()}
              </h3>
              <p className="text-xs text-neutral/40 max-w-[250px]">{emptyMessage}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
