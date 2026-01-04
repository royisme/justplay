/**
 * @file Input.tsx
 * @description Base UI Input component with variants and states.
 * @module app/components/ui/Input
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

// --- Types ---

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// --- Utility ---

function cn(...classes: unknown[]): string {
  return classes
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .join(" ");
}

// --- Component ---

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hasError = Boolean(error);

    const inputClasses = cn(
      // Base styles
      "w-full bg-background-primary border rounded-lg px-3 py-2.5",
      "text-text-primary placeholder:text-text-secondary",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      // State styles
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-accent focus:ring-accent/20",
      // Disabled styles
      disabled && "opacity-50 cursor-not-allowed bg-background-secondary",
      // Icon padding
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className,
    );

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={inputClasses}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint text */}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-sm text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
