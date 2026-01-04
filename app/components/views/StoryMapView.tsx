/**
 * @file StoryMapView.tsx
 * @description Story map visualization component using Mermaid.js.
 * Renders the story structure as an interactive graph.
 * @module app/components/views/StoryMapView
 */

import { useRef, useEffect } from "react";
import mermaid from "mermaid";
import type { StoryMap } from "@shared/types/game";

// --- Types ---

export interface StoryMapViewProps {
  /** The story map data with nodes and edges */
  storyMap: StoryMap | null;
  /** Current active node ID */
  currentNodeId?: string;
  /** Whether the map panel is visible */
  isVisible?: boolean;
  /** Callback to close the map panel (mobile) */
  onClose?: () => void;
  /** Additional class names */
  className?: string;
}

// --- Component ---

export function StoryMapView({
  storyMap,
  currentNodeId = "start",
  isVisible = true,
  onClose,
  className = "",
}: StoryMapViewProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize and render Mermaid chart
  useEffect(() => {
    if (!isVisible || !mermaidRef.current || !storyMap?.nodes?.length) {
      return;
    }

    mermaid.initialize({
      startOnLoad: true,
      theme: "base",
      themeVariables: {
        primaryColor: "var(--accent)",
        primaryTextColor: "var(--foreground)",
        lineColor: "var(--foreground-secondary)",
      },
    });

    // Build Mermaid graph definition
    const nodes = storyMap.nodes
      .map(
        (n) =>
          `${n.id}["${n.label.replace(/"/g, "'")}"]` +
          (n.id === currentNodeId ? ":::current" : "")
      )
      .join("\n");

    const edges = storyMap.edges
      .map((e) => `${e.from} -->|"${e.label.replace(/"/g, "'")}"|${e.to}`)
      .join("\n");

    const graphDefinition = `
      graph TD
      ${nodes}
      ${edges}
      classDef current fill:var(--accent),stroke:var(--foreground),color:var(--background),stroke-width:2px;
    `;

    // Render the graph
    mermaid
      .render("mermaid-graph", graphDefinition)
      .then(({ svg }) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      })
      .catch((error) => {
        console.error("[StoryMapView] Mermaid render error:", error);
      });
  }, [isVisible, storyMap, currentNodeId]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`md:w-1/3 w-full bg-background-primary border-l border-border flex flex-col absolute md:static inset-0 z-20 ${className}`}
    >
      {/* Mobile header with close button */}
      <div className="p-4 border-b border-border flex justify-between items-center md:hidden">
        <h3 className="font-bold text-text-primary">Story Map</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close map"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Map container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-background-secondary/30">
        {storyMap?.nodes?.length ? (
          <div ref={mermaidRef} className="w-full h-full flex justify-center" />
        ) : (
          <p className="text-text-secondary italic">No story map available</p>
        )}
      </div>
    </div>
  );
}

export default StoryMapView;
