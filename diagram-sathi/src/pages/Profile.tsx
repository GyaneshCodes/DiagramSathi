import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, type Accent, ACCENT_MAP } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  LogOut,
  Award,
  BarChart3,
  Database,
  Edit2,
  Check,
  X,
  Camera,
  Lock,
  KeyRound,
  Palette,
  Calendar,
  Moon,
  Sun,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import { getHomeSummary, getUserProjects, type Project } from "../lib/projects";
import { toast } from "react-hot-toast";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Security State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Dynamic Metrics State
  const [stats, setStats] = useState({
    totalDiagrams: 0,
    dfdCount: 0,
    erCount: 0,
    flowchartCount: 0,
    dfdPercent: 0,
    erPercent: 0,
    flowchartPercent: 0
  });
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name || "");
      setEditAvatar(profile.avatar_url || "");
    }
  }, [profile]);

  // Fetch real statistics & project dates for the heatmap
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true);
        const [homeSummary, allProjects] = await Promise.all([
          getHomeSummary(),
          getUserProjects()
        ]);

        const breakdown = homeSummary.typeBreakdown || {};
        const dfd = breakdown.dfd || 0;
        const er = breakdown.er || 0;
        const flowchart = breakdown.flowchart || 0;
        const total = dfd + er + flowchart || 1;

        setStats({
          totalDiagrams: homeSummary.totalDiagrams || 0,
          dfdCount: dfd,
          erCount: er,
          flowchartCount: flowchart,
          dfdPercent: Math.round((dfd / total) * 100),
          erPercent: Math.round((er / total) * 100),
          flowchartPercent: Math.round((flowchart / total) * 100)
        });
        setProjectsList(allProjects || []);
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  // Compute Architect Rank based on actual diagram counts
  const getArchitectRank = (count: number) => {
    if (count >= 100) return { title: "Systems Maestro", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
    if (count >= 50) return { title: "Principal Architect", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
    if (count >= 10) return { title: "Structural Designer", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
    return { title: "Junior Drafter", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" };
  };

  const rankInfo = getArchitectRank(stats.totalDiagrams);

  // Sign out workflow
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/signin", { replace: true });
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  // Profile Save Workflow
  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await updateProfile(editName, editAvatar);
      if (error) throw error;
      toast.success("Profile details updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(profile?.display_name || "");
    setEditAvatar(profile?.avatar_url || "");
    setIsEditing(false);
  };

  // Avatar Upload with Resilient Fallback
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      // 1. Try uploading to Supabase Storage bucket 'avatars'
      const { data: _data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setEditAvatar(publicUrl);
      
      if (!isEditing) {
        const { error } = await updateProfile(profile?.display_name || "", publicUrl);
        if (error) throw error;
        toast.success("Profile avatar updated!");
      } else {
        toast.success("Avatar uploaded! Save details to apply.");
      }
    } catch (err: any) {
      console.warn("Storage upload failed, employing Base64 fallback:", err);
      // Fallback: Convert to Base64 inline string so it works even if storage bucket is offline or unconfigured
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setEditAvatar(base64String);
        if (!isEditing) {
          const { error } = await updateProfile(profile?.display_name || "", base64String);
          if (error) {
            toast.error("Fallback update failed");
          } else {
            toast.success("Avatar saved to profile (offline database backup)!");
          }
        } else {
          toast.success("Avatar processed! Save profile to apply.");
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Secure Password Update Workflow
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated securely!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Compute Active Contribution Grid data
  const renderHeatmap = () => {
    const totalWeeks = 14;
    const totalDays = totalWeeks * 7;
    const daysArray = [];
    const today = new Date();

    // Map project updates into a Date lookup
    const datesMap: Record<string, number> = {};
    projectsList.forEach((proj) => {
      if (proj.updated_at) {
        const dateStr = new Date(proj.updated_at).toDateString();
        datesMap[dateStr] = (datesMap[dateStr] || 0) + 1;
      }
    });

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const count = datesMap[d.toDateString()] || 0;
      daysArray.push({ date: d, count });
    }

    return (
      <div className="grid grid-cols-14 gap-1.5 p-2 bg-neutral/5 rounded-lg border border-border/40 overflow-x-auto">
        {daysArray.map((day, idx) => {
          let opacityClass = "bg-neutral/10";
          if (day.count > 0) opacityClass = "bg-primary/30 border border-primary/40";
          if (day.count > 2) opacityClass = "bg-primary/60 border border-primary/80";
          if (day.count > 4) opacityClass = "bg-primary/95 shadow-sm shadow-primary/20";
          
          return (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 hover:scale-125 cursor-pointer ${opacityClass}`}
              title={`${day.count} diagram events on ${day.date.toLocaleDateString()}`}
            />
          );
        })}
      </div>
    );
  };

  // Accent Colors to offer
  const accents: { name: Accent; color: string; label: string }[] = [
    { name: "purple", color: ACCENT_MAP.purple, label: "Imperial" },
    { name: "orange", color: ACCENT_MAP.orange, label: "Cyber" },
    { name: "green", color: ACCENT_MAP.green, label: "Technical" },
    { name: "blue", color: ACCENT_MAP.blue, label: "Analytical" },
    { name: "silver", color: ACCENT_MAP.silver, label: "Brutalist" }
  ];

  return (
    <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto px-4 md:px-0 selection:bg-primary/30 select-none">
      {/* ── HEADER BLOCK (Asymmetrical Swiss-Tech Style) ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border/50 pb-6 gap-4"
      >
        <div>
          <span className="text-[10px] tracking-widest font-mono text-primary uppercase font-bold">
            SYSTEM CONTROL CENTER
          </span>
          <h1 className="text-4xl font-black tracking-tighter uppercase mt-1">
            Architect{" "}
            <span className="text-transparent [-webkit-text-stroke:1px_var(--color-primary)] opacity-80">
              Profile
            </span>
          </h1>
        </div>
        <p className="text-xs text-neutral/45 font-mono max-w-xs text-left md:text-right">
          INTEGRATION VER: 2026.5 // IDENTITY STATUS: ACTIVE // ROLE: MAESTRO
        </p>
      </motion.div>

      {/* ── GRID SYSTEM (3 Columns - Swiss Tech Geometry) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMN 1: IDENTITY & AVATAR (4 Cols) */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-4 glass-card rounded-xl p-6 border border-border/50 relative overflow-hidden flex flex-col items-center text-center gap-6"
        >
          {/* Accent border highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

          {/* Edit Switch Trigger */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 p-2 rounded-md bg-neutral/5 text-neutral/50 hover:text-primary hover:bg-neutral/10 transition-all cursor-pointer border border-border/30 shadow-sm"
              title="Edit Profile Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {/* Picture Circle with Drag & Drop Visuals */}
          <div className="relative group shrink-0 mt-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/10 flex items-center justify-center bg-panel">
              {editAvatar ? (
                <img
                  src={editAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-4xl font-black text-primary uppercase">
                  {user?.email?.charAt(0) || <UserCircle className="w-16 h-16 opacity-30" />}
                </div>
              )}

              {/* Uploading Overlay spinner */}
              {isUploading && (
                <div className="absolute inset-0 bg-bg/85 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Hover Trigger Camera Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-bg/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-primary cursor-pointer border-none"
              >
                <Camera className="w-6 h-6 mb-1 hover:scale-110 transition-transform" />
                <span className="text-[9px] uppercase tracking-wider font-mono">Upload</span>
              </button>
            </div>
            
            {/* Status dot */}
            <div className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-bg" title="Architect Online" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          {/* Info Details Section */}
          <div className="w-full space-y-4">
            {isEditing ? (
              <div className="space-y-4 text-left">
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral/45 mb-1 block font-mono font-bold">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-input border border-input-border rounded-md px-3 py-2 text-sm text-neutral outline-none focus:border-primary/50 focus:bg-neutral/5 transition-all font-semibold font-sans"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Gyan, Architect"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral/45 mb-1 block font-mono font-bold">
                    Avatar URL Override
                  </label>
                  <input
                    type="text"
                    className="w-full bg-input border border-input-border rounded-md px-3 py-2 text-xs text-neutral/70 outline-none focus:border-primary/50 focus:bg-neutral/5 transition-all font-mono"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-neutral font-bold text-xs cursor-pointer hover:bg-primary/95 transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/10"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-neutral/50 border-t-neutral rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-md bg-neutral/5 border border-border text-neutral font-semibold text-xs cursor-pointer hover:bg-neutral/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <h2 className="text-xl font-black tracking-tight text-neutral font-sans">
                  {profile?.display_name || user?.email?.split("@")[0] || "Maestro Architect"}
                </h2>
                <p className="text-xs text-neutral/50 font-mono select-all">{user?.email}</p>
                <div className={`mt-4 inline-flex items-center gap-1.5 border px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider ${rankInfo.color}`}>
                  <Award className="w-3.5 h-3.5" />
                  {rankInfo.title}
                </div>
              </div>
            )}
          </div>

          {/* Action Actions Console Panel */}
          <div className="w-full border-t border-border/40 pt-4 mt-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-xs cursor-pointer transition-all duration-300 shadow-md shadow-red-500/5 group"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Sign Out from Terminal
            </button>
          </div>
        </motion.div>

        {/* COLUMN 2: ANALYTICS & ACTIVITY HEATMAP (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* ROW 2.1: STATISTICS TILES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* STATS: TOTAL DIAGRAMS */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card rounded-xl p-5 flex flex-col justify-between border border-border/50 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-xs text-neutral/70 font-mono">Systems Count</span>
              </div>
              <div className="mt-5">
                {loadingStats ? (
                  <div className="w-12 h-8 bg-neutral/10 animate-pulse rounded-md" />
                ) : (
                  <span className="text-3xl font-black tracking-tighter text-neutral">{stats.totalDiagrams}</span>
                )}
                <p className="text-[9px] text-neutral/40 uppercase tracking-widest mt-1 font-mono">Total Generated</p>
              </div>
            </motion.div>

            {/* STATS: DATA FLOW DFD DISTRIBUTION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card rounded-xl p-5 flex flex-col justify-between border border-border/50 hover:border-emerald-400/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-bold text-xs text-neutral/70 font-mono">Data Flows (DFD)</span>
              </div>
              <div className="mt-5 space-y-1">
                <div className="flex justify-between items-baseline">
                  {loadingStats ? (
                    <div className="w-10 h-7 bg-neutral/10 animate-pulse rounded-md" />
                  ) : (
                    <span className="text-2xl font-black tracking-tighter text-neutral">{stats.dfdCount}</span>
                  )}
                  <span className="text-xs font-mono font-bold text-emerald-400">{stats.dfdPercent}%</span>
                </div>
                <div className="w-full bg-neutral/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-1000"
                    style={{ width: `${stats.dfdPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* STATS: ENTITY RELATION DISTRIBUTION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass-card rounded-xl p-5 flex flex-col justify-between border border-border/50 hover:border-cyan-400/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="font-bold text-xs text-neutral/70 font-mono">Entity Rels (ER)</span>
              </div>
              <div className="mt-5 space-y-1">
                <div className="flex justify-between items-baseline">
                  {loadingStats ? (
                    <div className="w-10 h-7 bg-neutral/10 animate-pulse rounded-md" />
                  ) : (
                    <span className="text-2xl font-black tracking-tighter text-neutral">{stats.erCount}</span>
                  )}
                  <span className="text-xs font-mono font-bold text-cyan-400">{stats.erPercent}%</span>
                </div>
                <div className="w-full bg-neutral/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-1000"
                    style={{ width: `${stats.erPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>

          </div>

          {/* ROW 2.2: ARCHITECT BLUEPRINT GRID HEATMAP */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card rounded-xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-neutral font-mono uppercase tracking-wider">System Architecture Grid</h3>
              </div>
              <span className="text-[10px] text-neutral/40 font-mono">LATEST 14 WEEKS METRICS</span>
            </div>
            
            {loadingStats ? (
              <div className="w-full h-24 bg-neutral/5 animate-pulse border border-border/30 rounded-lg flex items-center justify-center">
                <span className="text-xs text-neutral/30 font-mono">Syncing activity...</span>
              </div>
            ) : (
              renderHeatmap()
            )}
            
            <div className="flex justify-between items-center mt-3 text-[9px] text-neutral/40 font-mono uppercase">
              <span>Past Quarters</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral/10" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-primary/95" />
                <span>More</span>
              </div>
            </div>
          </motion.div>

          {/* ROW 2.3: SYSTEM SETTINGS PANEL (Accents, Appearance, Security) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* OPTION MODULE: DYNAMIC APPERANCES & ACCENTS */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass-card rounded-xl p-6 border border-border/50 flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-neutral font-mono uppercase tracking-wider">Accent & Appearance</h3>
              </div>

              {/* Theme Selector Light / Dark */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral font-sans">Workspace Theme</span>
                  <p className="text-[10px] text-neutral/45 font-mono">Switch layout rendering mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral/5 hover:bg-neutral/10 border border-border text-neutral font-bold text-xs cursor-pointer transition-all"
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-primary" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Light Mode
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Accent Tuning Grid */}
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-neutral font-sans">Dynamic UI Branding Accent</span>
                  <p className="text-[10px] text-neutral/45 font-mono">Propagates workspace-wide in real-time</p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {accents.map((acc) => {
                    const isSelected = accent === acc.name;
                    return (
                      <button
                        key={acc.name}
                        onClick={() => {
                          setAccent(acc.name);
                          toast.success(`Branding Accent shifted to ${acc.label}!`);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[10px] font-mono uppercase font-bold cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary/10 text-primary border-primary shadow-sm shadow-primary/10"
                            : "bg-neutral/5 text-neutral/55 border-border/50 hover:bg-neutral/10 hover:text-neutral"
                        }`}
                        title={`Select ${acc.label} Theme Color`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-neutral/20"
                          style={{ backgroundColor: acc.color }}
                        />
                        {acc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* OPTION MODULE: SECURE PASSWORD MANAGER */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="glass-card rounded-xl p-6 border border-border/50 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-neutral font-mono uppercase tracking-wider">Credential Security</h3>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="relative">
                  <label className="text-[9px] uppercase tracking-widest text-neutral/45 mb-1 block font-mono font-bold">
                    New Security Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-input border border-input-border rounded-md px-3 py-1.5 pl-8 text-xs text-neutral outline-none focus:border-primary/50 focus:bg-neutral/5 transition-all font-mono"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <KeyRound className="w-3.5 h-3.5 text-neutral/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral/30 hover:text-neutral/70 border-none bg-transparent cursor-pointer p-0"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-widest text-neutral/45 mb-1 block font-mono font-bold">
                    Verify Password Match
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-input border border-input-border rounded-md px-3 py-1.5 pl-8 text-xs text-neutral outline-none focus:border-primary/50 focus:bg-neutral/5 transition-all font-mono"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-neutral/5 border border-border/80 hover:border-primary/30 text-neutral font-bold text-xs cursor-pointer hover:bg-neutral/10 transition-all duration-300 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <div className="w-3.5 h-3.5 border-2 border-neutral/50 border-t-neutral rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                    Commit Password Update
                  </button>
                </div>
              </form>
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
}
