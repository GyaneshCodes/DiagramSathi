import { useState, type FormEvent } from "react";
import { Mail, Lock, User } from "lucide-react";
import {
  InputField,
  Button,
  SocialButton,
  Divider,
  GoogleIcon,
} from "../components/AuthComponents/AuthComponent";
import { supabase } from "../lib/supabase";

const SignUpForm = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (signUpError) throw signUpError;

      // Supabase sends a confirmation email by default.
      // The auth state change listener in AuthContext handles session + redirect.
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/home" },
    });
    if (error) setError(error.message);
  };

  if (success) {
    return (
      <div className="w-full max-w-[320px] text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2 text-neutral">
          Check Your Email
        </h2>
        <p className="text-sm text-neutral/40 leading-relaxed">
          We sent a confirmation link to{" "}
          <span className="text-primary font-medium">{email}</span>. Click the
          link to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form className="w-full max-w-[320px]" onSubmit={handleSignUp}>
      <h1 className="text-3xl font-black tracking-tight mb-1 text-neutral">
        Create Account
      </h1>
      <p className="text-xs text-neutral/40 mt-1 mb-6">
        Start building diagrams in seconds
      </p>

      <SocialButton onClick={handleGoogleSignUp} icon={<GoogleIcon />}>
        Continue with Google
      </SocialButton>

      <Divider />

      <InputField
        type="text"
        placeholder="Display Name"
        icon={User}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
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

      <div className="mt-5">
        <Button disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </div>

      <p className="text-[11px] text-neutral/25 text-center mt-4 leading-relaxed">
        By signing up, you agree to our{" "}
        <a
          href="#"
          className="text-primary/70 hover:text-primary transition-colors"
        >
          Terms
        </a>{" "}
        &{" "}
        <a
          href="#"
          className="text-primary/70 hover:text-primary transition-colors"
        >
          Privacy Policy
        </a>
      </p>
    </form>
  );
};

export default SignUpForm;
