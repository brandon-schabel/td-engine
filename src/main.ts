import { Game } from './core/Game';
import { TowerType } from './entities/Tower';
import { UpgradeType } from './systems/TowerUpgradeManager';
import { PlayerUpgradeType } from './entities/Player';

// Get canvas element
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Set canvas size
canvas.width = 800;
canvas.height = 608; // 19 cells * 32px

// Create game instance
const game = new Game(canvas);

// Add mouse event handlers
canvas.addEventListener('click', (e) => {
  game.handleMouseClick(e);
});

canvas.addEventListener('mousemove', (e) => {
  game.handleMouseMove(e);
});

// Add keyboard controls
document.addEventListener('keydown', (e) => {
  // Forward movement keys to game
  game.handleKeyDown(e.key);
  
  switch (e.key) {
    case ' ':
      e.preventDefault();
      // Toggle pause/resume
      if (game.isPaused()) {
        game.resume();
      } else {
        game.pause();
      }
      break;
    case 'Enter':
      e.preventDefault();
      if (game.isWaveComplete() && !game.isGameOver()) {
        game.startNextWave();
      }
      break;
    case '1':
      game.setSelectedTowerType(TowerType.BASIC);
      break;
    case '2':
      game.setSelectedTowerType(TowerType.SNIPER);
      break;
    case '3':
      game.setSelectedTowerType(TowerType.RAPID);
      break;
    case 'Escape':
      game.setSelectedTowerType(null);
      break;
    case 'u':
    case 'U':
      // Toggle player upgrade panel
      if (playerUpgradeContainer.style.display === 'block') {
        playerUpgradeContainer.style.display = 'none';
      } else {
        playerUpgradeContainer.style.display = 'block';
        updatePlayerUpgradePanel();
      }
      break;
  }
});

document.addEventListener('keyup', (e) => {
  // Forward movement keys to game
  game.handleKeyUp(e.key);
});

// Listen for player clicks
document.addEventListener('playerClicked', () => {
  playerUpgradeContainer.style.display = 'block';
  updatePlayerUpgradePanel();
});

