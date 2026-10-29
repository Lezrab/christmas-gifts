export type Theme = 'classic' | 'halloween' | 'christmas';
export type ThemeSetting = Theme | 'auto';

// En mode auto, le thème dépend de la date :
// - octobre : Halloween
// - novembre et décembre : Noël
// - le reste de l'année : classique
export function resolveTheme(setting: ThemeSetting, date = new Date()): Theme {
  if (setting !== 'auto') return setting;

  const month = date.getMonth(); // 0 = janvier
  if (month === 9) return 'halloween';
  if (month >= 10) return 'christmas';
  return 'classic';
}
