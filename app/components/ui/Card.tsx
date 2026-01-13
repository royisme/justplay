/**
 * @file Card.tsx
 * @description Base UI Card component with variants and slots.
 * @module app/components/ui/Card
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "paper";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-surface border border-border/60 shadow-sm",
  outlined: "bg-transparent border border-border",
  elevated: "bg-surface shadow-lg border border-border/20",
  paper:
    "bg-background-primary border border-border shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-300",
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mb-4 border-b border-border/40 pb-4 font-serif text-lg font-semibold text-text-primary",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex-1 text-text-secondary leading-relaxed", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-6 border-t border-border/40 pt-4 flex items-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("text-sm text-text-muted", className)} {...props}>
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

export default Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Content: CardContent,
  Title: CardTitle,
  Description: CardDescription,
});
