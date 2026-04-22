import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutGrid, List, ArrowRight, FolderOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getUserProjects, renameProject, moveToTrash, restoreFromTrash, permanentlyDelete, updateProject, type Project } from "../../lib/projects";
import { DiagramCardMenu, type MenuLocation } from "../ui/DiagramCardMenu";
import { ConfirmModal } from "../ui/ConfirmModal";

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 172800000) return "Yesterday";
  return `${Math.floor(diff / 86400000)} days ago`;
}

function getMenuLocation(title: string): MenuLocation {
  if (title === "Drafts") return "drafts";
  if (title === "Trash") return "trash";
  return "all";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");

  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const menuLocation = getMenuLocation(title);
  const hasData = ["Drafts", "All Diagrams", "All Projects", "Projects", "Trash"].includes(title);

  const fetchProjects = () => {
    setLoading(true);
    setFetchError(null);

    let statusFilter: "draft" | "active" | "trashed" | undefined = undefined;
    if (title === "Drafts") statusFilter = "draft";
    if (title === "Trash") statusFilter = "trashed";

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setFetchError("Connection timed out. Please check your network and try again.");
    }, 10000);

    getUserProjects(statusFilter)
      .then((data) => {
        clearTimeout(timeoutId);
        setProjectsData(data);
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

  // Focus rename input when it opens
  useEffect(() => {
    if (renamingId) {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [renamingId]);

  // --- Optimistic removal helper ---
  const removeCard = (id: string) => {
    setProjectsData((prev) => prev.filter((p) => p.id !== id));
  };

  // --- Action Handlers ---
  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const handleCommitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    try {
      await renameProject(id, trimmed);
      setProjectsData((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title: trimmed } : p)),
      );
      toast.success("Renamed successfully");
    } catch {
      toast.error("Failed to rename");
    }
    setRenamingId(null);
  };

  const handleMarkAsDraft = async (id: string) => {
    try {
      await updateProject(id, { status: "draft" });
      removeCard(id);
      toast.success("Marked as Draft");
    } catch {
      toast.error("Failed to mark as draft");
    }
  };

  const handleRemoveFromDraft = async (id: string) => {
    try {
      await updateProject(id, { status: "active" });
      removeCard(id);
      toast.success("Removed from Drafts");
    } catch {
      toast.error("Failed to remove from drafts");
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      await moveToTrash(id);
      removeCard(id);
      toast.success("Moved to Trash");
    } catch {
      toast.error("Failed to move to trash");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreFromTrash(id);
      removeCard(id);
      toast.success("Restored successfully");
    } catch {
      toast.error("Failed to restore");
    }
  };

  const handleDeletePermanently = async () => {
    if (!deleteTarget) return;
    try {
      await permanentlyDelete(deleteTarget.id);
      removeCard(deleteTarget.id);
      toast.success("Deleted permanently");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteTarget(null);
  };

  // --- Data transforms ---
  const rawDiagrams = projectsData.map((p) => {
    const validDate = p.updated_at || p.created_at || new Date().toISOString();
    return {
      id: p.id,
      title: p.title || "Untitled Diagram",
      date: formatTimeAgo(validDate),
      timestamp: new Date(validDate).getTime(),
      type: p.diagram_type,
    };
  });

  const filteredDiagrams = hasData
    ? rawDiagrams
        .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
          if (sortOption === "name_asc") return a.title.localeCompare(b.title);
          if (sortOption === "date_asc") return a.timestamp - b.timestamp;
          return b.timestamp - a.timestamp;
        })
    : [];

  // --- Render helpers ---
  const renderTitle = (item: { id: string; title: string }) => {
    if (renamingId === item.id) {
      return (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={() => handleCommitRename(item.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommitRename(item.id);
            if (e.key === "Escape") setRenamingId(null);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-semibold text-neutral bg-white/10 border border-primary/50 rounded px-1.5 py-0.5 outline-none w-full max-w-[180px]"
        />
      );
    }
    return (
      <h3 className="text-sm font-semibold text-neutral/90 truncate max-w-[180px] group-hover:text-primary transition-colors">
        {item.title}
      </h3>
    );
  };

  const renderMenu = (item: { id: string; title: string }) => (
    <DiagramCardMenu
      location={menuLocation}
      onRename={() => handleStartRename(item.id, item.title)}
      onMarkAsDraft={menuLocation === "all" || menuLocation === "home" ? () => handleMarkAsDraft(item.id) : undefined}
      onRemoveFromDraft={menuLocation === "drafts" ? () => handleRemoveFromDraft(item.id) : undefined}
      onMoveToTrash={menuLocation !== "trash" ? () => handleMoveToTrash(item.id) : undefined}
      onRestore={menuLocation === "trash" ? () => handleRestore(item.id) : undefined}
      onDeletePermanently={menuLocation === "trash" ? () => setDeleteTarget({ id: item.id, title: item.title }) : undefined}
    />
  );

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Confirm delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Permanently?"
        description={`"${deleteTarget?.title ?? ""}" will be gone forever. This cannot be undone.`}
        confirmLabel="Delete Forever"
        onConfirm={handleDeletePermanently}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-neutral/90">{title}</h1>
      </motion.div>

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
          <div className="flex items-center justify-end mb-6">
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
                      <div className="flex-1 min-w-0 mr-2">
                        {renderTitle(item)}
                        <p className="text-[11px] text-neutral/40 mt-0.5">{item.date}</p>
                      </div>
                      {renderMenu(item)}
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
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#12101a] border border-white/10 flex items-center justify-center shrink-0">
                        {item.type === "dfd" ? (
                          <ArrowRight className="w-4 h-4 text-primary" />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {renderTitle(item)}
                        <p className="text-[11px] text-neutral/40 mt-0.5 capitalize">
                          {item.type} Diagram
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-neutral/40">{item.date}</span>
                      {renderMenu(item)}
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
