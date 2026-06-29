import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-ink"
            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            h-[46px] w-full px-3 rounded-xl
            bg-input-bg border border-[#D4DDD6]
            text-sm font-semibold text-ink placeholder:text-muted
            transition-colors duration-200
            focus:outline-none focus:border-green focus:ring-3 focus:ring-green/15
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red focus:border-red focus:ring-red/15" : ""}
            ${className}
          `}
          style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          {...props}
        />
        {error && (
          <p className="text-xs text-red font-semibold">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
