import { Game } from '../core/Game';
import { TowerType, UpgradeType } from '../entities/Tower';
import { PlayerUpgradeType } from '../entities/Player';
import { createSvgIcon, IconType } from './icons/SvgIcons';
import { AudioManager, SoundType } from '../audio/AudioManager';
import { PowerUpDisplay } from './components/game/PowerUpDisplay';
import { CameraControls } from './components/game/CameraControls';

export function setupGameUIRevamp(game: Game, audioManager: AudioManager) {
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;

  // Panel management
  let activePanel: HTMLElement | null = null;
  const panels: HTMLElement[] = [];
  let selectedTowerButton: HTMLElement | null = null;

  const togglePanel = (panel: HTMLElement) => {
    if (activePanel === panel) {
      panel.style.display = 'none';
      activePanel = null;
    } else {
      panels.forEach(p => p.style.display = 'none');
      panel.style.display = 'block';
      activePanel = panel;
    }
  };

  // Create bottom control bar
  const controlBar = document.createElement('div');
  controlBar.className = 'control-bar';
  controlBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
    border-top: 2px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 20px;
    z-index: 1000;
  `;

  // Create control buttons
  const createControlButton = (iconType: IconType, title: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.className = 'ui-button control-button icon-only';
    button.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid #FFD700;
      color: #FFD700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    const icon = createSvgIcon(iconType, { size: 24 });
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
  };

  // Create build panel (initially hidden)
  const buildPanel = document.createElement('div');
  buildPanel.className = 'ui-panel popup-panel';
  buildPanel.style.cssText = `
    position: absolute;
    bottom: 70px;
    left: 20px;
    min-width: 280px;
    display: none;
    animation: slideUp 0.2s ease-out;
  `;
  panels.push(buildPanel);

  // Build panel header
  const buildHeader = document.createElement('div');
  buildHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  `;

  const buildTitle = document.createElement('div');
  buildTitle.textContent = 'Build Menu';
  buildTitle.style.cssText = 'font-weight: bold; color: #4CAF50; font-size: 16px;';

  const closeBuildBtn = document.createElement('button');
  closeBuildBtn.className = 'ui-button icon-only';
  closeBuildBtn.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #4CAF50;
    color: #4CAF50;
  `;
  const closeIcon = createSvgIcon(IconType.CLOSE, { size: 16 });
  closeBuildBtn.innerHTML = closeIcon;
  closeBuildBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    buildPanel.style.display = 'none';
    activePanel = null;
  });

  buildHeader.appendChild(buildTitle);
  buildHeader.appendChild(closeBuildBtn);
  buildPanel.appendChild(buildHeader);

  // Tower grid
  const towerGrid = document.createElement('div');
  towerGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  `;

  const createTowerButton = (name: string, type: TowerType, cost: number, iconType: IconType) => {
    const button = document.createElement('button');
    button.className = 'ui-button tower-button has-icon';
    button.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      gap: 4px;
      min-height: 80px;
    `;
    
    const icon = createSvgIcon(iconType, { size: 32 });
    const text = `<div style="font-weight: bold;">${name}</div><div style="color: #FFD700;">$${cost}</div>`;
    button.innerHTML = `${icon}${text}`;
    
    button.addEventListener('click', () => {
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      // Update selection state
      if (selectedTowerButton) {
        selectedTowerButton.classList.remove('selected');
      }
      
      if (selectedTowerButton === button) {
        // Deselect if clicking the same button
        selectedTowerButton = null;
        game.setSelectedTowerType(null);
        audioManager.playUISound(SoundType.DESELECT);
      } else {
        // Select new tower type
        selectedTowerButton = button;
        button.classList.add('selected');
        game.setSelectedTowerType(type);
        audioManager.playUISound(SoundType.SELECT);
        // Auto-close build panel after selection
        buildPanel.style.display = 'none';
        activePanel = null;
      }
    });
    
    return button;
  };

  const basicTowerBtn = createTowerButton('Basic', TowerType.BASIC, 20, IconType.BASIC_TOWER);
  const sniperTowerBtn = createTowerButton('Sniper', TowerType.SNIPER, 50, IconType.SNIPER_TOWER);
  const rapidTowerBtn = createTowerButton('Rapid', TowerType.RAPID, 30, IconType.RAPID_TOWER);
  const wallBtn = createTowerButton('Wall', TowerType.WALL, 10, IconType.WALL);

  towerGrid.appendChild(basicTowerBtn);
  towerGrid.appendChild(sniperTowerBtn);
  towerGrid.appendChild(rapidTowerBtn);
  towerGrid.appendChild(wallBtn);
  buildPanel.appendChild(towerGrid);

  // Cancel selection button
  const cancelButton = document.createElement('button');
  cancelButton.className = 'ui-button close-button has-icon';
  const cancelIcon = createSvgIcon(IconType.CANCEL, { size: 14 });
  cancelButton.innerHTML = `${cancelIcon}<span class="button-text">Cancel Selection (ESC)</span>`;
  cancelButton.style.width = '100%';
  cancelButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (selectedTowerButton) {
      selectedTowerButton.classList.remove('selected');
      selectedTowerButton = null;
    }
    game.setSelectedTowerType(null);
    audioManager.playUISound(SoundType.DESELECT);
  });
  buildPanel.appendChild(cancelButton);

  gameContainer.appendChild(buildPanel);

  // Create tower upgrade panel (position-aware)
  const towerUpgradePanel = document.createElement('div');
  towerUpgradePanel.className = 'ui-panel popup-panel';
  towerUpgradePanel.style.cssText = `
    position: absolute;
    display: none;
    min-width: 200px;
    animation: slideUp 0.2s ease-out;
  `;
  
  // Tower upgrade header
  const towerUpgradeHeader = document.createElement('div');
  towerUpgradeHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  `;
  
  const towerUpgradeTitle = document.createElement('div');
  towerUpgradeTitle.textContent = 'Tower Upgrades';
  towerUpgradeTitle.style.cssText = 'font-weight: bold; color: #4CAF50;';
  
  const closeTowerUpgradeBtn = document.createElement('button');
  closeTowerUpgradeBtn.className = 'ui-button icon-only';
  closeTowerUpgradeBtn.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #4CAF50;
    color: #4CAF50;
  `;
  const closeTowerIcon = createSvgIcon(IconType.CLOSE, { size: 16 });
  closeTowerUpgradeBtn.innerHTML = closeTowerIcon;
  closeTowerUpgradeBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    towerUpgradePanel.style.display = 'none';
  });
  
  towerUpgradeHeader.appendChild(towerUpgradeTitle);
  towerUpgradeHeader.appendChild(closeTowerUpgradeBtn);
  towerUpgradePanel.appendChild(towerUpgradeHeader);
  
  // Add tower stats section
  const towerStatsSection = document.createElement('div');
  towerStatsSection.style.cssText = `
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #4CAF50;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;
  `;
  towerStatsSection.id = 'tower-stats-section';

  const towerStatsTitle = document.createElement('div');
  towerStatsTitle.textContent = 'Tower Stats';
  towerStatsTitle.style.cssText = 'font-weight: bold; color: #4CAF50; font-size: 12px; margin-bottom: 6px; text-align: center;';
  towerStatsSection.appendChild(towerStatsTitle);

  const towerStatsGrid = document.createElement('div');
  towerStatsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    font-size: 10px;
  `;
  towerStatsGrid.id = 'tower-stats-grid';
  towerStatsSection.appendChild(towerStatsGrid);

  towerUpgradePanel.appendChild(towerStatsSection);
  
  // Create tower upgrade buttons
  const createTowerUpgradeButton = (name: string, type: UpgradeType, iconType: IconType) => {
    const button = document.createElement('button');
    button.className = 'ui-button tower-button has-icon';
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 5px 0;
      font-size: 11px;
    `;
    
    let upgrading = false;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      if (upgrading || button.disabled) {
        audioManager.playUISound(SoundType.ERROR);
        return;
      }
      
      const selectedTower = game.getSelectedTower();
      if (selectedTower) {
        upgrading = true;
        const success = game.upgradeTower(selectedTower, type);
        
        if (success) {
          updateTowerUpgradePanel();
        } else {
          audioManager.playUISound(SoundType.ERROR);
        }
        
        setTimeout(() => {
          upgrading = false;
        }, 100);
      }
    });
    return button;
  };
  
  const damageUpgradeBtn = createTowerUpgradeButton('Damage', UpgradeType.DAMAGE, IconType.DAMAGE);
  const rangeUpgradeBtn = createTowerUpgradeButton('Range', UpgradeType.RANGE, IconType.RANGE);
  const fireRateUpgradeBtn = createTowerUpgradeButton('Fire Rate', UpgradeType.FIRE_RATE, IconType.FIRE_RATE);
  
  towerUpgradePanel.appendChild(damageUpgradeBtn);
  towerUpgradePanel.appendChild(rangeUpgradeBtn);
  towerUpgradePanel.appendChild(fireRateUpgradeBtn);
  
  gameContainer.appendChild(towerUpgradePanel);
  
  // Update tower upgrade panel function
  const updateTowerUpgradePanel = () => {
    const selectedTower = game.getSelectedTower();
    if (selectedTower) {
      // Update tower stats section
      const statsGrid = document.getElementById('tower-stats-grid');
      if (statsGrid) {
        statsGrid.innerHTML = `
          <div style="color: #ff6b6b; display: flex; align-items: center; gap: 4px;">
            ${createSvgIcon(IconType.DAMAGE, { size: 12 })}
            <span>Damage: ${selectedTower.damage}</span>
          </div>
          <div style="color: #4ecdc4; display: flex; align-items: center; gap: 4px;">
            ${createSvgIcon(IconType.RANGE, { size: 12 })}
            <span>Range: ${Math.round(selectedTower.range)}</span>
          </div>
          <div style="color: #ffe66d; display: flex; align-items: center; gap: 4px;">
            ${createSvgIcon(IconType.FIRE_RATE, { size: 12 })}
            <span>Fire Rate: ${selectedTower.fireRate.toFixed(1)}/s</span>
          </div>
          <div style="color: #a8e6cf; text-align: center; font-size: 9px; margin-top: 2px;">
            Type: ${selectedTower.towerType} | Total Upgrades: ${selectedTower.getTotalUpgrades()}
          </div>
        `;
      }
      // Position panel near the tower
      const towerPos = selectedTower.getPosition();
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const canvasRect = canvas.getBoundingClientRect();
      const x = towerPos.x + canvasRect.left;
      const y = towerPos.y + canvasRect.top;
      
      // Adjust position to keep panel on screen
      const panelWidth = 200;
      const panelHeight = 150;
      let panelX = x + 20;
      let panelY = y - panelHeight / 2;
      
      if (panelX + panelWidth > window.innerWidth) {
        panelX = x - panelWidth - 20;
      }
      if (panelY < 0) {
        panelY = 10;
      }
      if (panelY + panelHeight > window.innerHeight) {
        panelY = window.innerHeight - panelHeight - 10;
      }
      
      towerUpgradePanel.style.left = `${panelX}px`;
      towerUpgradePanel.style.top = `${panelY}px`;
      towerUpgradePanel.style.display = 'block';
      
      // Update damage button
      const damageCost = game.getUpgradeCost(selectedTower, UpgradeType.DAMAGE);
      const damageLevel = selectedTower.getUpgradeLevel(UpgradeType.DAMAGE);
      const canUpgradeDamage = selectedTower.canUpgrade(UpgradeType.DAMAGE) && game.canAffordUpgrade(selectedTower, UpgradeType.DAMAGE);
      
      const damageIcon = createSvgIcon(IconType.DAMAGE, { size: 16 });
      const nextDamage = damageLevel < 5 ? Math.floor(selectedTower.damage * 1.2) : selectedTower.damage;
      const damageIncrease = nextDamage - selectedTower.damage;
      damageUpgradeBtn.innerHTML = `${damageIcon}<span class="button-text">Damage Lv.${damageLevel}/5<br>${damageCost > 0 ? `$${damageCost} (+${damageIncrease} dmg)` : 'MAX'}</span>`;
      damageUpgradeBtn.style.background = canUpgradeDamage ? '#4CAF50' : '#666';
      damageUpgradeBtn.disabled = !canUpgradeDamage;
      
      // Update range button
      const rangeCost = game.getUpgradeCost(selectedTower, UpgradeType.RANGE);
      const rangeLevel = selectedTower.getUpgradeLevel(UpgradeType.RANGE);
      const canUpgradeRange = selectedTower.canUpgrade(UpgradeType.RANGE) && game.canAffordUpgrade(selectedTower, UpgradeType.RANGE);
      
      const rangeIcon = createSvgIcon(IconType.RANGE, { size: 16 });
      const nextRange = rangeLevel < 5 ? Math.floor(selectedTower.range * 1.15) : selectedTower.range;
      const rangeIncrease = nextRange - selectedTower.range;
      rangeUpgradeBtn.innerHTML = `${rangeIcon}<span class="button-text">Range Lv.${rangeLevel}/5<br>${rangeCost > 0 ? `$${rangeCost} (+${rangeIncrease} rng)` : 'MAX'}</span>`;
      rangeUpgradeBtn.style.background = canUpgradeRange ? '#4CAF50' : '#666';
      rangeUpgradeBtn.disabled = !canUpgradeRange;
      
      // Update fire rate button
      const fireRateCost = game.getUpgradeCost(selectedTower, UpgradeType.FIRE_RATE);
      const fireRateLevel = selectedTower.getUpgradeLevel(UpgradeType.FIRE_RATE);
      const canUpgradeFireRate = selectedTower.canUpgrade(UpgradeType.FIRE_RATE) && game.canAffordUpgrade(selectedTower, UpgradeType.FIRE_RATE);
      
      const fireRateIcon = createSvgIcon(IconType.FIRE_RATE, { size: 16 });
      const nextFireRate = fireRateLevel < 5 ? (selectedTower.fireRate * 1.25) : selectedTower.fireRate;
      const fireRateIncrease = (nextFireRate - selectedTower.fireRate).toFixed(1);
      fireRateUpgradeBtn.innerHTML = `${fireRateIcon}<span class="button-text">Fire Rate Lv.${fireRateLevel}/5<br>${fireRateCost > 0 ? `$${fireRateCost} (+${fireRateIncrease}/s)` : 'MAX'}</span>`;
      fireRateUpgradeBtn.style.background = canUpgradeFireRate ? '#4CAF50' : '#666';
      fireRateUpgradeBtn.disabled = !canUpgradeFireRate;
    } else {
      towerUpgradePanel.style.display = 'none';
    }
  };
  
  // Listen for tower selection
  setInterval(() => {
    updateTowerUpgradePanel();
    updatePlayerUpgradePanel();
  }, 100);

  // Create player upgrade panel (initially hidden)
  const playerUpgradePanel = document.createElement('div');
  playerUpgradePanel.className = 'ui-panel popup-panel';
  playerUpgradePanel.style.cssText = `
    position: absolute;
    bottom: 70px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 240px;
    display: none;
    animation: slideUp 0.2s ease-out;
  `;
  panels.push(playerUpgradePanel);

  // Player upgrade panel header
  const playerUpgradeHeader = document.createElement('div');
  playerUpgradeHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  `;

  const playerUpgradeTitle = document.createElement('div');
  playerUpgradeTitle.textContent = 'Player Upgrades';
  playerUpgradeTitle.style.cssText = 'font-weight: bold; color: #2196F3; font-size: 16px;';

  const closePlayerUpgradeBtn = document.createElement('button');
  closePlayerUpgradeBtn.className = 'ui-button icon-only';
  closePlayerUpgradeBtn.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #2196F3;
    color: #2196F3;
  `;
  const closePlayerIcon = createSvgIcon(IconType.CLOSE, { size: 16 });
  closePlayerUpgradeBtn.innerHTML = closePlayerIcon;
  closePlayerUpgradeBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    playerUpgradePanel.style.display = 'none';
    activePanel = null;
  });

  playerUpgradeHeader.appendChild(playerUpgradeTitle);
  playerUpgradeHeader.appendChild(closePlayerUpgradeBtn);
  playerUpgradePanel.appendChild(playerUpgradeHeader);

  // Add player stats section
  const playerStatsSection = document.createElement('div');
  playerStatsSection.style.cssText = `
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid #2196F3;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 12px;
  `;

  const playerStatsTitle = document.createElement('div');
  playerStatsTitle.textContent = 'Current Stats';
  playerStatsTitle.style.cssText = 'font-weight: bold; color: #2196F3; font-size: 12px; margin-bottom: 6px; text-align: center;';
  playerStatsSection.appendChild(playerStatsTitle);

  const playerStatsGrid = document.createElement('div');
  playerStatsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    font-size: 10px;
  `;
  playerStatsGrid.id = 'player-stats-grid';
  playerStatsSection.appendChild(playerStatsGrid);

  playerUpgradePanel.appendChild(playerStatsSection);

  // Create player upgrade buttons
  const createPlayerUpgradeButton = (name: string, type: PlayerUpgradeType, iconType: IconType) => {
    const button = document.createElement('button');
    button.className = 'ui-button action-button has-icon';
    button.style.cssText = `
      display: block;
      width: 100%;
      margin: 4px 0;
      font-size: 11px;
      padding: 8px;
    `;
    
    let upgrading = false;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      
      if (upgrading || button.disabled) {
        audioManager.playUISound(SoundType.ERROR);
        return;
      }
      
      upgrading = true;
      const success = game.upgradePlayer(type);
      
      if (success) {
        updatePlayerUpgradePanel();
      } else {
        audioManager.playUISound(SoundType.ERROR);
      }
      
      setTimeout(() => {
        upgrading = false;
      }, 100);
    });
    return button;
  };

  const playerDamageBtn = createPlayerUpgradeButton('Damage', PlayerUpgradeType.DAMAGE, IconType.DAMAGE);
  const playerSpeedBtn = createPlayerUpgradeButton('Speed', PlayerUpgradeType.SPEED, IconType.SPEED);
  const playerFireRateBtn = createPlayerUpgradeButton('Fire Rate', PlayerUpgradeType.FIRE_RATE, IconType.FIRE_RATE);
  const playerHealthBtn = createPlayerUpgradeButton('Health', PlayerUpgradeType.HEALTH, IconType.HEALTH);

  playerUpgradePanel.appendChild(playerDamageBtn);
  playerUpgradePanel.appendChild(playerSpeedBtn);
  playerUpgradePanel.appendChild(playerFireRateBtn);
  playerUpgradePanel.appendChild(playerHealthBtn);

  gameContainer.appendChild(playerUpgradePanel);

  // Update player upgrade panel function
  const updatePlayerUpgradePanel = () => {
    const player = game.getPlayer();
    
    // Update player stats section
    const statsGrid = document.getElementById('player-stats-grid');
    if (statsGrid) {
      const activePowerUps = player.getActivePowerUps();
      const hasExtraDamage = activePowerUps.has('EXTRA_DAMAGE');
      const hasSpeedBoost = activePowerUps.has('SPEED_BOOST');
      const hasFasterShooting = activePowerUps.has('FASTER_SHOOTING');
      const hasShield = activePowerUps.has('SHIELD');
      
      statsGrid.innerHTML = `
        <div style="color: #ff6b6b;">
          ${createSvgIcon(IconType.DAMAGE, { size: 12 })}
          <span style="margin-left: 2px;">Damage: ${player.damage}${hasExtraDamage ? ' (+50%)' : ''}</span>
        </div>
        <div style="color: #4ecdc4;">
          ${createSvgIcon(IconType.SPEED, { size: 12 })}
          <span style="margin-left: 2px;">Speed: ${Math.round(player.speed)}${hasSpeedBoost ? ' (+50%)' : ''}</span>
        </div>
        <div style="color: #ffe66d;">
          ${createSvgIcon(IconType.FIRE_RATE, { size: 12 })}
          <span style="margin-left: 2px;">Fire Rate: ${player.fireRate.toFixed(1)}/s${hasFasterShooting ? ' (+100%)' : ''}</span>
        </div>
        <div style="color: #51cf66;">
          ${createSvgIcon(IconType.HEALTH, { size: 12 })}
          <span style="margin-left: 2px;">Health: ${player.health}/${player.getMaxHealth()}${hasShield ? ' (🛡️)' : ''}</span>
        </div>
        <div style="color: #a8e6cf; grid-column: 1 / -1; text-align: center; font-size: 9px; margin-top: 2px;">
          Level: ${player.getLevel()} | Total Upgrades: ${player.getTotalUpgrades()}
        </div>
      `;
    }
    
    // Update damage button
    const damageCost = game.getPlayerUpgradeCost(PlayerUpgradeType.DAMAGE);
    const damageLevel = player.getUpgradeLevel(PlayerUpgradeType.DAMAGE);
    const canUpgradeDamage = player.canUpgrade(PlayerUpgradeType.DAMAGE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.DAMAGE);
    
    const damageIcon = createSvgIcon(IconType.DAMAGE, { size: 16 });
    const nextDamage = damageLevel < 5 ? Math.floor(player.damage * 1.4) : player.damage;
    const damageIncrease = nextDamage - player.damage;
    playerDamageBtn.innerHTML = `${damageIcon}<span class="button-text">Damage Lv.${damageLevel}/5<br>${damageCost > 0 ? `$${damageCost} (+${damageIncrease} dmg)` : 'MAX'}</span>`;
    playerDamageBtn.style.background = canUpgradeDamage ? '#2196F3' : '#666';
    playerDamageBtn.disabled = !canUpgradeDamage;
    
    // Update speed button
    const speedCost = game.getPlayerUpgradeCost(PlayerUpgradeType.SPEED);
    const speedLevel = player.getUpgradeLevel(PlayerUpgradeType.SPEED);
    const canUpgradeSpeed = player.canUpgrade(PlayerUpgradeType.SPEED) && game.canAffordPlayerUpgrade(PlayerUpgradeType.SPEED);
    
    const speedIcon = createSvgIcon(IconType.SPEED, { size: 16 });
    const nextSpeed = speedLevel < 5 ? Math.floor(player.speed * 1.3) : player.speed;
    const speedIncrease = nextSpeed - player.speed;
    playerSpeedBtn.innerHTML = `${speedIcon}<span class="button-text">Speed Lv.${speedLevel}/5<br>${speedCost > 0 ? `$${speedCost} (+${speedIncrease} spd)` : 'MAX'}</span>`;
    playerSpeedBtn.style.background = canUpgradeSpeed ? '#2196F3' : '#666';
    playerSpeedBtn.disabled = !canUpgradeSpeed;
    
    // Update fire rate button
    const fireRateCost = game.getPlayerUpgradeCost(PlayerUpgradeType.FIRE_RATE);
    const fireRateLevel = player.getUpgradeLevel(PlayerUpgradeType.FIRE_RATE);
    const canUpgradeFireRate = player.canUpgrade(PlayerUpgradeType.FIRE_RATE) && game.canAffordPlayerUpgrade(PlayerUpgradeType.FIRE_RATE);
    
    const fireRateIcon = createSvgIcon(IconType.FIRE_RATE, { size: 16 });
    const nextFireRate = fireRateLevel < 5 ? (player.fireRate * 1.25) : player.fireRate;
    const fireRateIncrease = (nextFireRate - player.fireRate).toFixed(1);
    playerFireRateBtn.innerHTML = `${fireRateIcon}<span class="button-text">Fire Rate Lv.${fireRateLevel}/5<br>${fireRateCost > 0 ? `$${fireRateCost} (+${fireRateIncrease}/s)` : 'MAX'}</span>`;
    playerFireRateBtn.style.background = canUpgradeFireRate ? '#2196F3' : '#666';
    playerFireRateBtn.disabled = !canUpgradeFireRate;
    
    // Update health button
    const healthCost = game.getPlayerUpgradeCost(PlayerUpgradeType.HEALTH);
    const healthLevel = player.getUpgradeLevel(PlayerUpgradeType.HEALTH);
    const canUpgradeHealth = player.canUpgrade(PlayerUpgradeType.HEALTH) && game.canAffordPlayerUpgrade(PlayerUpgradeType.HEALTH);
    
    const healthIcon = createSvgIcon(IconType.HEALTH, { size: 16 });
    const nextMaxHealth = healthLevel < 5 ? Math.floor(player.getMaxHealth() * 1.5) : player.getMaxHealth();
    const healthIncrease = nextMaxHealth - player.getMaxHealth();
    playerHealthBtn.innerHTML = `${healthIcon}<span class="button-text">Health Lv.${healthLevel}/5<br>${healthCost > 0 ? `$${healthCost} (+${healthIncrease} hp)` : 'MAX'}</span>`;
    playerHealthBtn.style.background = canUpgradeHealth ? '#2196F3' : '#666';
    playerHealthBtn.disabled = !canUpgradeHealth;
  };

  // Create settings panel (initially hidden)
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'ui-panel popup-panel';
  settingsPanel.style.cssText = `
    position: absolute;
    bottom: 70px;
    right: 20px;
    min-width: 300px;
    display: none;
    animation: slideUp 0.2s ease-out;
  `;
  panels.push(settingsPanel);

  // Settings panel header
  const settingsHeader = document.createElement('div');
  settingsHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  `;

  const settingsTitle = document.createElement('div');
  settingsTitle.textContent = 'Settings';
  settingsTitle.style.cssText = 'font-weight: bold; color: #FFD700; font-size: 16px;';

  const closeSettingsBtn = document.createElement('button');
  closeSettingsBtn.className = 'ui-button icon-only';
  closeSettingsBtn.style.cssText = `
    width: 24px;
    height: 24px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #FFD700;
    color: #FFD700;
  `;
  const closeSettingsIcon = createSvgIcon(IconType.CLOSE, { size: 16 });
  closeSettingsBtn.innerHTML = closeSettingsIcon;
  closeSettingsBtn.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    settingsPanel.style.display = 'none';
    activePanel = null;
  });

  settingsHeader.appendChild(settingsTitle);
  settingsHeader.appendChild(closeSettingsBtn);
  settingsPanel.appendChild(settingsHeader);

  // Add settings content
  const settingsContent = document.createElement('div');
  settingsContent.style.cssText = 'padding: 8px 0;';

  // Audio section
  const audioSection = document.createElement('div');
  audioSection.style.cssText = 'margin-bottom: 16px;';
  
  const audioSectionTitle = document.createElement('div');
  audioSectionTitle.textContent = 'Audio';
  audioSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #FFD700;';
  audioSection.appendChild(audioSectionTitle);

  // Volume slider
  const volumeContainer = document.createElement('div');
  volumeContainer.style.marginBottom = '8px';
  
  const volumeLabel = document.createElement('label');
  volumeLabel.textContent = 'Master Volume: ';
  volumeLabel.style.display = 'block';
  volumeLabel.style.marginBottom = '4px';

  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = '0';
  volumeSlider.max = '100';
  volumeSlider.value = '30';
  volumeSlider.style.width = '100%';
  
  volumeSlider.addEventListener('input', (e) => {
    const volume = parseInt((e.target as HTMLInputElement).value) / 100;
    audioManager.setMasterVolume(volume);
    game.getAudioManager().setMasterVolume(volume);
  });

  volumeContainer.appendChild(volumeLabel);
  volumeContainer.appendChild(volumeSlider);
  audioSection.appendChild(volumeContainer);

  // Mute toggle
  const muteButton = document.createElement('button');
  muteButton.className = 'ui-button has-icon';
  let isMuted = false;
  const updateMuteButton = () => {
    const icon = createSvgIcon(isMuted ? IconType.AUDIO_OFF : IconType.AUDIO_ON, { size: 16 });
    muteButton.innerHTML = `${icon}<span class="button-text">${isMuted ? 'Unmute' : 'Mute'}</span>`;
  };
  updateMuteButton();
  muteButton.style.width = '100%';
  muteButton.style.fontSize = '12px';
  
  muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    audioManager.setEnabled(!isMuted);
    game.getAudioManager().setEnabled(!isMuted);
    volumeSlider.disabled = isMuted;
    updateMuteButton();
  });
  
  audioSection.appendChild(muteButton);
  settingsContent.appendChild(audioSection);

  // Controls section
  const controlsSection = document.createElement('div');
  const controlsSectionTitle = document.createElement('div');
  controlsSectionTitle.textContent = 'Controls Reference';
  controlsSectionTitle.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #FFD700;';
  controlsSection.appendChild(controlsSectionTitle);

  const controlsList = document.createElement('div');
  controlsList.style.cssText = 'font-size: 11px; line-height: 1.4;';
  const keyboardIcon = createSvgIcon(IconType.KEYBOARD, { size: 14 });
  controlsList.innerHTML = `
    <div style="margin-bottom: 4px;">${keyboardIcon} <strong>Keyboard:</strong></div>
    <div>WASD/Arrows - Move Player</div>
    <div>1-4 - Select Tower Type</div>
    <div>B - Toggle Build Menu</div>
    <div>U - Toggle Player Upgrades</div>
    <div>Enter - Start Next Wave</div>
    <div>Space - Pause/Resume</div>
    <div>ESC - Cancel Selection</div>
  `;
  controlsSection.appendChild(controlsList);
  settingsContent.appendChild(controlsSection);

  settingsPanel.appendChild(settingsContent);
  gameContainer.appendChild(settingsPanel);

  // Control bar buttons
  const buildButton = createControlButton(IconType.BUILD, 'Build Menu (B)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    togglePanel(buildPanel);
  });

  const playerUpgradeButton = createControlButton(IconType.PLAYER, 'Player Upgrades (U)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    togglePanel(playerUpgradePanel);
    updatePlayerUpgradePanel();
  });

  const startWaveButton = createControlButton(IconType.PLAY, 'Start Next Wave (Enter)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (game.isWaveComplete() && !game.isGameOver()) {
      game.startNextWave();
    }
  });

  const pauseButton = createControlButton(IconType.PAUSE, 'Pause/Resume (Space)', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    if (game.isPaused()) {
      game.resume();
      pauseOverlay.style.display = 'none';
      pauseOverlay.style.visibility = 'hidden';
      pauseOverlay.style.opacity = '0';
    } else {
      game.pause();
      pauseOverlay.style.display = 'flex';
      pauseOverlay.style.visibility = 'visible';
      pauseOverlay.style.opacity = '1';
    }
  });

  const settingsButton = createControlButton(IconType.SETTINGS, 'Settings', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    togglePanel(settingsPanel);
  });

  // Add buttons to control bar
  controlBar.appendChild(buildButton);
  controlBar.appendChild(playerUpgradeButton);
  controlBar.appendChild(startWaveButton);
  controlBar.appendChild(pauseButton);
  controlBar.appendChild(settingsButton);

  gameContainer.appendChild(controlBar);

  // Create pause overlay (initially hidden)
  const pauseOverlay = document.createElement('div');
  pauseOverlay.id = 'pause-overlay';
  pauseOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: none;
    visibility: hidden;
    opacity: 0;
    z-index: 9999;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 30px;
    transition: opacity 0.3s ease;
  `;
  

  // Pause title
  const pauseTitle = document.createElement('div');
  pauseTitle.style.cssText = `
    font-size: 64px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    font-family: Arial, sans-serif;
    letter-spacing: 8px;
  `;
  pauseTitle.textContent = 'PAUSED';

  // Unpause button
  const unpauseButton = document.createElement('button');
  unpauseButton.style.cssText = `
    width: 200px;
    height: 80px;
    border-radius: 40px;
    background: linear-gradient(145deg, #4CAF50, #45a049);
    border: 3px solid #FFD700;
    color: white;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: Arial, sans-serif;
  `;
  
  const playIcon = createSvgIcon(IconType.PLAY, { size: 32 });
  unpauseButton.innerHTML = `${playIcon} RESUME`;
  
  unpauseButton.addEventListener('mouseenter', () => {
    unpauseButton.style.transform = 'scale(1.05)';
    unpauseButton.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.4)';
    unpauseButton.style.background = 'linear-gradient(145deg, #5CBF60, #4CAF50)';
  });
  
  unpauseButton.addEventListener('mouseleave', () => {
    unpauseButton.style.transform = 'scale(1)';
    unpauseButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    unpauseButton.style.background = 'linear-gradient(145deg, #4CAF50, #45a049)';
  });
  
  unpauseButton.addEventListener('click', () => {
    audioManager.playUISound(SoundType.BUTTON_CLICK);
    game.resume();
    pauseOverlay.style.display = 'none';
  });

  // Instructions text
  const instructionsText = document.createElement('div');
  instructionsText.style.cssText = `
    color: #CCCCCC;
    font-size: 18px;
    text-align: center;
    font-family: Arial, sans-serif;
    line-height: 1.6;
  `;
  instructionsText.innerHTML = `
    <div style="margin-bottom: 10px;">Click the button above or press <span style="color: #FFD700; font-weight: bold;">SPACE</span> to resume</div>
    <div>Press <span style="color: #FFD700; font-weight: bold;">ESC</span> to cancel tower selection</div>
  `;

  pauseOverlay.appendChild(pauseTitle);
  pauseOverlay.appendChild(unpauseButton);
  pauseOverlay.appendChild(instructionsText);
  document.body.appendChild(pauseOverlay);
  

  // Add keyboard listener for unpause overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      audioManager.playUISound(SoundType.BUTTON_CLICK);
      if (game.isPaused()) {
        game.resume();
        pauseOverlay.style.display = 'none';
        pauseOverlay.style.visibility = 'hidden';
        pauseOverlay.style.opacity = '0';
      } else {
        game.pause();
        pauseOverlay.style.display = 'flex';
        pauseOverlay.style.visibility = 'visible';
        pauseOverlay.style.opacity = '1';
      }
    }
  });

  // Create and mount PowerUpDisplay
  const powerUpDisplayContainer = document.createElement('div');
  powerUpDisplayContainer.id = 'powerup-display-container';
  powerUpDisplayContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    pointer-events: none;
    z-index: 1200;
  `;
  gameContainer.appendChild(powerUpDisplayContainer);

  const powerUpDisplay = new PowerUpDisplay({
    game: game,
    uiManager: null, // Not using the main UI manager
    visible: true
  });
  powerUpDisplay.mount(powerUpDisplayContainer);

  // Create and mount CameraControls
  const cameraControlsContainer = document.createElement('div');
  cameraControlsContainer.id = 'camera-controls-container';
  gameContainer.appendChild(cameraControlsContainer);

  const cameraControls = new CameraControls({
    game: game,
    position: 'top-right',
    showLabels: false,
    showZoomLevel: true,
    compact: true
  });
  cameraControls.mount(cameraControlsContainer);

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (activePanel && !activePanel.contains(e.target as Node) && 
        !controlBar.contains(e.target as Node)) {
      activePanel.style.display = 'none';
      activePanel = null;
    }
  });

  // Update control buttons state
  const updateControlButtons = () => {
    try {
      // Update tower buttons
      basicTowerBtn.disabled = !game.canAffordTower(TowerType.BASIC);
      sniperTowerBtn.disabled = !game.canAffordTower(TowerType.SNIPER);
      rapidTowerBtn.disabled = !game.canAffordTower(TowerType.RAPID);
      wallBtn.disabled = !game.canAffordTower(TowerType.WALL);
      
      // Update start wave button
      startWaveButton.disabled = !game.isWaveComplete() || game.isGameOver();
      const waveIcon = createSvgIcon(game.isWaveComplete() ? IconType.PLAY : IconType.WAVE, { size: 24 });
      startWaveButton.innerHTML = waveIcon;
      startWaveButton.title = game.isWaveComplete() ? 'Start Next Wave (Enter)' : 'Wave in Progress';
      
      // Update pause button
      const isPaused = game.isPaused();
      const pauseIcon = createSvgIcon(isPaused ? IconType.PLAY : IconType.PAUSE, { size: 24 });
      pauseButton.innerHTML = pauseIcon;
      pauseButton.title = isPaused ? 'Resume (Space)' : 'Pause (Space)';
      
      // Show/hide pause overlay
      if (isPaused) {
        pauseOverlay.style.display = 'flex';
        pauseOverlay.style.visibility = 'visible';
        pauseOverlay.style.opacity = '1';
      } else {
        pauseOverlay.style.display = 'none';
        pauseOverlay.style.visibility = 'hidden';
        pauseOverlay.style.opacity = '0';
      }
    } catch (error) {
      console.error('Error in updateControlButtons:', error);
    }
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .popup-panel {
      animation: slideUp 0.2s ease-out;
    }
    
    .control-button:hover {
      transform: scale(1.1);
      background: rgba(0, 0, 0, 0.9);
      border-color: #FFE066;
    }
    
    .control-button:active {
      transform: scale(0.95);
    }
    
    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  return {
    updateControlButtons,
    buildPanel,
    playerUpgradePanel,
    settingsPanel,
    controlBar,
    towerUpgradePanel,
    powerUpDisplay,
    cameraControls,
    pauseOverlay
  };
}