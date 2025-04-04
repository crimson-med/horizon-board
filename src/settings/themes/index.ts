import { ColorConfig, ThemeName } from './types';
import { lightTheme } from './light';
import { darkTheme } from './dark';
import { sunsetTheme } from './sunset';
import { halloweenTheme } from './halloween';
import { draculaTheme } from './dracula';
import { synthwaveTheme } from './synthwave';
import { sakuraTheme } from './sakura';

export { ColorConfig, ThemeName } from './types';

// Map of all available themes by name
export const themes: Record<ThemeName, ColorConfig> = {
  light: lightTheme,
  dark: darkTheme,
  sunset: sunsetTheme,
  halloween: halloweenTheme,
  dracula: draculaTheme,
  synthwave: synthwaveTheme,
  sakura: sakuraTheme,
};

// Get a theme by name
export function getTheme(themeName: ThemeName): ColorConfig {
  return themes[themeName];
}

// Default theme to use if none is specified
export const DEFAULT_THEME: ThemeName = 'dracula';
