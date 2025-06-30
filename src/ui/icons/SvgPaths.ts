import { IconType, ICON_PATHS } from './SvgIcons';

export function getSvgPath(type: IconType): string | undefined {
  return ICON_PATHS[type];
}