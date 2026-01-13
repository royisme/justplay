/**
 * @file PageTransition.tsx
 * @description Page transition wrapper using Motion.
 * Provides smooth enter/exit animations for route changes.
 */

import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import type { TargetAndTransition, Transition } from "motion/react";

export type TransitionVariant =
  | "fade"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scale"
  | "blur";

interface VariantConfig {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
}

const variants: Record<TransitionVariant, VariantConfig> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(10px)" },
  },
};

export interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
  duration?: number;
  delay?: number;
}

export function PageTransition({
  children,
  variant = "fade",
  className = "",
  duration = 0.4,
  delay = 0,
}: PageTransitionProps) {
  const selectedVariant = variants[variant];

  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * PageTransitionWrapper - Wraps multiple pages with AnimatePresence
 * Use this at the layout level for route transitions
 */
export interface PageTransitionWrapperProps {
  children: ReactNode;
  pageKey: string;
  variant?: TransitionVariant;
  mode?: "sync" | "popLayout" | "wait";
}

export function PageTransitionWrapper({
  children,
  pageKey,
  variant = "fade",
  mode = "wait",
}: PageTransitionWrapperProps) {
  return (
    <AnimatePresence mode={mode}>
      <PageTransition key={pageKey} variant={variant}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
}

/**
 * MotionContainer - Flexible motion wrapper for any content
 */
export interface MotionContainerProps {
  children: ReactNode;
  className?: string;
  initial?: TargetAndTransition | boolean;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  transition?: Transition;
  whileHover?: TargetAndTransition;
  whileTap?: TargetAndTransition;
}

export function MotionContainer({
  children,
  className = "",
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.3 },
  whileHover,
  whileTap,
}: MotionContainerProps) {
  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      {children}
    </motion.div>
  );
}

/**
 * LoadingTransition - Animated loading state with shimmer effect
 */
export interface LoadingTransitionProps {
  isLoading: boolean;
  children: ReactNode;
  loadingContent?: ReactNode;
  className?: string;
}

export function LoadingTransition({
  isLoading,
  children,
  loadingContent,
  className = "",
}: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loadingContent || (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          className={className}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PageTransition;
