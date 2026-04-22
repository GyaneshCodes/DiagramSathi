import { Layers, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  totalDiagrams: number;
  mostCreatedType: string;
  typeBreakdown: Record<string, number>;
  loading: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  dfd: "DFD",
  er: "ER Diagram",
  flowchart: "Flowchart",
  None: "—",
};

export function StatsCards({
  totalDiagrams,
  mostCreatedType,
  loading,
}: StatsCardsProps) {
  // Calculate "this month" from breakdown (we'll use total as proxy since we don't have date-filtered counts)
  const thisMonthCount = totalDiagrams; // Could be enhanced with a month-filtered query

  const stats = [
    {
      label: "Total Diagrams",
      value: loading ? "—" : totalDiagrams.toString(),
      icon: Layers,
      iconColor: "text-blue-400",
      bgGradient: "from-blue-500/10 to-indigo-500/5",
    },
    {
      label: "Most Created",
      value: loading ? "—" : TYPE_LABELS[mostCreatedType] || mostCreatedType,
      icon: BarChart3,
      iconColor: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-teal-500/5",
    },
    {
      label: "Active Projects",
      value: loading ? "—" : thisMonthCount.toString(),
      icon: TrendingUp,
      iconColor: "text-amber-400",
      bgGradient: "from-amber-500/10 to-orange-500/5",
    },
  ];

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-lg font-bold tracking-tight text-neutral/80 mb-4">
          Architect&apos;s Stats
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className={`relative flex items-center gap-4 p-5 rounded-xl border border-white/8 bg-white/2 overflow-hidden`}
            >
              {/* Subtle gradient */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${stat.bgGradient} opacity-50`}
              />

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-[11px] text-neutral/40 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-neutral/90 mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
