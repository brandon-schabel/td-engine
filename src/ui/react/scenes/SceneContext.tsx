import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TransitionType } from './SceneTransition';

export interface SceneTransitionOptions {
  type?: TransitionType;
  duration?: number;
  easing?: string;
}

interface SceneContextValue {
  currentScene: string | null;
  previousScene: string | null;
  isTransitioning: boolean;
  transitionOptions: SceneTransitionOptions | null;
  switchToScene: (sceneName: string, options?: SceneTransitionOptions) => Promise<void>;
  goBack: () => Promise<void>;
}

const SceneContext = createContext<SceneContextValue | undefined>(undefined);

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
};

interface SceneProviderProps {
  children: ReactNode;
  initialScene?: string;
  onSceneChange?: (from: string | null, to: string) => void;
}

export const SceneProvider: React.FC<SceneProviderProps> = ({
  children,
  initialScene = 'mainMenu',
  onSceneChange
}) => {
  const [currentScene, setCurrentScene] = useState<string | null>(initialScene);
  const [previousScene, setPreviousScene] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOptions, setTransitionOptions] = useState<SceneTransitionOptions | null>(null);
  const [sceneHistory, setSceneHistory] = useState<string[]>([initialScene]);

  const switchToScene = useCallback(async (
    sceneName: string,
    options: SceneTransitionOptions = { type: TransitionType.FADE }
  ) => {
    if (isTransitioning || sceneName === currentScene) return;

    setIsTransitioning(true);
    setTransitionOptions(options);

    // Store previous scene
    setPreviousScene(currentScene);

    // Update history
    setSceneHistory(prev => [...prev, sceneName]);

    // Notify change handler
    if (onSceneChange) {
      onSceneChange(currentScene, sceneName);
    }

    // Small delay to ensure transition state is set
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update current scene
    setCurrentScene(sceneName);

    // Wait for transition duration
    const duration = options.duration || 300;
    await new Promise(resolve => setTimeout(resolve, duration));

    setIsTransitioning(false);
    setTransitionOptions(null);
  }, [currentScene, isTransitioning, onSceneChange]);

  const goBack = useCallback(async () => {
    if (sceneHistory.length <= 1) return;

    const newHistory = [...sceneHistory];
    newHistory.pop(); // Remove current scene
    const prevScene = newHistory[newHistory.length - 1];

    if (prevScene) {
      setSceneHistory(newHistory);
      await switchToScene(prevScene, { type: TransitionType.SLIDE_RIGHT });
    }
  }, [sceneHistory, switchToScene]);

  const value: SceneContextValue = {
    currentScene,
    previousScene,
    isTransitioning,
    transitionOptions,
    switchToScene,
    goBack
  };

  return (
    <SceneContext.Provider value={value}>
      {children}
    </SceneContext.Provider>
  );
};