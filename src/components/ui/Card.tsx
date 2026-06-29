import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "md", hover = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-white rounded-2xl border border-line
          ${paddingClasses[padding]}
          ${hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-l hover:border-[#9FB5A7]" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
