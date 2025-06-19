import { Game } from "@/core/Game";
import { IconType } from "@/ui/icons/SvgIcons";
import { FloatingUIElement } from "./FloatingUIElement";
import { ANIMATION_CONFIG } from "@/config/AnimationConfig";
import { UI_CONSTANTS } from "@/config/UIConstants";

export class PowerUpDisplay {
  private container: HTMLElement | null = null;
  private game: Game;
  private updateInterval: number | null = null;
  private powerUpElements: Map<string, FloatingUIElement> = new Map();

  constructor(options: { game: Game; visible?: boolean }) {
    this.game = options.game;
  }

  mount(parent: HTMLElement): void {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: absolute;
      top: ${UI_CONSTANTS.powerUpDisplay.position.top}px;
      right: ${UI_CONSTANTS.powerUpDisplay.position.right}px;
      display: flex;
      flex-direction: column;
      gap: ${UI_CONSTANTS.spacing.sm}px;
      pointer-events: none;
    `;
    parent.appendChild(this.container);

    // Start updating
    this.updateInterval = window.setInterval(
      () => this.update(),
      ANIMATION_CONFIG.durations.fast
    );
  }

  private update(): void {
    if (!this.container) return;

    const player = this.game.getPlayer();
    const activePowerUps = player.getActivePowerUps();

    // Remove power-ups that are no longer active
    for (const [type, element] of this.powerUpElements) {
      if (!activePowerUps.has(type)) {
        element.cleanup();
        this.powerUpElements.delete(type);
      }
    }

    // Update or create elements for active power-ups
    let index = 0;
    activePowerUps.forEach((duration, type) => {
      let element = this.powerUpElements.get(type);

      if (!element) {
        // Create new element for this power-up
        element = new FloatingUIElement({
          position: { top: 0, left: 0, right: 0 },
          borderColor: "#4CAF50",
          icon: this.getPowerUpIcon(type),
          iconSize: 20,
          additionalStyles: `
            position: relative;
            color: white;
            font-size: 14px;
          `,
          updateInterval: 0, // We'll update manually
        });

        element.mount(this.container);
        this.powerUpElements.set(type, element);
      }

      // Update content
      const remainingTime = Math.ceil(duration / 1000);
      element.setContent(`
        <span>${this.getPowerUpName(type)}</span>
        <span style="color: #FFD700; margin-left: 8px;">${remainingTime}s</span>
      `);

      index++;
    });
  }

  private getPowerUpIcon(type: string): IconType {
    const iconMap: Record<string, IconType> = {
      EXTRA_DAMAGE: IconType.DAMAGE,
      SPEED_BOOST: IconType.SPEED,
      FASTER_SHOOTING: IconType.FIRE_RATE,
      SHIELD: IconType.SHIELD,
      EXTRA_CURRENCY: IconType.COIN,
      HEALTH: IconType.HEALTH,
    };
    return iconMap[type] || IconType.POWERUP;
  }

  private getPowerUpName(type: string): string {
    const nameMap: Record<string, string> = {
      EXTRA_DAMAGE: "Extra Damage",
      SPEED_BOOST: "Speed Boost",
      FASTER_SHOOTING: "Rapid Fire",
      SHIELD: "Shield",
      EXTRA_CURRENCY: "Extra Currency",
      HEALTH: "Health Boost",
    };
    return nameMap[type] || "Power-Up";
  }

  cleanup(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Clean up all power-up elements
    for (const element of this.powerUpElements.values()) {
      element.cleanup();
    }
    this.powerUpElements.clear();

    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
