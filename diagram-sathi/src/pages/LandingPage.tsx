import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Github,
  Linkedin,
  Send,
  Bot,
  ClipboardEdit,
  Code,
} from "lucide-react";
import {
  Suspense,
  lazy,
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

function SplineLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spline-spinner" />
        <span className="text-neutral/30 text-xs font-mono tracking-widest uppercase">
          Loading 3D
        </span>
      </div>
    </div>
  );
}

const pillars = [
  {
    icon: Bot,
    title: "AI Generation",
    description:
      "Describe your system in plain text, get a clean diagram instantly.",
  },
  {
    icon: ClipboardEdit,
    title: "Form-Based Editing",
    description: "Customize nodes, edges, and labels through intuitive forms.",
  },
  {
    icon: Code,
    title: "Code Sync",
    description:
      "Full Mermaid.js editor with true bidirectional synchronization.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function LandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // IntersectionObserver: unmount Spline when hero is out of viewport
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
        // Reset loaded state so fade-in works on re-mount
        if (!entry.isIntersecting) setSplineLoaded(false);
      },
      { threshold: 0, rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onSplineLoad = useCallback(() => {
    setSplineLoaded(true);
  }, []);

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const existing = JSON.parse(
      localStorage.getItem("diagramsathi_contact_messages") || "[]",
    );
    existing.push({ ...formData, timestamp: new Date().toISOString() });
    localStorage.setItem(
      "diagramsathi_contact_messages",
      JSON.stringify(existing),
    );
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-screen min-h-screen overflow-x-hidden bg-bg text-neutral font-sans selection:bg-primary/30">
        {/* ── Fixed Navigation ── */}
        <nav
          data-landing-nav
          className="fixed top-0 left-0 w-full px-6 py-5 md:px-10 md:py-6 flex justify-between items-center z-50 bg-[#12101aed] border-b border-white\/[0.04]"
        >
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tighter">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-neutral" />
            </div>
            <span className="hidden sm:inline">DIAGRAM SATHI</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#about"
              className="hidden md:inline text-sm text-neutral/40 hover:text-neutral transition-colors duration-300 font-medium"
            >
              About
            </a>
            <a
              href="#contact"
              className="hidden md:inline text-sm text-neutral/40 hover:text-neutral transition-colors duration-300 font-medium"
            >
              Contact
            </a>
            <Link
              to="/signin"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-neutral font-semibold text-sm hover:bg-white/20 hover:border-white/20 transition-all duration-300 ease-out"
            >
              ENTER APP
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── HERO SECTION (unchanged visually) ──                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          id="hero"
          className="relative w-full h-screen overflow-hidden"
        >
          {/* Ambient gradient background — always visible, never "black" */}
          <div className="absolute inset-0 z-0 hero-ambient-bg" />

          {/* 3D Spline Layer — unmounts entirely when off-screen to free GPU */}
          <div
            className="absolute inset-0 z-10 spline-fullscreen"
            style={{
              opacity: splineLoaded ? 1 : 0,
              transition: "opacity 0.8s ease-out",
            }}
          >
            {heroVisible && (
              <Suspense fallback={<SplineLoader />}>
                <Spline
                  scene="https://prod.spline.design/pFYliVX5JYFvc8x0/scene.splinecode"
                  onLoad={onSplineLoad}
                />
              </Suspense>
            )}
          </div>

          {/* Show loader only while scene hasn't loaded yet */}
          {!splineLoaded && heroVisible && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <SplineLoader />
            </div>
          )}

          {/* Bottom Gradient Vignette */}
          <div className="absolute inset-x-0 bottom-0 h-[55%] z-15 pointer-events-none bg-gradient-to-t\ from-bg via-bg/70 to-transparent" />

          {/* Hero Content — Bottom-left editorial layout */}
          <div className="absolute bottom-0 left-0 w-full z-30 pointer-events-none px-6 pb-10 md:px-12 md:pb-14">
            <div className="max-w-2xl">
              <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-[0.3em] uppercase mb-4">
                // The Diagram Soul
              </p>
              <h1 className="text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] font-black tracking-tight leading-[0.95] uppercase text-neutral">
                <span className="block">Diagram</span>
                <span className="block text-transparent [-webkit-text-stroke:1.5px_var(--color-neutral)] opacity-60">
                  Sathi
                </span>
              </h1>
              <p className="mt-5 text-sm md:text-base text-neutral/50 leading-relaxed max-w-md font-light">
                Build clean, intuitive DFD and ER diagrams, without losing
                control over your architecture.
              </p>
              <Link
                to="/signin"
                className="pointer-events-auto inline-flex items-center gap-2.5 mt-7 px-7 py-3.5 rounded-full bg-primary text-neutral font-bold text-sm hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-300 ease-out"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right-side accent text */}
          <div className="absolute right-6 md:right-12 bottom-12 md:bottom-16 max-w-[180px] text-right z-30 pointer-events-none hidden lg:block">
            <p className="text-[10px] font-mono text-neutral/30 uppercase tracking-[0.25em] leading-relaxed">
              Design That
              <br />
              Speaks Structure
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── ABOUT SECTION ──                                       */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section
          id="about"
          className="relative py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-panel"
        >
          {/* Top divider glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r\ from-transparent via-primary/30 to-transparent" />

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — Story */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-[0.3em] uppercase mb-4">
                // Why DiagramSathi?
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase mb-8">
                The Problem
                <br />
                <span className="text-transparent [-webkit-text-stroke:1px_var(--color-neutral)] opacity-50">
                  With Diagrams
                </span>
              </h2>
              <div className="space-y-5 text-neutral/55 leading-relaxed text-sm md:text-base font-light">
                <p>
                  Whether you're a student building a DFD for documents, a
                  developer mapping architecture, or a professional visualizing
                  data flows, diagram usually means one thing: fighting with
                  your tools.
                </p>
                <p>
                  Dragging boxes, aligning arrows, and fixing overlaps takes
                  more time than the actual problem you're trying to solve.
                  Diagrams should be structured logic, not graphic design
                  projects.
                </p>
                <p className="text-neutral/80 font-normal border-l-2 border-primary/40 pl-4 italic">
                  I built DiagramSathi to fix this. It's an intelligent partner
                  that lets you focus on the architecture, while it perfectly
                  handles the layout.
                </p>
              </div>
            </m.div>

            {/* Right — 3 Animated Pillar Cards */}
            <div className="flex flex-col gap-5">
              {pillars.map((pillar, i) => (
                <m.div
                  key={pillar.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="glass-card group p-6 flex items-start gap-5 cursor-default hover:scale-[1.03] transition-transform duration-300 ease-out"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <pillar.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight mb-1 text-neutral/90 group-hover:text-neutral transition-colors duration-300">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-neutral/40 leading-relaxed font-light group-hover:text-neutral/60 transition-colors duration-300">
                      {pillar.description}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── CONTACT SECTION ──                                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="relative py-24 md:py-32 px-6 md:px-12 bg-bg"
        >
          {/* Top divider */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r\ from-transparent via-white/10 to-transparent" />

          <div className="max-w-xl mx-auto">
            <m.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12"
            >
              <p className="text-[10px] sm:text-xs font-mono text-primary/80 tracking-[0.3em] uppercase mb-4">
                // Let's Connect
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
                Get in Touch
              </h2>
            </m.div>

            <m.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="glass-card p-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-mono text-neutral/40 uppercase tracking-wider mb-2"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral placeholder-neutral/25 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-mono text-neutral/40 uppercase tracking-wider mb-2"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral placeholder-neutral/25 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-mono text-neutral/40 uppercase tracking-wider mb-2"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral placeholder-neutral/25 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-primary text-neutral font-bold text-sm hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>

              {submitted && (
                <m.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-success font-medium pt-2"
                >
                  ✓ Message saved! We'll get back to you soon.
                </m.p>
              )}
            </m.form>

            {/* Social Links */}
            <div className="flex justify-center gap-4 mt-8">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral/40 hover:text-neutral hover:border-primary/30 hover:bg-primary/10 transition-all duration-300"
              >
                <Github className="w-[18px] h-[18px]" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral/40 hover:text-neutral hover:border-primary/30 hover:bg-primary/10 transition-all duration-300"
              >
                <Linkedin className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── FOOTER ──                                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        <footer className="border-t border-white/5 bg-bg px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral/30 font-mono">
              © 2026 DiagramSathi. Built with{" "}
              <span className="text-red-400">❤</span> for developers and
              students.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-neutral/30 hover:text-neutral/60 transition-colors duration-300"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="text-neutral/30 hover:text-neutral/60 transition-colors duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
