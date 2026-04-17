import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserCircle, LogOut, Award, BarChart3, Database, Edit2, Check, X, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name || "");
      setEditAvatar(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile(editName, editAvatar);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(profile?.display_name || "");
    setEditAvatar(profile?.avatar_url || "");
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">
          Architect{" "}
          <span className="text-transparent [-webkit-text-stroke:1px_var(--color-primary)] opacity-80">
            Profile
          </span>
        </h1>
        <p className="text-sm text-neutral/50 font-light">
          Manage your identity, view analytics, and control your workspace.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IDENTITY CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-1 md:col-span-3 glass-card rounded-2xl border border-white/10 bg-white/5 p-8 relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[300px] max-h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

          {/* Edit Button Toggle */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-neutral/40 hover:text-primary hover:bg-white/10 transition-colors cursor-pointer group z-20 shadow-sm"
              title="Edit Profile"
            >
              <Edit2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar block */}
            <div className="relative shrink-0 group">
              {isEditing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {editAvatar ? (
                      <img
                        src={editAvatar}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary border-dashed shadow-xl shadow-primary/20 backdrop-blur-md opacity-80"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-primary border-dashed flex items-center justify-center shadow-xl shadow-primary/20 backdrop-blur-md text-primary">
                        <Camera className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || "User Avatar"}
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary/50 shadow-xl shadow-primary/20 backdrop-blur-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-primary/50 flex items-center justify-center shadow-xl shadow-primary/20 backdrop-blur-md text-3xl font-bold text-primary uppercase">
                      {user?.email?.charAt(0) || <UserCircle className="w-12 h-12" />}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#12101a]" title="Online" />
                </div>
              )}
            </div>

            {/* Info block */}
            <div className="flex-1 text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-neutral/40 ml-1 mb-1 block font-mono">
                      Display Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-neutral outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-semibold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. John Doe, Architect"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-neutral/40 ml-1 mb-1 block font-mono">
                      Avatar URL (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-neutral outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-neutral font-bold text-sm cursor-pointer hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/20"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-neutral/50 border-t-neutral rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save Details
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-neutral font-semibold text-sm cursor-pointer hover:bg-white/10 transition-all"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-neutral">
                    {profile?.display_name || user?.email?.split('@')[0] || "Unknown Architect"}
                  </h2>
                  <p className="text-neutral/60 mb-4">{user?.email}</p>
                  <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    Senior Systems Architect
                  </div>
                </>
              )}
            </div>

            {/* Logout Block */}
            {!isEditing && (
              <div className="mt-4 md:mt-0 shrink-0">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm cursor-pointer hover:bg-red-500/20 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-red-500/10 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ANALYTICS: TOTAL SYSTEMS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between hover:bg-white/10 transition-colors duration-500"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-neutral">Total Systems</h3>
          </div>
          <div>
            <span className="text-4xl font-black tracking-tighter text-neutral group-hover:text-primary transition-colors">142</span>
            <p className="text-xs text-neutral/40 uppercase mt-1 tracking-wider">Diagrams Generated</p>
          </div>
        </motion.div>

        {/* ANALYTICS: DFD vs ER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between hover:bg-white/10 transition-colors duration-500"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-neutral">Distribution</h3>
          </div>
          
          <div className="space-y-4">
            <div className="group cursor-default">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral/70 group-hover:text-primary transition-colors">Data Flow (DFD)</span>
                <span className="font-bold">65%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-primary w-[65%] h-full group-hover:brightness-125 transition-all" />
              </div>
            </div>
            <div className="group cursor-default">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral/70 group-hover:text-emerald-400 transition-colors">Entity Rel. (ER)</span>
                <span className="font-bold">35%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 w-[35%] h-full group-hover:brightness-125 transition-all" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACCOUNT DETAILS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between hover:bg-white/10 transition-colors duration-500"
        >
          <div>
            <h3 className="font-semibold text-neutral mb-1">Plan & Usage</h3>
            <p className="text-xs text-neutral/50">Current subscription details</p>
          </div>
          
          <div className="mt-4 bg-[#12101a] rounded-xl block p-4 border border-white/5 relative overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 p-3">
               <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shadow-sm shadow-primary/10">
                 PRO TIER
               </span>
            </div>
            <div className="font-bold text-lg text-neutral mb-1 group-hover:text-primary transition-colors">Unlimited Tokens</div>
            <p className="text-xs text-neutral/40">You have access to all system generation features.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
