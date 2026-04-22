import { useState, useEffect, useRef } from "react";
import { MoreVertical, Pencil, FileInput, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type MenuLocation = "home" | "all" | "drafts" | "trash";

interface DiagramCardMenuProps {
  location: MenuLocation;
  onRename: () => void;
  onMarkAsDraft?: () => void;
  onRemoveFromDraft?: () => void;
  onMoveToTrash?: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
}

export function DiagramCardMenu({
  location,
  onRename,
  onMarkAsDraft,
  onRemoveFromDraft,
  onMoveToTrash,
  onRestore,
  onDeletePermanently,
}: DiagramCardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  const menuItems = getMenuItems(location, {
    onRename,
    onMarkAsDraft,
    onRemoveFromDraft,
    onMoveToTrash,
    onRestore,
    onDeletePermanently,
  });

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-md text-neutral/30 hover:text-neutral/80 hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-[#1a1725] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(item.action);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  item.destructive
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-neutral/70 hover:bg-white/5 hover:text-neutral"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemDef {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  destructive?: boolean;
}

function getMenuItems(
  location: MenuLocation,
  callbacks: {
    onRename: () => void;
    onMarkAsDraft?: () => void;
    onRemoveFromDraft?: () => void;
    onMoveToTrash?: () => void;
    onRestore?: () => void;
    onDeletePermanently?: () => void;
  },
): MenuItemDef[] {
  switch (location) {
    case "home":
    case "all":
      return [
        { label: "Rename", icon: Pencil, action: callbacks.onRename },
        ...(callbacks.onMarkAsDraft
          ? [{ label: "Mark as Draft", icon: FileInput, action: callbacks.onMarkAsDraft }]
          : []),
        ...(callbacks.onMoveToTrash
          ? [{ label: "Move to Trash", icon: Trash2, action: callbacks.onMoveToTrash, destructive: true }]
          : []),
      ];
    case "drafts":
      return [
        { label: "Rename", icon: Pencil, action: callbacks.onRename },
        ...(callbacks.onRemoveFromDraft
          ? [{ label: "Remove from Draft", icon: FileInput, action: callbacks.onRemoveFromDraft }]
          : []),
        ...(callbacks.onMoveToTrash
          ? [{ label: "Move to Trash", icon: Trash2, action: callbacks.onMoveToTrash, destructive: true }]
          : []),
      ];
    case "trash":
      return [
        ...(callbacks.onRestore
          ? [{ label: "Restore", icon: RotateCcw, action: callbacks.onRestore }]
          : []),
        ...(callbacks.onDeletePermanently
          ? [{ label: "Delete Permanently", icon: AlertTriangle, action: callbacks.onDeletePermanently, destructive: true }]
          : []),
      ];
  }
}
