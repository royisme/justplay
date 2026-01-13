/**
 * @file scroll-area.tsx
 * @description ScrollArea component using Base UI with custom scrollbar styling.
 * @module app/components/ui/scroll-area
 */

import { forwardRef, type HTMLAttributes } from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "~/lib/utils";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the scrollable area
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal" | "both";
}

export interface ScrollBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Orientation of the scrollbar
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";
}

/**
 * ScrollArea - A scrollable container with custom scrollbar styling.
 *
 * Uses Base UI ScrollArea primitive with Tailwind styling.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = "vertical", children, ...props }, ref) => {
    const overflowClasses = {
      vertical: "[&>[data-scroll-area-viewport]]:overflow-y-auto [&>[data-scroll-area-viewport]]:overflow-x-hidden",
      horizontal: "[&>[data-scroll-area-viewport]]:overflow-x-auto [&>[data-scroll-area-viewport]]:overflow-y-hidden",
      both: "[&>[data-scroll-area-viewport]]:overflow-auto",
    };

    return (
      <BaseScrollArea.Root
        ref={ref}
        className={cn(
          "relative",
          overflowClasses[orientation],
          className
        )}
        {...props}
      >
        <BaseScrollArea.Viewport className="h-full w-full">
          {children}
        </BaseScrollArea.Viewport>
        {/* Vertical scrollbar */}
        {(orientation === "vertical" || orientation === "both") && (
          <BaseScrollArea.Scrollbar
            orientation="vertical"
            className={cn(
              "flex touch-none select-none p-0.5 transition-colors",
              "absolute right-0 top-0 h-full w-2.5",
              "bg-transparent hover:bg-border/30"
            )}
          >
            <BaseScrollArea.Thumb
              className={cn(
                "relative flex-1 rounded-full",
                "bg-border hover:bg-border/80"
              )}
            />
          </BaseScrollArea.Scrollbar>
        )}
        {/* Horizontal scrollbar */}
        {(orientation === "horizontal" || orientation === "both") && (
          <BaseScrollArea.Scrollbar
            orientation="horizontal"
            className={cn(
              "flex touch-none select-none p-0.5 transition-colors",
              "absolute bottom-0 left-0 h-2.5 w-full",
              "bg-transparent hover:bg-border/30"
            )}
          >
            <BaseScrollArea.Thumb
              className={cn(
                "relative flex-1 rounded-full",
                "bg-border hover:bg-border/80"
              )}
            />
          </BaseScrollArea.Scrollbar>
        )}
        {/* Corner for both scrollbars */}
        {orientation === "both" && (
          <BaseScrollArea.Corner className="bg-transparent" />
        )}
      </BaseScrollArea.Root>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

/**
 * ScrollBar - Standalone scrollbar component for use with ScrollArea.
 *
 * Note: This component is provided for API compatibility. When using the
 * ScrollArea component above, scrollbars are automatically included based
 * on the orientation prop. Use this only if you need a custom scrollbar setup.
 */
export const ScrollBar = forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = "vertical", ...props }, ref) => {
    return (
      <BaseScrollArea.Scrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
          "flex touch-none select-none p-0.5 transition-colors",
          orientation === "vertical"
            ? "absolute right-0 top-0 h-full w-2.5"
            : "absolute bottom-0 left-0 h-2.5 w-full",
          "bg-transparent hover:bg-border/30",
          className
        )}
        {...props}
      >
        <BaseScrollArea.Thumb
          className={cn(
            "relative flex-1 rounded-full",
            "bg-border hover:bg-border/80"
          )}
        />
      </BaseScrollArea.Scrollbar>
    );
  }
);

ScrollBar.displayName = "ScrollBar";

export default ScrollArea;
