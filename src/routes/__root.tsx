import React from "react";
import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { motion, AnimatePresence } from "framer-motion";
import type { AudioManager } from "@/audio/AudioManager";

// Context for sharing audioManager across routes
interface RouterContext {
  audioManager: AudioManager;
}

// Create the root route with context
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  validateSearch: (
    search: Record<string, unknown>
  ): { transition?: string } => ({
    transition: search.transition as string | undefined,
  }),
});

// Transition variants for Framer Motion
const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideLeft: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  slideRight: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  slideUp: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  slideDown: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  zoomOut: {
    initial: { scale: 1.2, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 },
  },
};

function RootComponent() {
  const location = useLocation();
  const search = useSearch({ from: Route.id });

  // Get transition type from validated search params
  const transitionType = search.transition;
  const variants =
    transitionVariants[transitionType as keyof typeof transitionVariants] ||
    transitionVariants.fade;

  return (
    <div className="fixed inset-0 overflow-hidden bg-surface-primary">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Development tools */}
      {/* {process.env.NODE_ENV === "development" && (
        <TanStackRouterDevtools position="bottom-right" />
      )} */}
    </div>
  );
}
