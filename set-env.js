const fs = require('fs');
const path = require('path');

// On cible le fichier de prod
const targetPath = path.join(__dirname, './src/environments/environment.ts');

const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
  linkPreviewKey: '${process.env.SUPABASE_KEY}',
  // Thème de Noël : actif par défaut, CHRISTMAS_THEME=false pour le désactiver
  christmasTheme: ${process.env.CHRISTMAS_THEME !== 'false'}
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environnement de prod généré avec succès.');
