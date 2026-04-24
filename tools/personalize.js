const fs = require('fs');
const path = require('path');

// The script is in the "tools" directory, so the project root is one level up
const projectRoot = path.join(__dirname, '..'); 

const configPath = path.join(__dirname, 'config.json'); // Configuration file is in the tools directory
const htmlPath = path.join(projectRoot, 'index.html'); // Main HTML file
const templatePath = path.join(projectRoot, 'index.template.html'); // Template HTML file
const mainCssPath = path.join(projectRoot, 'assets', 'css', 'main.css'); // External CSS file
const mainJsPath = path.join(projectRoot, 'assets', 'js', 'main.js'); // External JavaScript file
const commandsJsonPath = path.join(projectRoot, 'assets', 'js', 'commands.json'); // Commands JSON file
const commandsTemplatePath = path.join(projectRoot, 'assets', 'js', 'commands.template.json'); // Template for commands JSON file
const clientConfigPath = path.join(projectRoot, 'assets', 'config.json'); // Path to copy config for client-side fetch

function applyReplacements(content, config) {
  let modifiedContent = content;
  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      let value = config[key];
      
      // If the value is an object or array, stringify it to a JSON literal
      // so it can be correctly inserted into JavaScript code.
      // so it can be correctly inserted into JavaScript code or HTML attributes.
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Replace exact template syntax (e.g. "{{GITHUB_HANDLE}}")
      // Use a regular expression with 'g' flag for global replacement
      const templatePlaceholder = `{{${key}}}`;
      modifiedContent = modifiedContent.replace(new RegExp(templatePlaceholder, 'g'), value);
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
  // 2. Process <head> section of index.html (for SEO, title, etc.)
  // Now processing the entire index.template.html for placeholders
  let htmlContent = fs.readFileSync(templatePath, 'utf8');
  // Apply replacements to the entire HTML content
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

  // 5. Process assets/js/commands.json
  let commandsContent = fs.readFileSync(commandsTemplatePath, 'utf8');
  commandsContent = applyReplacements(commandsContent, config);
  fs.writeFileSync(commandsJsonPath, commandsContent, 'utf8');
  console.log('✔ assets/js/commands.json personalized.');
  
  // 6. Copy config.json to assets/ for client-side fetching
  fs.copyFileSync(configPath, clientConfigPath);
  console.log('✔ config.json copied to assets/config.json for client-side use.');

  console.log('\nPersonalization complete! Your portfolio files have been updated.');
} catch (error) {
  console.error('Error during personalization:', error.message);
}