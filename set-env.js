const fs = require('fs');
const path = require('path');

// On cible le fichier de prod
const targetPath = path.join(__dirname, './src/environments/environment.ts');

const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log('Environnement de prod généré avec succès.');
