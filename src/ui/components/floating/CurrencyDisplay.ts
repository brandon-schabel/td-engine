import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';

export class CurrencyDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: 10, left: 10 },
      borderColor: '#FFD700',
      textColor: '#FFD700',
      iconType: IconType.COINS,
      getValue: () => `$${game.getCurrency()}`
    });
  }
}