// Create UI elements
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  // Add control instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  instructions.innerHTML = `
    <div><strong>Controls:</strong></div>
    <div>WASD/Arrows - Move Player</div>
    <div>U - Player Upgrades</div>
    <div>1 - Basic Tower ($20)</div>
    <div>2 - Sniper Tower ($50)</div>
    <div>3 - Rapid Tower ($30)</div>
    <div>Enter - Start Next Wave</div>
    <div>Space - Pause/Resume</div>
    <div>ESC - Cancel Selection</div>
  `;
  gameContainer.appendChild(instructions);

  // Add tower selection buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    gap: 10px;
  `;

  const createTowerButton = (name: string, type: TowerType, cost: number) => {
    const button = document.createElement('button');
    button.textContent = `${name} ($${cost})`;
    button.style.cssText = `
      padding: 10px 15px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;
    button.addEventListener('click', () => {
      game.setSelectedTowerType(type);
      button.style.background = '#45a049';
      setTimeout(() => {
        button.style.background = '#4CAF50';
      }, 200);
    });
    return button;
  };

  buttonContainer.appendChild(createTowerButton('Basic', TowerType.BASIC, 20));
  buttonContainer.appendChild(createTowerButton('Sniper', TowerType.SNIPER, 50));
  buttonContainer.appendChild(createTowerButton('Rapid', TowerType.RAPID, 30));

  // Player upgrades button
  const playerUpgradeButton = document.createElement('button');
  playerUpgradeButton.textContent = 'Player Upgrades';
  playerUpgradeButton.style.cssText = `
    padding: 10px 15px;
    background: #9C27B0;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  playerUpgradeButton.addEventListener('click', () => {
    playerUpgradeContainer.style.display = 'block';
    updatePlayerUpgradePanel(); // Refresh the panel when opened
  });
  buttonContainer.appendChild(playerUpgradeButton);

  // Start wave button
  const startWaveButton = document.createElement('button');
  startWaveButton.textContent = 'Start Wave';
  startWaveButton.style.cssText = `
    padding: 10px 15px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  startWaveButton.addEventListener('click', () => {
    if (game.isWaveComplete() && !game.isGameOver()) {
      game.startNextWave();
    }
  });
  buttonContainer.appendChild(startWaveButton);

  gameContainer.appendChild(buttonContainer);

  // Add upgrade panel
  const upgradeContainer = document.createElement('div');
  upgradeContainer.style.cssText = `
    position: absolute;
    top: 150px;
    right: 10px;
    display: none;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #666;
    border-radius: 5px;
    padding: 10px;
    color: white;
    font-family: Arial, sans-serif;
    min-width: 200px;
  `;
  upgradeContainer.id = 'upgrade-panel';

  const createUpgradeButton = (name: string, type: UpgradeType) => {
    const button = document.createElement('button');
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 5px 0;
      padding: 8px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    `;
    
    let upgrading = false; // Prevent double-clicks
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (upgrading || button.disabled) {
        return;
      }
      
      const selectedTower = game.getSelectedTower();
      if (selectedTower) {
        upgrading = true;
        const success = game.upgradeTower(selectedTower, type);
        
        if (success) {
          updateUpgradePanel(); // Refresh the panel
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          upgrading = false;
        }, 100);
      }
    });
    return button;
  };

  const damageUpgradeBtn = createUpgradeButton('Upgrade Damage', UpgradeType.DAMAGE);
  const rangeUpgradeBtn = createUpgradeButton('Upgrade Range', UpgradeType.RANGE);
  const fireRateUpgradeBtn = createUpgradeButton('Upgrade Fire Rate', UpgradeType.FIRE_RATE);

  upgradeContainer.appendChild(damageUpgradeBtn);
  upgradeContainer.appendChild(rangeUpgradeBtn);
  upgradeContainer.appendChild(fireRateUpgradeBtn);

  const closeUpgradeBtn = document.createElement('button');
  closeUpgradeBtn.textContent = 'Close';
  closeUpgradeBtn.style.cssText = `
    display: block;
    width: 100%;
    margin: 10px 0 5px 0;
    padding: 8px;
    background: #666;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  `;
  closeUpgradeBtn.addEventListener('click', () => {
    upgradeContainer.style.display = 'none';
  });
  upgradeContainer.appendChild(closeUpgradeBtn);

  gameContainer.appendChild(upgradeContainer);

  // Add player upgrade panel (initially hidden)
  const playerUpgradeContainer = document.createElement('div');
  playerUpgradeContainer.style.cssText = `
    position: absolute;
    top: 200px;
    left: 10px;
    display: none;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #666;
    border-radius: 5px;
    padding: 10px;
    color: white;
    font-family: Arial, sans-serif;
    min-width: 180px;
  `;
  playerUpgradeContainer.id = 'player-upgrade-panel';

  const createPlayerUpgradeButton = (name: string, type: PlayerUpgradeType) => {
    const button = document.createElement('button');
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 3px 0;
      padding: 6px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    `;
    
    let upgrading = false; // Prevent double-clicks
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (upgrading || button.disabled) {
        return;
      }
      
      upgrading = true;
      const success = game.upgradePlayer(type);
      
      if (success) {
        updatePlayerUpgradePanel(); // Refresh the panel
      }
      
      // Reset flag after a short delay
      setTimeout(() => {
        upgrading = false;
      }, 100);
    });
    return button;
  };

  const playerDamageUpgradeBtn = createPlayerUpgradeButton('Damage', PlayerUpgradeType.DAMAGE);
  const playerSpeedUpgradeBtn = createPlayerUpgradeButton('Speed', PlayerUpgradeType.SPEED);
  const playerFireRateUpgradeBtn = createPlayerUpgradeButton('Fire Rate', PlayerUpgradeType.FIRE_RATE);
  const playerHealthUpgradeBtn = createPlayerUpgradeButton('Health', PlayerUpgradeType.HEALTH);

  const playerTitle = document.createElement('div');
  playerTitle.textContent = 'Player Upgrades';
  playerTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #4CAF50;';

  const closePlayerUpgradeBtn = document.createElement('button');
  closePlayerUpgradeBtn.textContent = 'Close';
  closePlayerUpgradeBtn.style.cssText = `
    display: block;
    width: 100%;
    margin: 10px 0 5px 0;
    padding: 6px;
    background: #666;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
  `;
  closePlayerUpgradeBtn.addEventListener('click', () => {
    playerUpgradeContainer.style.display = 'none';
  });

  playerUpgradeContainer.appendChild(playerTitle);
  playerUpgradeContainer.appendChild(playerDamageUpgradeBtn);
  playerUpgradeContainer.appendChild(playerSpeedUpgradeBtn);
  playerUpgradeContainer.appendChild(playerFireRateUpgradeBtn);
  playerUpgradeContainer.appendChild(playerHealthUpgradeBtn);
  playerUpgradeContainer.appendChild(closePlayerUpgradeBtn);

  gameContainer.appendChild(playerUpgradeContainer);

  // Function to update upgrade panel
  function updateUpgradePanel() {
    const selectedTower = game.getSelectedTower();
    if (selectedTower) {
      upgradeContainer.style.display = 'block';
      
      // Update damage button
      const damageCost = game.getUpgradeCost(selectedTower, UpgradeType.DAMAGE);
      const damageLevel = selectedTower.getUpgradeLevel(UpgradeType.DAMAGE);
      const canUpgradeDamage = selectedTower.canUpgrade(UpgradeType.DAMAGE) && game.canAffordUpgrade(selectedTower, UpgradeType.DAMAGE);
      
      damageUpgradeBtn.textContent = `Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})`;
      damageUpgradeBtn.style.background = canUpgradeDamage ? '#4CAF50' : '#666';
      damageUpgradeBtn.disabled = !canUpgradeDamage;
      
      // Update range button
      const rangeCost = game.getUpgradeCost(selectedTower, UpgradeType.RANGE);
      const rangeLevel = selectedTower.getUpgradeLevel(UpgradeType.RANGE);
      const canUpgradeRange = selectedTower.canUpgrade(UpgradeType.RANGE) && game.canAffordUpgrade(selectedTower, UpgradeType.RANGE);
      
      rangeUpgradeBtn.textContent = `Range Lv.${rangeLevel}/5 (${rangeCost > 0 ? `$${rangeCost}` : 'MAX'})`;
      rangeUpgradeBtn.style.background = canUpgradeRange ? '#4CAF50' : '#666';
      rangeUpgradeBtn.disabled = !canUpgradeRange;
      
      // Update fire rate button
      const fireRateCost = game.getUpgradeCost(selectedTower, UpgradeType.FIRE_RATE);
      const fireRateLevel = selectedTower.getUpgradeLevel(UpgradeType.FIRE_RATE);
      const canUpgradeFireRate = selectedTower.canUpgrade(UpgradeType.FIRE_RATE) && game.canAffordUpgrade(selectedTower, UpgradeType.FIRE_RATE);
      
      fireRateUpgradeBtn.textContent = `Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})`;
      fireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#4CAF50' : '#666';
      fireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    } else {
      upgradeContainer.style.display = 'none';
    }
  }

  // Function to update player upgrade panel
  function updatePlayerUpgradePanel() {
    // Only update if panel is visible
    if (playerUpgradeContainer.style.display !== 'block') {
      return;
    }
    
    const player = game.getPlayer();
    
    // Update damage button
    const damageCost = game.getPlayerUpgradeCost(PlayerUpgradeType.DAMAGE);
    const damageLevel = player.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const canUpgradeDamage = player.canUpgrade(PlayerUpgradeType.DAMAGE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.DAMAGE);
    
    playerDamageUpgradeBtn.textContent = `Damage Lv.${damageLevel}/5 (${damageCost > 0 ? `$${damageCost}` : 'MAX'})`;
    playerDamageUpgradeBtn.style.background = canUpgradeDamage ? '#2196F3' : '#666';
    playerDamageUpgradeBtn.disabled = !canUpgradeDamage;
    
    // Update speed button
    const speedCost = game.getPlayerUpgradeCost(PlayerUpgradeType.SPEED);
    const speedLevel = player.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const canUpgradeSpeed = player.canUpgrade(PlayerUpgradeType.SPEED) && game.canAffordPlayerUpgrade(PlayerUpgradeType.SPEED);
    
    playerSpeedUpgradeBtn.textContent = `Speed Lv.${speedLevel}/5 (${speedCost > 0 ? `$${speedCost}` : 'MAX'})`;
    playerSpeedUpgradeBtn.style.background = canUpgradeSpeed ? '#2196F3' : '#666';
    playerSpeedUpgradeBtn.disabled = !canUpgradeSpeed;
    
    // Update fire rate button
    const fireRateCost = game.getPlayerUpgradeCost(PlayerUpgradeType.FIRE_RATE);
    const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const canUpgradeFireRate = player.canUpgrade(PlayerUpgradeType.FIRE_RATE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.FIRE_RATE);
    
    playerFireRateUpgradeBtn.textContent = `Fire Rate Lv.${fireRateLevel}/5 (${fireRateCost > 0 ? `$${fireRateCost}` : 'MAX'})`;
    playerFireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#2196F3' : '#666';
    playerFireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    
    // Update health button
    const healthCost = game.getPlayerUpgradeCost(PlayerUpgradeType.HEALTH);
    const healthLevel = player.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const canUpgradeHealth = player.canUpgrade(PlayerUpgradeType.HEALTH) && game.canAffordPlayerUpgrade(PlayerUpgradeType.HEALTH);
    
    playerHealthUpgradeBtn.textContent = `Health Lv.${healthLevel}/5 (${healthCost > 0 ? `$${healthCost}` : 'MAX'})`;
    playerHealthUpgradeBtn.style.background = canUpgradeHealth ? '#2196F3' : '#666';
    playerHealthUpgradeBtn.disabled = !canUpgradeHealth;
  }

  // Update upgrade panels periodically
  setInterval(() => {
    updateUpgradePanel();
    updatePlayerUpgradePanel();
  }, 100);
}

console.log('Tower Defense Game Loaded!');
console.log('Use WASD or Arrow keys to move your character.');
console.log('Press U or click on your character to open player upgrades.');
console.log('Press 1, 2, or 3 to select towers, then click to place them.');
console.log('Click on towers to upgrade them.');
console.log('Your character automatically shoots at nearby enemies!');
console.log('Press Enter to start the first wave.');