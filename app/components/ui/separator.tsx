import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(
  (
    { className, orientation = "horizontal", ...props },
    ref
  ) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border/40",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
