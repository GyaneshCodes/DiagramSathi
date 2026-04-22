import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Pin, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { Project } from "../../lib/projects";
import { renameProject, moveToTrash, updateProject } from "../../lib/projects";
import { DiagramCardMenu } from "../ui/DiagramCardMenu";

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return "Yesterday";
  return `${Math.floor(diff / 86400000)}d ago`;
}

function DiagramTypeIcon({ type }: { type: string }) {
  if (type === "er") {
    return (
      <div className="flex flex-col gap-1 opacity-30 group-hover:opacity-50 transition-opacity">
        <div className="w-8 h-4 border border-neutral/50 rounded-sm" />
        <div className="flex justify-center">
          <div className="w-px h-3 bg-neutral/30" />
        </div>
        <div className="w-8 h-4 border border-neutral/50 rounded-sm" />
      </div>
    );
  }
  if (type === "flowchart") {
    return (
      <div className="flex flex-col items-center gap-1 opacity-30 group-hover:opacity-50 transition-opacity">
        <div className="w-8 h-4 border border-neutral/50 rounded-md" />
        <div className="w-px h-2 bg-neutral/30" />
        <div className="w-6 h-6 rotate-45 border border-neutral/50" />
        <div className="w-px h-2 bg-neutral/30" />
        <div className="w-8 h-4 border border-neutral/50 rounded-md" />
      </div>
    );
  }
  // DFD default
  return (
    <div className="flex gap-3 items-center opacity-30 group-hover:opacity-50 transition-opacity">
      <div className="w-6 h-6 rounded-full border border-primary/50" />
      <div className="h-px w-5 bg-neutral/30" />
      <div className="w-6 h-6 rotate-45 border border-neutral/50" />
    </div>
  );
}

interface RecentFilesProps {
  projects: Pick<
    Project,
    "id" | "title" | "diagram_type" | "status" | "updated_at" | "is_pinned"
  >[];
  loading: boolean;
  onRefresh?: () => void;
}

export function RecentFiles({ projects, loading, onRefresh }: RecentFilesProps) {
  const navigate = useNavigate();
  const [localProjects, setLocalProjects] = useState(projects);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Sync when parent data changes
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Focus rename input
  useEffect(() => {
    if (renamingId) {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [renamingId]);

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
      setLocalProjects((prev) =>
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
      setLocalProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Marked as Draft");
      onRefresh?.();
    } catch {
      toast.error("Failed to mark as draft");
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      await moveToTrash(id);
      setLocalProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Moved to Trash");
      onRefresh?.();
    } catch {
      toast.error("Failed to move to trash");
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold tracking-tight text-neutral/80 mb-4">
          Recents
        </h2>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-56 h-40 rounded-xl bg-white/3 border border-white/6 animate-pulse shrink-0"
            />
          ))}
        </div>
      </section>
    );
  }

  if (localProjects.length === 0) return null;

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight text-neutral/80">
            Recents
          </h2>
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-1 text-xs text-neutral/40 hover:text-primary transition-colors duration-200 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Static grid (max 4 items) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {localProjects.slice(0, 4).map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              onClick={() => {
                if (!renamingId) navigate(`/editor/${project.id}`);
              }}
              className="group relative flex flex-col w-full cursor-pointer"
            >
              {/* Thumbnail card */}
              <div className="relative aspect-video rounded-xl border border-white/8 bg-white/3 flex items-center justify-center overflow-hidden group-hover:border-primary/25 transition-all duration-300">
                <DiagramTypeIcon type={project.diagram_type} />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {project.is_pinned && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-semibold uppercase tracking-wider">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  )}
                  {project.status === "draft" && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-neutral/50 text-[9px] font-semibold uppercase tracking-wider">
                      Draft
                    </span>
                  )}
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Meta */}
              <div className="mt-2.5 px-0.5 flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  {renamingId === project.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleCommitRename(project.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCommitRename(project.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-neutral bg-white/10 border border-primary/50 rounded px-1.5 py-0.5 outline-none w-full"
                    />
                  ) : (
                    <h3 className="text-sm font-semibold text-neutral/85 truncate group-hover:text-primary transition-colors duration-200">
                      {project.title || "Untitled Diagram"}
                    </h3>
                  )}
                  <p className="text-[11px] text-neutral/35 mt-0.5">
                    {formatTimeAgo(project.updated_at)}
                  </p>
                </div>
                <DiagramCardMenu
                  location="home"
                  onRename={() => handleStartRename(project.id, project.title || "Untitled Diagram")}
                  onMarkAsDraft={() => handleMarkAsDraft(project.id)}
                  onMoveToTrash={() => handleMoveToTrash(project.id)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
