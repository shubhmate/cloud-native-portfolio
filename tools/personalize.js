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

function generateSkillsHtml(config) {
  if (!config.SKILLS_GROUPED) return;

  // 1. Generate Marquee HTML
  let marqueeHtml = '';
  const allSkills = Object.values(config.SKILLS_GROUPED).flat();
  for (const skill of allSkills) {
    marqueeHtml += `
            <div class="flex flex-col items-center gap-2 px-4 py-3 rounded-lg hover:border-[var(--accent)]/50 hover:scale-105 transition-all min-w-[80px] group card-hover">
              <i data-lucide="${skill.icon}" class="w-7 h-7 transition-colors group-hover:scale-110 transition-transform"></i>
              <span class="text-xs text-center font-mono">${skill.name}</span>
            </div>`;
  }
  config.SKILLS_MARQUEE = marqueeHtml;

  // 2. Generate Grid HTML
  let gridHtml = '';
  for (const [category, skills] of Object.entries(config.SKILLS_GROUPED)) {
    gridHtml += `
              <div class="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] transition-colors card-hover">
                <p class="font-mono text-xs font-semibold mb-3 text-[var(--accent)] leading-tight">${category}</p>
                <div class="flex flex-wrap gap-2">`;
    for (const skill of skills) {
      gridHtml += `
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="${skill.icon}" class="w-3 h-3 text-[var(--accent)]"></i>
                    <span class="text-xs text-slate-400">${skill.name}</span>
                  </div>`;
    }
    gridHtml += `
                </div>
              </div>`;
  }
  config.SKILLS_GRID = gridHtml;

  // 3. Generate Terminal Skills Array
  let terminalSkills = [];
  for (const [category, skills] of Object.entries(config.SKILLS_GROUPED)) {
    const paddedCategory = category.padEnd(16, ' ');
    const skillNames = skills.map(s => s.name).join(', ');
    terminalSkills.push(`${paddedCategory}→ ${skillNames}`);
  }
  config.TERMINAL_SKILLS = terminalSkills;
}

function applyReplacements(content, config) {
  let modifiedContent = content;
  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      let value = config[key];
      const templatePlaceholder = `{{${key}}}`;
      
      // If the value is an object or array, stringify it to a JSON literal
      if (typeof value === 'object' && value !== null) {
        const stringifiedValue = JSON.stringify(value);
        
        // If the placeholder is wrapped in quotes (e.g. in a JSON template to prevent syntax errors),
        // we replace the quotes along with the placeholder.
        const quotedPlaceholder = `"${templatePlaceholder}"`;
        if (modifiedContent.includes(quotedPlaceholder)) {
          modifiedContent = modifiedContent.replace(new RegExp(quotedPlaceholder, 'g'), stringifiedValue);
        } else {
          modifiedContent = modifiedContent.replace(new RegExp(templatePlaceholder, 'g'), stringifiedValue);
        }
      } else {
        // Regular string replacement
        modifiedContent = modifiedContent.replace(new RegExp(templatePlaceholder, 'g'), value);
      }
    }
  }
  return modifiedContent;
}

try {
  // 1. Read configuration
  const configRaw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw);

  console.log('Applying personalization from config.json...');

  // 1.5 Generate Dynamic Skills HTML
  generateSkillsHtml(config);

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