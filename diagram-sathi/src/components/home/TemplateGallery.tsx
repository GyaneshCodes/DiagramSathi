import { useNavigate } from "react-router-dom";
import { GitBranch, Database, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { useDiagramStore } from "../../store/useDiagramStore";

const TEMPLATES = [
  {
    label: "Blank Flowchart",
    description: "Process flows & logic paths",
    type: "flowchart" as const,
    icon: Workflow,
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    label: "Blank DFD",
    description: "Data flow & system processes",
    type: "dfd" as const,
    icon: GitBranch,
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    label: "Blank ERD",
    description: "Entity relationships & schema",
    type: "er" as const,
    icon: Database,
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/30",
  },
];

export function TemplateGallery() {
  const navigate = useNavigate();

  const handleCreate = (type: "flowchart" | "dfd" | "er") => {
    useDiagramStore.getState().resetToBlank(type);
    navigate("/editor");
  };

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h2 className="text-lg font-bold tracking-tight text-neutral/80 mb-4">
          Quick Start
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((template, i) => (
            <motion.button
              key={template.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => handleCreate(template.type)}
              className={`group relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/8 bg-white/2 ${template.borderHover} hover:bg-white/5 transition-all duration-300 cursor-pointer overflow-hidden`}
            >
              {/* Gradient bg */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${template.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <template.icon className={`w-5 h-5 ${template.iconColor}`} />
                </div>
                <span className="text-sm font-semibold text-neutral/85 group-hover:text-neutral transition-colors">
                  {template.label}
                </span>
                <span className="text-[11px] text-neutral/40 group-hover:text-neutral/60 transition-colors">
                  {template.description}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
