/**
 * @file AnimatedList.tsx
 * @description Animated list component with staggered entrance effects.
 * Used for choice options and menu items.
 */

import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

export interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  direction?: "up" | "down" | "left" | "right";
  mode?: "sync" | "popLayout" | "wait";
}

const directionOffsets = {
  up: { initial: { y: 20 }, exit: { y: -20 } },
  down: { initial: { y: -20 }, exit: { y: 20 } },
  left: { initial: { x: 20 }, exit: { x: -20 } },
  right: { initial: { x: -20 }, exit: { x: 20 } },
};

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = "",
  itemClassName = "",
  staggerDelay = 0.08,
  direction = "up",
  mode = "sync",
}: AnimatedListProps<T>) {
  const offsets = directionOffsets[direction];

  return (
    <div className={className}>
      <AnimatePresence mode={mode}>
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item, index)}
            className={itemClassName}
            initial={{
              opacity: 0,
              ...offsets.initial,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              ...offsets.exit,
            }}
            transition={{
              duration: 0.3,
              delay: index * staggerDelay,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * AnimatedItem - Single animated item with hover/tap effects
 */
export interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  hoverScale?: number;
  tapScale?: number;
}

export function AnimatedItem({
  children,
  className = "",
  onClick,
  disabled = false,
  selected = false,
  hoverScale = 1.02,
  tapScale = 0.98,
}: AnimatedItemProps) {
  return (
    <motion.div
      className={className}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: hoverScale }}
      whileTap={disabled ? undefined : { scale: tapScale }}
      animate={selected ? { scale: 1.02, boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.3)" } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInWhenVisible - Animates when element scrolls into view
 */
export interface FadeInWhenVisibleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInWhenVisible({
  children,
  className = "",
  delay = 0,
}: FadeInWhenVisibleProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedList;
