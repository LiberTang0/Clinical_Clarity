import { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  href,
  icon,
  fullWidth,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-3 font-headline font-black uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-container shadow-md hover:shadow-xl hover:-translate-y-0.5 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-[#c2c9f0] shadow-md hover:shadow-xl hover:-translate-y-0.5 border-b-4 border-[#8e95b8] active:border-b-0 active:translate-y-1",
    tertiary: "bg-tertiary text-on-tertiary hover:bg-tertiary-container shadow-md hover:shadow-xl hover:-translate-y-0.5 border-b-4 border-red-900 active:border-b-0 active:translate-y-1",
    outline: "bg-transparent text-on-surface border-2 border-outline hover:border-primary hover:text-primary hover:bg-primary-fixed/20 active:bg-primary-fixed/40",
    ghost: "bg-transparent text-primary hover:bg-primary-fixed/30 active:bg-primary-fixed/50"
  };

  const sizes = {
    sm: "text-sm px-4 py-2 rounded-md",
    md: "text-base px-6 py-3 rounded-lg",
    lg: "text-lg md:text-xl px-8 py-4 rounded-xl",
    xl: "text-xl md:text-3xl px-8 py-6 md:px-12 md:py-8 rounded-2xl"
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`;

  if (href) {
    if (disabled) {
      return (
        <span className={`${combinedClassName} opacity-50 cursor-not-allowed`}>
          {children}
          {icon}
        </span>
      );
    }
    return (
      <Link to={href} className={combinedClassName}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} disabled={disabled} {...props}>
      {children}
      {icon}
    </button>
  );
}
