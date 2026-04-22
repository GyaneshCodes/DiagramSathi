import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useDiagramStore } from "../../store/useDiagramStore";
import { useAuth } from "../../context/AuthContext";

const SMART_CHIPS = [
  "Draw a microservices architecture for an e-commerce app",
  "Create a 3-tier DFD for a library management system",
  "Design an ER diagram for a social media platform",
  "Map the data flow of an online banking system",
  "Create a flowchart for a user registration process",
];

const DIAGRAM_TYPES = [
  { label: "Flowchart", value: "flowchart" as const },
  { label: "DFD (Data Flow Diagram)", value: "dfd" as const },
  { label: "ERD (Entity Relationship Diagram)", value: "er" as const },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function HeroSection() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<"flowchart" | "dfd" | "er">(
    "flowchart",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const setProjectDescription = useDiagramStore((s) => s.setProjectDescription);
  const setIsGenerating = useDiagramStore((s) => s.setIsGenerating);
  const setPreferredDiagramType = useDiagramStore(
    (s) => s.setPreferredDiagramType,
  );

  const displayName = profile?.display_name || "Architect";
  const greeting = getGreeting();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setProjectDescription(prompt);
    setPreferredDiagramType(selectedType);
    setIsGenerating(true);
    navigate("/editor");
  };

  const handleChipClick = (text: string) => {
    setPrompt(text);
  };

  const currentTypeLabel =
    DIAGRAM_TYPES.find((t) => t.value === selectedType)?.label ?? "Flowchart";

  return (
    <section className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
          <span className="text-transparent [-webkit-text-stroke:1px_var(--color-neutral)] opacity-60 mr-3">
            {greeting},
          </span>
          {displayName}
        </h1>
        <p className="text-sm text-neutral/50 font-light">
          Describe the logic of your system to generate a highly structured
          diagram.
        </p>
      </motion.div>

      {/* Prompt Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative rounded-2xl bg-white/3 border border-white/10 group focus-within:border-primary/40 focus-within:shadow-[0_0_40px_-10px_rgba(128,59,255,0.15)] transition-all duration-500"
      >
        {/* Glow line */}
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-linear-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="E.g., A library system where the user registers, checks out a book, and the database updates..."
          rows={3}
          className="w-full bg-transparent resize-none p-5 text-sm md:text-base outline-none text-neutral placeholder:text-neutral/25 selection:bg-primary/20"
          style={{ scrollbarWidth: "none" }}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/1 rounded-b-2xl">
          {/* Diagram Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral/70 hover:text-neutral hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral/50">
                Type:
              </span>
              <span className="font-medium">{currentTypeLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-2 z-50 min-w-[220px] bg-[#1a1725] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                {DIAGRAM_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedType(type.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 cursor-pointer ${
                      selectedType === type.value
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-neutral/70 hover:bg-white/5 hover:text-neutral"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-neutral font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            Generate
          </button>
        </div>
      </motion.div>

      {/* Smart Chips */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary/60 shrink-0" />
        <span className="text-[11px] text-neutral/40 font-medium uppercase tracking-wider mr-1">
          Try:
        </span>
        {SMART_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleChipClick(chip)}
            className="px-3 py-1 rounded-full bg-white/4 border border-white/10 text-[11px] text-neutral/50 hover:text-neutral/80 hover:bg-white/8 hover:border-primary/20 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {chip.length > 40 ? chip.slice(0, 40) + "…" : chip}
          </button>
        ))}
      </motion.div>
    </section>
  );
}
