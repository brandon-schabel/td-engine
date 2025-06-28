/**
 * Upgrade UI Dialog
 * Displays available upgrades and allows players to spend upgrade points
 */

import type { Game } from '@/core/Game';
import type { FloatingUIElement } from '@/ui/floating/FloatingUIElement';
import { UpgradeType, getNextLevelDescription } from '@/config/PlayerUpgradeConfig';
import type { PlayerUpgradeManager } from '@/entities/player/PlayerUpgradeManager';
import { SoundType } from '@/audio/AudioManager';
import { 
  createButton, 
  createHeader, 
  createCard,
  createIconContainer,
  cn 
} from '@/ui/elements';
import { IconType } from '@/ui/icons/SvgIcons';

export class UpgradeUI {
  private game: Game;
  private element: FloatingUIElement | null = null;
  private upgradeManager: PlayerUpgradeManager;
  private refreshCallback?: () => void;

  constructor(game: Game, upgradeManager: PlayerUpgradeManager) {
    this.game = game;
    this.upgradeManager = upgradeManager;
  }

  show(): void {
    const content = this.createContent();
    
    this.element = this.game.getFloatingUIManager().createDialog(
      'upgrade-menu',
      content,
      {
        title: 'Player Upgrades',
        closeable: true,
        onClose: () => this.destroy(),
        modal: true
      }
    );
  }

  hide(): void {
    if (this.element) {
      this.element.destroy();
      this.element = null;
    }
  }

  destroy(): void {
    this.hide();
  }

  private createContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = cn('flex', 'flex-col', 'min-w-[400px]', 'h-full');

    // Available points display (fixed header)
    const player = this.game.getPlayer();
    const levelSystem = player.getPlayerLevelSystem();
    const availablePoints = levelSystem.getAvailableUpgradePoints();
    
    const pointsHeader = createHeader({
      title: `Available Points: ${availablePoints}`,
      subtitle: `Level ${levelSystem.getLevel()}`,
      icon: IconType.STAR
    });
    pointsHeader.className = cn(pointsHeader.className, 'px-4', 'pt-4', 'pb-2');
    container.appendChild(pointsHeader);

    // Create scrollable upgrade cards container
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = cn('flex-1', 'overflow-hidden', 'px-4');
    
    const upgradesContainer = document.createElement('div');
    upgradesContainer.className = cn('space-y-3', 'overflow-y-auto', 'pr-2');
    upgradesContainer.style.maxHeight = '400px';

    Object.values(UpgradeType).forEach(type => {
      const upgradeCard = this.createUpgradeCard(type);
      upgradesContainer.appendChild(upgradeCard);
    });

    scrollWrapper.appendChild(upgradesContainer);
    container.appendChild(scrollWrapper);

    // Close button (fixed footer)
    const closeButton = createButton({
      text: 'Close',
      variant: 'secondary',
      onClick: () => this.hide()
    });
    closeButton.className = cn(closeButton.className, 'w-full', 'mx-4', 'mb-4', 'mt-2');
    
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = cn('px-4', 'pb-4', 'pt-2');
    buttonWrapper.appendChild(closeButton);
    container.appendChild(buttonWrapper);

    return container;
  }

  private createUpgradeCard(type: UpgradeType): HTMLElement {
    const definition = this.upgradeManager.getUpgradeDefinition(type);
    const currentLevel = this.upgradeManager.getUpgradeLevel(type);
    const canPurchase = this.upgradeManager.canPurchaseUpgrade(type);
    const isMaxLevel = currentLevel >= definition.maxLevel;

    // Map upgrade types to icons
    const iconMap: Record<UpgradeType, IconType> = {
      [UpgradeType.DAMAGE]: IconType.DAMAGE,
      [UpgradeType.FIRE_RATE]: IconType.FIRE_RATE,
      [UpgradeType.MOVEMENT_SPEED]: IconType.SPEED,
      [UpgradeType.MAX_HEALTH]: IconType.HEALTH,
      [UpgradeType.REGENERATION]: IconType.SHIELD
    };

    const icon = iconMap[type] || IconType.UPGRADE;

    const iconElement = createIconContainer({
      icon: icon,
      size: 'sm',
      variant: 'filled',
      color: 'primary'
    });

    const headerElement = createHeader({
      title: definition.name,
      subtitle: `Level ${currentLevel}/${definition.maxLevel}`,
      icon: iconElement,
      showCloseButton: false,
      variant: 'compact'
    });

    const card = createCard({
      variant: 'default',
      className: cn('space-y-3')
    });

    // Add header
    card.appendChild(headerElement);

    // Add description
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = cn('text-sm', 'text-secondary', 'px-4');
    descriptionDiv.textContent = getNextLevelDescription(type, currentLevel);
    card.appendChild(descriptionDiv);

    // Add cost
    const costDiv = document.createElement('div');
    costDiv.className = cn('text-sm', 'text-secondary', 'px-4');
    costDiv.textContent = `Cost: ${isMaxLevel ? 'MAX' : `${definition.costPerLevel} point${definition.costPerLevel > 1 ? 's' : ''}`}`;
    card.appendChild(costDiv);

    // Add upgrade button
    const buttonContainer = document.createElement('div');
    buttonContainer.className = cn('mt-3');

    const upgradeButton = createButton({
      text: isMaxLevel ? 'Max Level' : 'Upgrade',
      variant: canPurchase ? 'primary' : 'secondary',
      disabled: !canPurchase,
      onClick: () => this.purchaseUpgrade(type)
    });
    upgradeButton.className = cn(upgradeButton.className, 'w-full');

    buttonContainer.appendChild(upgradeButton);
    card.appendChild(buttonContainer);

    return card;
  }

  private purchaseUpgrade(type: UpgradeType): void {
    const success = this.upgradeManager.purchaseUpgrade(type);
    
    if (success) {
      // Refresh the UI
      this.refresh();
      
      // Play sound effect
      this.game.getAudioManager().playSound(SoundType.UI_SELECT, 1);
      
      // Notify any callbacks
      if (this.refreshCallback) {
        this.refreshCallback();
      }
    }
  }

  private refresh(): void {
    if (this.element) {
      // Get the dialog content container
      const contentContainer = this.element.getElement().querySelector('.ui-dialog-content');
      if (contentContainer) {
        // Clear existing content
        contentContainer.innerHTML = '';
        // Create and append new content
        const newContent = this.createContent();
        contentContainer.appendChild(newContent);
      }
    }
  }

  onRefresh(callback: () => void): void {
    this.refreshCallback = callback;
  }
}