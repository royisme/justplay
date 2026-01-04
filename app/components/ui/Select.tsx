/**
 * @file Select.tsx
 * @description Base UI Select component with variants and sizes.
 * @module app/components/ui/Select
 */

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";

// --- Types ---

export type SelectVariant = "default" | "ghost";
export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  variant?: SelectVariant;
  size?: SelectSize;
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  children?: ReactNode;
}

// --- Utility ---

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// --- Styles ---

const baseStyles =
  "appearance-none bg-background-primary border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const variantStyles: Record<SelectVariant, string> = {
  default:
    "border-border focus:border-accent focus:ring-accent/20 text-text-primary",
  ghost:
    "border-transparent hover:border-border focus:border-accent focus:ring-accent/20 text-text-primary bg-transparent",
};

const sizeStyles: Record<SelectSize, string> = {
  sm: "px-2.5 py-1.5 text-sm pr-8",
  md: "px-3 py-2.5 text-base pr-10",
  lg: "px-4 py-3.5 text-lg pr-12",
};

// --- Component ---

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = "default",
      size = "md",
      label,
      error,
      options,
      placeholder,
      fullWidth = false,
      disabled,
      className = "",
      children,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;

    const selectClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "",
      fullWidth ? "w-full" : "",
      className
    );

    return (
      <div className={cn("relative", fullWidth && "w-full")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
          </label>
        )}

        {/* Select wrapper for custom arrow */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={selectClasses}
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Render options if provided */}
            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

            {/* Or render children */}
            {children}
          </select>

          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary">
            <svg
              className={cn(
                "fill-current",
                size === "sm" && "h-3 w-3",
                size === "md" && "h-4 w-4",
                size === "lg" && "h-5 w-5"
              )}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
