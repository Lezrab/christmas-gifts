const fs = require('fs');
const path = require('path');

// On cible le fichier de prod
const targetPath = path.join(__dirname, './src/environments/environment.ts');

// Thème : 'auto' (selon la date) par défaut, ou forcé via SITE_THEME=classic|halloween|christmas
const themes = ['auto', 'classic', 'halloween', 'christmas'];
const theme = themes.includes(process.env.SITE_THEME) ? process.env.SITE_THEME : 'auto';

const envConfigFile = `import { ThemeSetting } from '../app/theme';

export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
  linkPreviewKey: '${process.env.LINK_PREVIEW_KEY}',
  theme: '${theme}' as ThemeSetting,
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environnement de prod généré avec succès.');
