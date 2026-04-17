import { useState, type ChangeEvent, type ReactNode } from "react";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";

interface InputFieldProps {
  type: string;
  placeholder: string;
  icon: LucideIcon;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const InputField = ({
  type,
  placeholder,
  icon: Icon,
  value,
  onChange,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState("");

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isControlled) {
      onChange?.(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  const isPasswordField = type === "password";
  const hasValue = currentValue.length > 0;

  return (
    <div className="relative w-full my-3 group">
      <input
        type={isPasswordField && showPassword ? "text" : type}
        placeholder={placeholder}
        required
        value={currentValue}
        onChange={handleChange}
        className="w-full py-3.5 px-4 bg-[#12101a] border border-white/10 rounded-xl outline-none text-sm font-medium text-[#f3f0ff] placeholder-white/25 focus:border-[#803bff] focus:ring-1 focus:ring-[#803bff]/50 focus:shadow-[0_0_20px_-6px_rgba(128,59,255,0.3)] transition-all duration-300"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors duration-300 group-focus-within:text-[#803bff]/60">
        {isPasswordField ? (
          hasValue ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-[#803bff] transition-colors cursor-pointer"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          ) : (
            <Lock size={18} />
          )
        ) : (
          <Icon size={18} />
        )}
      </div>
    </div>
  );
};

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  type?: "submit" | "button" | "reset";
}

export const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "submit",
}: ButtonProps) => {
  const baseStyle =
    "w-full h-12 rounded-xl font-bold text-sm uppercase tracking-wide cursor-pointer transition-all duration-300 flex items-center justify-center";
  const variants: Record<string, string> = {
    primary:
      "bg-linear-to-r from-[#803bff] to-[#6025cc] text-[#f3f0ff] shadow-lg shadow-[#803bff]/20 hover:shadow-[#803bff]/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
    outline:
      "bg-transparent border border-white/20 text-[#f3f0ff] hover:bg-white/5 hover:border-white/30 backdrop-blur-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface SocialButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon: ReactNode;
  disabled?: boolean;
}

export const SocialButton = ({
  children,
  onClick,
  icon,
  disabled,
}: SocialButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full h-12 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-[#f3f0ff] hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    {children}
  </button>
);

export const Divider = () => (
  <div className="flex items-center gap-4 my-5">
    <div className="flex-1 h-px bg-white/10" />
    <span className="text-[11px] text-white/30 uppercase tracking-widest font-medium">
      or
    </span>
    <div className="flex-1 h-px bg-white/10" />
  </div>
);

export const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);
