/**
 * @file Button.tsx
 * @description Base UI Button component with "Ink & Gold" aesthetic.
 * Supports polymorphic rendering via the `as` prop.
 * @module app/components/ui/Button
 */

import {
  forwardRef,
  type ReactNode,
  type ElementType,
  type ComponentPropsWithRef,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "choice" | "outline" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

// Base props for Button
export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  children?: ReactNode;
  as?: ElementType;
}

// Combined props type
export type ButtonProps<E extends ElementType = "button"> = ButtonOwnProps &
  Omit<ComponentPropsWithRef<E>, keyof ButtonOwnProps>;

const baseStyles =
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-text-primary text-bg-primary hover:bg-text-secondary hover:shadow-lg hover:shadow-accent/20 border border-transparent font-serif tracking-wide",
  secondary:
    "bg-bg-secondary text-text-primary border border-border hover:border-accent hover:text-accent font-sans",
  ghost:
    "bg-transparent hover:bg-accent/5 text-text-secondary hover:text-accent",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/10",
  choice:
    "w-full text-left justify-start border border-border bg-surface hover:border-accent hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group font-serif text-lg py-4 px-6 text-text-primary active:scale-[0.99]",
  outline:
    "border border-border bg-transparent hover:border-accent hover:text-accent text-text-primary",
  link: "text-accent underline-offset-4 hover:underline p-0 h-auto font-serif",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-base gap-2",
  lg: "px-8 py-3.5 text-lg gap-2.5",
  icon: "h-10 w-10 p-0",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Button = forwardRef<any, ButtonProps<any>>(function Button(
  {
    as: Component = "button",
    variant = "primary" as ButtonVariant,
    size = "md" as ButtonSize,
    loading = false,
    icon,
    iconPosition = "left",
    fullWidth = false,
    disabled,
    className = "",
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const appliedSize = variant === "choice" || variant === "link" ? "" : sizeStyles[size as ButtonSize];

  const classes = cn(
    baseStyles,
    variantStyles[variant as ButtonVariant],
    appliedSize,
    fullWidth ? "w-full" : "",
    className
  );

  // Only pass disabled prop to actual button elements
  const elementProps = Component === "button" ? { disabled: isDisabled } : {};

  return (
    <Component
      ref={ref}
      className={classes}
      {...elementProps}
      {...props}
    >
      {loading && (
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

      {!loading && icon && iconPosition === "left" && icon}

      {variant === "choice" && (
        <>
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
           <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      )}

      {children}

      {!loading && icon && iconPosition === "right" && icon}
    </Component>
  );
});

Button.displayName = "Button";

export default Button;
