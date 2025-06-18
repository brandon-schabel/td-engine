import { FloatingDisplay } from './FloatingDisplay';
import { IconType } from '../../icons/SvgIcons';
import { Game } from '@/core/Game';
import { UI_CONSTANTS } from '@/config/UIConstants';
import { COLOR_THEME } from '@/config/ColorTheme';

export class CurrencyDisplay extends FloatingDisplay {
  constructor(game: Game) {
    super({
      position: { top: UI_CONSTANTS.hud.padding, left: UI_CONSTANTS.hud.padding },
      borderColor: COLOR_THEME.ui.currency,
      textColor: COLOR_THEME.ui.currency,
      iconType: IconType.COINS,
      getValue: () => `$${game.getCurrency()}`
    });
  }
}