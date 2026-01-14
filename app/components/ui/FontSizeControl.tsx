/**
 * @file FontSizeControl.tsx
 * @description 字号调节控件，支持小/中/大三档字号切换
 * @module app/components/ui/FontSizeControl
 */

import { useState, useEffect } from "react";

type FontSize = "small" | "medium" | "large";

const FONT_SCALE_MAP: Record<FontSize, number> = {
  small: 0.875,   // 14px 基准
  medium: 1,      // 16px 基准
  large: 1.125,   // 18px 基准
};

const STORAGE_KEY = "reading-font-size";

export function FontSizeControl() {
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as FontSize) || "medium";
    }
    return "medium";
  });

  useEffect(() => {
    const scale = FONT_SCALE_MAP[fontSize];
    document.documentElement.style.setProperty("--text-scale", scale.toString());
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary font-sans">字号</span>
      <div className="flex items-center gap-1 border border-border rounded-lg p-1">
        <button
          type="button"
          onClick={() => setFontSize("small")}
          className={`
            px-3 py-1.5 text-sm font-sans rounded-md transition-colors
            ${fontSize === "small" 
              ? "bg-accent text-bg-primary" 
              : "text-text-secondary hover:bg-bg-secondary"
            }
          `}
          aria-label="小字号"
        >
          小
        </button>
        <button
          type="button"
          onClick={() => setFontSize("medium")}
          className={`
            px-3 py-1.5 text-sm font-sans rounded-md transition-colors
            ${fontSize === "medium" 
              ? "bg-accent text-bg-primary" 
              : "text-text-secondary hover:bg-bg-secondary"
            }
          `}
          aria-label="中字号"
        >
          中
        </button>
        <button
          type="button"
          onClick={() => setFontSize("large")}
          className={`
            px-3 py-1.5 text-sm font-sans rounded-md transition-colors
            ${fontSize === "large" 
              ? "bg-accent text-bg-primary" 
              : "text-text-secondary hover:bg-bg-secondary"
            }
          `}
          aria-label="大字号"
        >
          大
        </button>
      </div>
    </div>
  );
}

export default FontSizeControl;
