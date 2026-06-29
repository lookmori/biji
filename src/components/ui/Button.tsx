import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-green-dark text-white hover:bg-[#205541] hover:-translate-y-0.5 shadow-m hover:shadow-l",
  secondary:
    "bg-white text-ink border border-[#D2DBD4] hover:bg-[#EDF3EE]",
  danger:
    "bg-red text-white hover:bg-[#A64036] hover:-translate-y-0.5",
  ghost:
    "text-muted hover:text-ink hover:bg-green-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-lg gap-1.5",
  md: "h-[46px] px-5 text-sm rounded-xl gap-2",
  lg: "h-[52px] px-7 text-sm rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-bold
          transition-all duration-200
          focus:outline-none focus-visible:outline-3 focus-visible:outline-green/25 focus-visible:outline-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
