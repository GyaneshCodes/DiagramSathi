import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import {
  InputField,
  Button,
  SocialButton,
  Divider,
  GoogleIcon,
} from "../components/AuthComponents/AuthComponent";
import { supabase } from "../lib/supabase";

const SignInForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/home";

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/home" },
    });
    if (error) setError(error.message);
  };

  return (
    <form className="w-full max-w-[320px]" onSubmit={handleSignIn}>
      <h1 className="text-3xl font-black tracking-tight mb-1 text-[#f3f0ff]">
        Welcome Back
      </h1>
      <p className="text-xs text-white/40 mt-1 mb-6">
        Sign in to your workspace
      </p>

      <SocialButton onClick={handleGoogleSignIn} icon={<GoogleIcon />}>
        Continue with Google
      </SocialButton>

      <Divider />

      <InputField
        type="email"
        placeholder="Email"
        icon={Mail}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputField
        type="password"
        placeholder="Password"
        icon={Lock}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p className="text-xs text-red-400 font-medium mt-1">{error}</p>
      )}

      <a
        href="#"
        className="text-xs text-white/30 my-3 hover:text-[#803bff] transition-colors block text-right"
      >
        Forgot password?
      </a>

      <div className="mt-3">
        <Button disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </div>
    </form>
  );
};

export default SignInForm;
