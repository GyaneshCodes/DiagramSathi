import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  Clock,
  FileText,
  FolderOpen,
  Trash2,
  Search,
  LayoutGrid,
  List,
  Bot,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import { useDiagramStore } from "../store/useDiagramStore";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_DIAGRAMS = [
  { id: "1", title: "E-Commerce System DFD", date: "2 hours ago", timestamp: Date.now() - 2 * 3600000, type: "dfd" },
  { id: "2", title: "User Auth ER Diagram", date: "Yesterday", timestamp: Date.now() - 24 * 3600000, type: "er" },
  { id: "3", title: "Payment Infrastructure", date: "3 days ago", timestamp: Date.now() - 3 * 24 * 3600000, type: "dfd" },
  { id: "4", title: "AI Generation Flow", date: "Last week", timestamp: Date.now() - 7 * 24 * 3600000, type: "dfd" },
  { id: "5", title: "Inventory Database ERD", date: "Last week", timestamp: Date.now() - 8 * 24 * 3600000, type: "er" },
];

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");

  const filteredDiagrams = MOCK_DIAGRAMS.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortOption === "name_asc") return a.title.localeCompare(b.title);
    if (sortOption === "date_asc") return a.timestamp - b.timestamp;
    return b.timestamp - a.timestamp;
  });

  const setProjectDescription = useDiagramStore(
    (state) => state.setProjectDescription,
  );
  const setIsGenerating = useDiagramStore((state) => state.setIsGenerating);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setProjectDescription(prompt);
    setIsGenerating(true);
    // In a real flow, the /editor will pick up isGenerating and make the API call
    navigate("/editor");
  };

  const menuItems = [
    { name: "User", icon: UserCircle, action: () => setActiveTab("User") },
    { name: "Recent", icon: Clock, action: () => setActiveTab("Recent") },
    { name: "Drafts", icon: FileText, action: () => setActiveTab("Drafts") },
    {
      name: "All Projects",
      icon: FolderOpen,
      action: () => setActiveTab("All Projects"),
    },
    { name: "Trash", icon: Trash2, action: () => setActiveTab("Trash") },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] text-neutral font-sans selection:bg-primary/30">
      {/* ── ALBIENT BG ── */}
      <div className="absolute inset-0 pointer-events-none hero-ambient-bg opacity-40 mix-blend-screen" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="relative z-10 w-64 h-full border-r border-white/5 bg-[#0E0E11] flex flex-col pt-6 pb-6 shadow-2xl">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-4 h-4 text-neutral" />
          </div>
          <span className="font-bold text-lg tracking-tighter uppercase">
            Diagram Sathi
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5"
                    : "text-neutral/50 hover:bg-white/5 hover:text-neutral/90"
                }`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] ${
                    isActive ? "text-primary" : "text-neutral/40"
                  }`}
                />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Storage / Upgrade prompt could go here */}
        <div className="px-6 mt-auto">
          <div className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <p className="text-xs font-mono text-neutral/40 uppercase mb-2 block">
              Workspace
            </p>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
              <div className="bg-primary w-1/4 h-full" />
            </div>
            <p className="text-[11px] text-neutral/60">
              <span className="text-neutral/90 font-medium">5</span> / 20
              projects used
            </p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-10 py-12 flex flex-col gap-14">
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
                Describe the logic of your system to generate a highly
                structured diagram.
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

                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-neutral font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/20"
                >
                  <Bot className="w-4 h-4" />
                  Generate Diagram
                </button>
              </div>
            </motion.div>
          </div>

          {/* ACTIVE TAB CONTENT */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-neutral/90">
                  {activeTab}
                </h2>

                {/* View Controls - only really useful for project lists right now */}
                {["Recent", "Drafts", "All Projects"].includes(activeTab) && (
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
                      <option
                        className="bg-[#12101a] text-neutral"
                        value="date_desc"
                      >
                        Last Modified
                      </option>
                      <option
                        className="bg-[#12101a] text-neutral"
                        value="date_asc"
                      >
                        Oldest First
                      </option>
                      <option
                        className="bg-[#12101a] text-neutral"
                        value="name_asc"
                      >
                        Alphabetical
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* LIST/GRID View Wrapper */}
              {activeTab === "Recent" ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredDiagrams.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative cursor-pointer"
                        onClick={() => navigate("/editor")}
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
                            <p className="text-[11px] text-neutral/40 mt-0.5">
                              {item.date}
                            </p>
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
                        onClick={() => navigate("/editor")}
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
                          <span className="text-xs text-neutral/40">
                            {item.date}
                          </span>
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
                    No files found in {activeTab}
                  </h3>
                  <p className="text-xs text-neutral/40 max-w-[250px]">
                    This folder is empty or hasn't been implemented with backend
                    data yet.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
