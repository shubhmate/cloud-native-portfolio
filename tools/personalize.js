const fs = require('fs');
const path = require('path');

const projectRoot = __dirname; // Assumes script is in static-portfolio folder

const configPath = path.join(projectRoot, 'config.json'); // Configuration file for personalization
const htmlPath = path.join(projectRoot, 'index.html'); // Main HTML file
const mainCssPath = path.join(projectRoot, 'assets', 'css', 'main.css'); // External CSS file
const mainJsPath = path.join(projectRoot, 'assets', 'js', 'main.js'); // External JavaScript file

function applyReplacements(content, config) {
  let modifiedContent = content;
  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      const placeholder = `{{${key}}}`;
      const value = config[key];
      // Use a global regex to replace all occurrences
      modifiedContent = modifiedContent.replace(new RegExp(placeholder, 'g'), value);
    }
  }
  return modifiedContent;
}

try {
  // 1. Read configuration
  const configRaw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw);

  console.log('Applying personalization from config.json...');

  // 2. Process index.html
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  htmlContent = applyReplacements(htmlContent, config);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('✔ index.html personalized.');
  
  // 3. Process assets/css/main.css
  let mainCssContent = fs.readFileSync(mainCssPath, 'utf8');
  mainCssContent = applyReplacements(mainCssContent, config);
  fs.writeFileSync(mainCssPath, mainCssContent, 'utf8');
  console.log('✔ assets/css/main.css personalized.');

  // 4. Process assets/js/main.js
  let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
  mainJsContent = applyReplacements(mainJsContent, config);
  fs.writeFileSync(mainJsPath, mainJsContent, 'utf8');
  console.log('✔ assets/js/main.js personalized.');

  // Note: If terminal commands were in a separate JSON file, you would process it here.
  // For now, they are part of main.js, so no separate commands.json processing is needed.

  console.log('\nPersonalization complete! Your portfolio files have been updated.');
} catch (error) {
  console.error('Error during personalization:', error.message);
}