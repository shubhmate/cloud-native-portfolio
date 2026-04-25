const fs = require('fs');
const path = require('path');

// The script is in the "tools" directory, so the project root is one level up
const projectRoot = path.join(__dirname, '..'); 

const configPath = path.join(__dirname, 'config.json'); // Configuration file is in the tools directory
const htmlPath = path.join(projectRoot, 'index.html'); // Main HTML file
const templatePath = path.join(projectRoot, 'index.template.html'); // Template HTML file
const mainCssPath = path.join(projectRoot, 'assets', 'css', 'main.css'); // External CSS file
const mainJsPath = path.join(projectRoot, 'assets', 'js', 'main.js'); // External JavaScript file
const mainJsTemplatePath = path.join(projectRoot, 'assets', 'js', 'main.template.js'); // Template for JS file
const commandsJsonPath = path.join(projectRoot, 'assets', 'js', 'commands.json'); // Commands JSON file
const commandsTemplatePath = path.join(projectRoot, 'assets', 'js', 'commands.template.json'); // Template for commands JSON file
const clientConfigPath = path.join(projectRoot, 'assets', 'config.json'); // Path to copy config for client-side fetch

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateExperienceHtml(config) {
  if (!config.EXPERIENCE) return '';

  let expHtml = '';
  config.EXPERIENCE.forEach((exp, index) => {
    const bulletsHtml = exp.bullets.map(bullet => `
                    <li class="text-sm text-[var(--muted)] flex gap-2">
                      <span class="text-[var(--accent)] shrink-0">▸</span>
                      ${escapeHtml(bullet)}
                    </li>`).join('');

    expHtml += `
                <!-- Experience Item ${index + 1} -->
                <div class="relative">
                  <!-- Timeline dot -->
                  <div class="absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]"></div>
                  <!-- Role Details -->
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="font-mono font-semibold text-[var(--accent)]">${escapeHtml(exp.role)}</h3> 
                    ${exp.end.toLowerCase() === 'present' ? '<span class="px-2 py-0.5 rounded text-xs font-mono bg-green-400/10 text-green-400">Full-time</span>' : `<span class="px-2 py-0.5 rounded text-xs font-mono bg-[var(--accent)]/10 text-[var(--accent)]">${escapeHtml(exp.type)}</span>`}
                  </div>
                  <p class="text-xs text-[var(--accent)] font-mono mb-1">@ ${escapeHtml(exp.company)}</p>
                  <!-- Duration -->
                  <p class="text-xs text-[var(--muted)] font-mono mb-3">${escapeHtml(exp.start)} – ${escapeHtml(exp.end)}</p>
                  <!-- Responsibilities -->
                  <ul class="space-y-1.5">
                    ${bulletsHtml}
                  </ul>
                </div>`;
  });

  return expHtml;
}

function generateContactLinksHtml(config) {
  if (!config.CONTACT_LINKS) return '';

  return config.CONTACT_LINKS.map(link => {
    if (link.type === 'copy') {
      return `
              <button onclick="copyToClipboard('${escapeHtml(link.value)}')" class="copy-btn flex items-center gap-3 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group w-full text-left" title="Click to copy">
                <div class="p-2 rounded-lg border border-[var(--border)] group-hover:border-[var(--accent)] bg-[var(--surface)]">
                  <i data-lucide="${link.icon}" class="w-4 h-4"></i>
                </div>
                <span class="font-mono text-sm">${escapeHtml(link.value)}</span>
              </button>`;
    } else {
      return `
              <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group" aria-label="${escapeHtml(link.label)} profile">
                <div class="p-2 rounded-lg border border-[var(--border)] group-hover:border-[var(--accent)] bg-[var(--surface)]">
                  <i data-lucide="${link.icon}" class="w-4 h-4"></i>
                </div>
                <span class="font-mono text-sm">${escapeHtml(link.value)}</span>
              </a>`;
    }
  }).join('');
}

function generateHireMeHtml(config) {
  const text = config.HIRE_ME_TEXT || 'HIRE ME';
  const parts = text.split(' ');
  
  if (parts.length === 2) {
    return `<span class="hire-part-1">${escapeHtml(parts[0])}</span><span class="pulse-dot"></span><span class="hire-part-2">${escapeHtml(parts[1])}</span>`;
  }
  
  return `<span class="pulse-dot"></span><span>${escapeHtml(text)}</span>`;
}

function generateCertificationsHtml(config) {
  if (!config.CERTIFICATIONS) return '';

  return config.CERTIFICATIONS.map(cert => `
              <div class="p-4 rounded-xl border border-${cert.color}-400/30 bg-${cert.color}-400/5 card-hover">
                <i data-lucide="award" class="w-5 h-5 mb-2 text-${cert.color}-400"></i>
                <p class="font-mono text-xs font-semibold leading-tight">${escapeHtml(cert.name)}</p>
                <p class="text-xs text-[var(--muted)] mt-1">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.status)}</p>
              </div>`).join('');
}

