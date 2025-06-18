import { Game } from '@/core/Game';
import { IconType } from '@/ui/icons/SvgIcons';
import { FloatingUIElement } from './FloatingUIElement';

export class CurrencyDisplay extends FloatingUIElement {
  private game: Game;

  constructor(game: Game) {
    super({
      id: 'resource-display',
      position: { top: 10, left: 10 },
      borderColor: '#FFD700',
      icon: IconType.COINS,
      iconSize: 20,
      onUpdate: (element) => this.updateCurrency()
    });
    
    this.game = game;
    this.updateCurrency();
  }

  private updateCurrency(): void {
    const currency = this.game.getCurrency();
    this.setContent(`$${currency}`);
  }
}