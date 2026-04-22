import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SignInForm from "../../pages/SignIn";
import SignUpForm from "../../pages/SignUp";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  const [isActive, setIsActive] = useState(false);

  // If user is already authenticated, redirect away from auth pages
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setIsActive(location.pathname === "/signup");
  }, [location.pathname]);

  const animateAndNavigate = (targetActive: boolean, path: string) => {
    setIsActive(targetActive);
    const ANIMATION_MS = 700;
    setTimeout(() => navigate(path), ANIMATION_MS);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#12101a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#803bff]/30 border-t-[#803bff] rounded-full animate-spin" />
          <span className="text-white/30 text-xs font-mono tracking-widest uppercase">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  // Don't render auth form if user is already logged in (redirect is pending)
  if (user) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#12101a] p-5 font-sans relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-[#803bff]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#803bff]/5 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-blue-600/3 rounded-full blur-[80px]" />
      </div>

      <div
        className={`relative bg-[#1a1725] border border-white/8 rounded-[30px] shadow-2xl shadow-black/40 overflow-hidden w-full max-w-[880px] min-h-[580px] z-10 ${
          isActive ? "active" : ""
        }`}
      >
        {/* SIGN UP FORM PANE */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out
            w-full md:w-1/2 left-0 z-10
            ${
              isActive
                ? "opacity-100 translate-x-0 md:translate-x-full z-50"
                : "opacity-0 z-0 md:z-10"
            }
            flex flex-col items-center justify-center px-10 text-center bg-[#1a1725]`}
        >
          <SignUpForm />
        </div>

        {/* SIGN IN FORM PANE */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out
            w-full md:w-1/2 left-0 z-20
            ${
              isActive
                ? "opacity-0 -translate-x-full md:translate-x-full"
                : "opacity-100 translate-x-0 md:translate-x-0"
            }
            flex flex-col items-center justify-center px-10 text-center bg-[#1a1725]`}
        >
          <SignInForm />
        </div>

        {/* TOGGLE OVERLAY PANEL */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out z-100 hidden md:block
            ${
              isActive
                ? "-translate-x-full rounded-r-[150px]"
                : "rounded-l-[150px]"
            }`}
        >
          <div
            className={`relative -left-full h-full w-[200%] bg-linear-to-br from-[#803bff] via-[#6025cc] to-[#4a1a99] text-[#f3f0ff] transform transition-transform duration-700 ease-in-out
              ${isActive ? "translate-x-1/2" : "translate-x-0"}`}
          >
            {/* Left Panel — shown when Sign Up is active → prompts to Sign In */}
            <div
              className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center transition-transform duration-700 ease-in-out
                ${isActive ? "translate-x-0" : "-translate-x-[20%]"}`}
            >
              <img
                src="/logo.png"
                alt="DiagramSathi"
                className="h-20 w-auto object-contain mb-6 drop-shadow-[0_0_15px_rgba(128,59,255,0.5)]"
              />
              <h1 className="text-3xl font-black tracking-tight mb-3">
                Welcome Back!
              </h1>
              <p className="text-sm leading-relaxed mb-8 text-white/70 max-w-[240px]">
                Already have an account? Sign in to continue building your
                architecture diagrams.
              </p>
              <button
                className="bg-transparent border-2 border-white/30 w-44 text-white hover:bg-white/10 hover:border-white/50 rounded-xl h-11 font-bold uppercase text-sm tracking-wide transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => animateAndNavigate(false, "/signin")}
              >
                Sign In
              </button>
            </div>

            {/* Right Panel — shown when Sign In is active → prompts to Sign Up */}
            <div
              className={`absolute top-0 right-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center transition-transform duration-700 ease-in-out
                ${isActive ? "translate-x-[20%]" : "translate-x-0"}`}
            >
              <img
                src="/logo.png"
                alt="DiagramSathi"
                className="h-20 w-auto object-contain mb-6 drop-shadow-[0_0_15px_rgba(128,59,255,0.5)]"
              />
              <h1 className="text-3xl font-black tracking-tight mb-3">
                Hello, Architect!
              </h1>
              <p className="text-sm leading-relaxed mb-8 text-white/70 max-w-[240px]">
                New here? Create an account and start turning ideas into
                professional diagrams.
              </p>
              <button
                className="bg-transparent border-2 border-white/30 w-44 text-white hover:bg-white/10 hover:border-white/50 rounded-xl h-11 font-bold uppercase text-sm tracking-wide transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => animateAndNavigate(true, "/signup")}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE TOGGLE */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center md:hidden z-50">
          <button
            onClick={() => {
              const next = !isActive;
              animateAndNavigate(next, next ? "/signup" : "/signin");
            }}
            className="text-[#803bff] hover:text-[#9b66ff] text-sm font-semibold transition-colors cursor-pointer"
          >
            {isActive
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