function generateSkillsHtml(config) {
  if (!config.SKILLS_GROUPED) return '';

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
  return gridHtml;
}

function generateProjectsHtml(config) {
  if (!config.PROJECTS) return;

  let gridHtml = '';
  for (const project of config.PROJECTS) {
    let tagsHtml = '';
    if (project.tags) {
      for (const tag of project.tags) {
        tagsHtml += `\n                  <span class="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400">${tag}</span>`;
      }
    }

    let archHtml = '';
    if (project.architecture) {
      for (const step of project.architecture) {
        if (step && step.trim()) {
          archHtml += `
                  <div class="flex items-start gap-2 font-mono text-xs">
                    <span class="text-[var(--accent)]">▸</span>
                    <span class="text-[var(--muted)]">${escapeHtml(step)}</span>
                  </div>`;
        }
      }
    }

    let flipButtonHtml = '';
    let backCardHtml = '';
    
    const hasArch = archHtml.trim().length > 0;
    const hasProblem = project.problem && project.problem.trim().length > 0;
    const hasFix = project.fix && project.fix.trim().length > 0;

    // Only generate the back of the card if there is architecture, problem, or fix data
    if (hasArch || hasProblem || hasFix) {
      flipButtonHtml = `
                  <button onclick="flipCard(this)" class="text-xs font-mono flex items-center gap-1.5 text-[var(--accent)] hover:underline">
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i> flip
                  </button>`;
                  
      backCardHtml = `
              <!-- Back of the card (architecture and problem/solution) -->
              <div class="flip-card-back p-6 flex flex-col overflow-hidden">
                <p class="font-mono text-xs font-semibold mb-4 text-[var(--accent)] shrink-0">// architecture</p>
                <h3 class="font-mono text-[var(--accent)] font-bold mb-4 shrink-0">${escapeHtml(project.title)}</h3>

                <div class="flex-1 space-y-2 mb-4 overflow-y-auto pr-2 custom-scrollbar">${archHtml}
                </div>

                <div class="space-y-2 text-xs mb-4">
                  <div class="flex gap-2">
                    <span class="text-red-400 font-mono font-semibold shrink-0">Problem:</span>
                    <span class="text-slate-400">${escapeHtml(project.problem) || 'N/A'}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-green-400 font-mono font-semibold shrink-0">Fix:</span>
                    <span class="text-slate-400">${escapeHtml(project.fix) || 'N/A'}</span>
                  </div>
                </div>

                <button onclick="flipCard(this)" class="text-xs font-mono flex items-center gap-1.5 text-[var(--accent)] hover:underline self-end">
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i> flip back
                </button>
              </div>`;
    }

    gridHtml += `
          <!-- Project Card: ${project.title} -->
          <div class="flip-card h-[480px] sm:h-[450px] md:h-[420px]">
            <div class="flip-card-inner card-hover rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-text bg-[var(--surface)]">
              <!-- Front of the card (overview) -->
              <div class="flip-card-front p-6 flex flex-col overflow-hidden">
                <div class="shrink-0 group relative w-full h-32 rounded-lg border border-[var(--border)] mb-4 flex items-center justify-center overflow-hidden cursor-zoom-in" onclick="window.openImageModal('${project.image}')">
                  <img src="${project.image}" alt="Project Architecture Diagram" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.onerror=null; this.src='assets/img/default-project.png';">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i data-lucide="zoom-in" class="w-6 h-6 text-white"></i>
                  </div>
                </div>
                
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 class="font-mono text-lg font-bold mb-2 text-[var(--accent)]">${escapeHtml(project.title)}</h3>
                  <p class="text-[var(--muted)] text-sm mb-4 leading-relaxed">${escapeHtml(project.description)}</p>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">${tagsHtml}
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex gap-4 text-sm">
                    <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-[var(--accent)] hover:underline">
                      <i data-lucide="github" class="w-4 h-4"></i> Code
                    </a>
                  </div>${flipButtonHtml}
                </div>
              </div>${backCardHtml}
            </div>
          </div>`;
  }
  
  config.PROJECTS_GRID = gridHtml;

  let terminalProjects = [];
  for (let i = 0; i < config.PROJECTS.length; i++) {
    terminalProjects.push(`${i + 1}. ${config.PROJECTS[i].title}`);
  }
  terminalProjects.push("");
  terminalProjects.push("Run 'open projects' to jump to the section.");
  config.TERMINAL_PROJECTS = terminalProjects;
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

  // 1.5 Generate Dynamic HTML Components
  config.SKILLS_GRID = generateSkillsHtml(config);
  config.EXPERIENCE_TIMELINE = generateExperienceHtml(config);
  config.CERTIFICATIONS_GRID = generateCertificationsHtml(config);
  config.CONTACT_LINKS_GRID = generateContactLinksHtml(config);
  config.HIRE_ME_BUTTON = generateHireMeHtml(config);
  generateProjectsHtml(config);

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
  let mainJsContent = fs.readFileSync(mainJsTemplatePath, 'utf8');
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