import React from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AppUI } from "@/ui/react/AppUI";
import type { AudioManager } from "@/audio/AudioManager";

interface ReactAppProps {
  audioManager: AudioManager;
}

// Create router instance with context
const createAppRouter = (audioManager: AudioManager) => {
  return createRouter({
    routeTree,
    context: {
      audioManager,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    basepath: process.env.NODE_ENV === "production" ? "/td-engine" : "/",
  });
};

// Declare the router type
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}

export const ReactApp: React.FC<ReactAppProps> = ({ audioManager }) => {
  const router = React.useMemo(
    () => createAppRouter(audioManager),
    [audioManager]
  );

  // Handle quick start game event (F1 key)
  React.useEffect(() => {
    const handleQuickStart = () => {
      console.log("[ReactApp] Quick start game triggered");
      router.navigate({ to: "/game", search: {} });
    };

    window.addEventListener("quickStartGame", handleQuickStart);
    return () => window.removeEventListener("quickStartGame", handleQuickStart);
  }, [router]);

  return (
    <>
      {/* Router handles full-screen scenes */}
      <RouterProvider router={router} />

      {/* Game UI panels overlay on top */}
      <AppUI />
    </>
  );
};
