/**
 * Example usage of the expanded gameStore for multiplayer readiness
 */

import { gameStore, subscribeToResources, subscribeToPlayerStats } from './gameStore';

// Example 1: Basic usage
function gameExample() {
  const state = gameStore.getState();
  
  // Start the game
  state.setGameState('PLAYING');
  
  // Handle enemy kills with rewards
  state.recordEnemyKill('goblin', 10);
  state.recordEnemyKill('orc', 25);
  
  // Handle tower building
  state.recordTowerBuilt('cannon');
  
  // Player progression
  state.addExperience(150); // Will auto-level up
  
  // Wave management
  state.startWave(1);
  state.setEnemiesRemaining(20);
  
  // End wave when all enemies defeated
  state.endWave();
}

// Example 2: Selective subscriptions for UI components
function ResourceDisplay() {
  // Only re-render when resources change
  const unsubscribe = subscribeToResources((currency, lives, score) => {
    console.log(`Currency: ${currency}, Lives: ${lives}, Score: ${score}`);
  });
  
  // Clean up subscription
  return unsubscribe;
}

// Example 3: Player stats UI
function PlayerStatsDisplay() {
  const unsubscribe = subscribeToPlayerStats((level, exp, nextExp, health, maxHealth) => {
    console.log(`Level ${level} - EXP: ${exp}/${nextExp}`);
    console.log(`Health: ${health}/${maxHealth}`);
  });
  
  return unsubscribe;
}

// Example 4: Serializing for multiplayer/save
function getSerializableState() {
  const state = gameStore.getState();
  
  // Extract only the data needed for multiplayer sync
  return {
    gameState: state.gameState,
    resources: {
      currency: state.currency,
      lives: state.lives,
      score: state.score
    },
    player: {
      level: state.playerLevel,
      experience: state.playerExperience,
      nextLevelExp: state.playerNextLevelExp,
      health: state.playerHealth,
      maxHealth: state.playerMaxHealth
    },
    wave: {
      current: state.currentWave,
      isActive: state.isWaveActive,
      enemiesRemaining: state.enemiesRemaining
    },
    stats: state.stats
  };
}

// Example 5: Handling game over
function handleEnemyReachedEnd() {
  const state = gameStore.getState();
  
  state.loseLife(1);
  
  // The store automatically handles game over when lives reach 0
  if (state.isAlive()) {
    console.log(`Lives remaining: ${state.lives}`);
  } else {
    console.log('Game Over!');
    // The gameState is automatically set to 'GAME_OVER'
  }
}

// Example 6: Complete game flow
function completeGameFlow() {
  const state = gameStore.getState();
  
  // Start from menu
  state.resetGame();
  
  // Player starts game
  state.setGameState('PLAYING');
  
  // First wave
  state.startWave(1);
  
  // Simulate gameplay
  for (let i = 0; i < 10; i++) {
    state.recordEnemyKill('goblin', 10);
    state.recordDamageDealt(50);
  }
  
  state.endWave();
  
  // Check stats
  const stats = state.stats;
  console.log(`Wave ${state.currentWave} complete!`);
  console.log(`Enemies killed: ${stats.enemiesKilled}`);
  console.log(`Total damage: ${stats.totalDamageDealt}`);
  console.log(`Currency earned: ${stats.totalCurrencyEarned}`);
  
  // Save game state for multiplayer sync
  const gameData = getSerializableState();
  // Send gameData to server/other players
}