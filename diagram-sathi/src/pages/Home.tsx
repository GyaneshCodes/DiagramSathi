import { useState, useEffect, useCallback } from "react";
import { HeroSection } from "../components/home/HeroSection";
import { TemplateGallery } from "../components/home/TemplateGallery";
import { RecentFiles } from "../components/home/RecentFiles";
import { StatsCards } from "../components/home/StatsCards";
import { getHomeSummary } from "../lib/projects";
import type { Project } from "../lib/projects";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [recentProjects, setRecentProjects] = useState<
    Pick<Project, "id" | "title" | "diagram_type" | "status" | "updated_at" | "is_pinned">[]
  >([]);
  const [totalDiagrams, setTotalDiagrams] = useState(0);
  const [mostCreatedType, setMostCreatedType] = useState("None");
  const [typeBreakdown, setTypeBreakdown] = useState<Record<string, number>>({});

  const fetchSummary = useCallback(() => {
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    getHomeSummary()
      .then((data) => {
        clearTimeout(timeoutId);
        setRecentProjects(data.recentProjects);
        setTotalDiagrams(data.totalDiagrams);
        setMostCreatedType(data.mostCreatedType);
        setTypeBreakdown(data.typeBreakdown);
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Failed to load home summary:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="flex flex-col gap-12 w-full">
      <HeroSection />
      <TemplateGallery />
      <RecentFiles
        projects={recentProjects}
        loading={loading}
        onRefresh={fetchSummary}
      />
      <StatsCards
        totalDiagrams={totalDiagrams}
        mostCreatedType={mostCreatedType}
        typeBreakdown={typeBreakdown}
        loading={loading}
      />
    </div>
  );
}
