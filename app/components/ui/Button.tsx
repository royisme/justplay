/**
 * @file Button.tsx
 * @description Base UI Button component with variants and sizes.
 * @module app/components/ui/Button
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "choice" | "outline" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary hover:bg-primary/90 text-background-primary shadow-md border border-transparent font-sans",
  secondary:
    "bg-secondary/10 hover:bg-secondary/20 text-text-primary border border-secondary/20 font-sans",
  ghost:
    "bg-transparent hover:bg-accent/5 text-text-secondary hover:text-text-primary",
  danger:
    "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20",
  choice:
    "w-full text-left justify-start border border-border bg-surface hover:bg-accent/5 hover:border-accent hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group font-serif text-lg py-4 px-6 text-text-primary",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-base gap-2",
  lg: "px-6 py-4 text-lg gap-2.5",
  icon: "h-10 w-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      asChild = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    const appliedSize = variant === "choice" ? "" : sizeStyles[size];

    const classes = cn(
      baseStyles,
      variantStyles[variant],
      appliedSize,
      fullWidth ? "w-full" : "",
      className
    );

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {loading && !asChild && (
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!loading && icon && iconPosition === "left" && !asChild && icon}

        {variant === "choice" && !asChild && (
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
        )}

        {children}

        {!loading && icon && iconPosition === "right" && !asChild && icon}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export default Button;
