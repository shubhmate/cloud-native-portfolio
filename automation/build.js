const fs = require('fs');
const path = require('path');

// The script is in the "automation" directory, so the project root is one level up
const projectRoot = path.join(__dirname, '..'); 

const configPath = path.join(projectRoot, 'config', 'site-config.json'); 
const indexTemplatePath = path.join(projectRoot, 'src', 'templates', 'index.html');
const resumeTemplatePath = path.join(projectRoot, 'src', 'templates', 'resume.html');

const distPath = path.join(projectRoot, 'dist');
const indexDistPath = path.join(distPath, 'index.html'); 
const resumeDistPath = path.join(distPath, 'resume.html');

const mainCssTemplatePath = path.join(projectRoot, 'src', 'styles', 'main.css'); 
const mainCssDistPath = path.join(distPath, 'assets', 'css', 'main.css');

const mainJsTemplatePath = path.join(projectRoot, 'src', 'scripts', 'main.js'); 
const mainJsDistPath = path.join(distPath, 'assets', 'js', 'main.js');

const commandsTemplatePath = path.join(projectRoot, 'src', 'scripts', 'commands.json'); 
const commandsDistPath = path.join(distPath, 'assets', 'js', 'commands.json');

const clientConfigPath = path.join(distPath, 'assets', 'config.json'); 
const assetsSrcPath = path.join(projectRoot, 'src', 'assets');
const assetsDistPath = path.join(distPath, 'assets');

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================================
   1. HERO SECTION GENERATORS
   ========================================================================= */

function generateHeroSocialLinksHtml(config) {
  if (!config.CONTACT_LINKS) return '';

  return config.CONTACT_LINKS
    .filter(link => link.type === 'link')
    .map(link => `
          <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(link.label)} profile" class="hover:text-[var(--accent)] transition-all hover:scale-110">
            <i data-lucide="${link.icon}" class="w-6 h-6"></i>
          </a>`).join('');
}

function generateHireMeHtml(config) {
  const text = config.HIRE_ME_TEXT || 'HIRE ME';
  const parts = text.split(' ');
  
  // Pulse dot at the start, followed by the text parts
  let html = `<span class="pulse-dot"></span>`;
  parts.forEach((part, index) => {
    html += `<span class="hire-part-${index + 1}">${escapeHtml(part)}</span>`;
  });
  
  return html;
}

/* =========================================================================
   2. EXPERIENCE & CREDENTIALS GENERATORS
   ========================================================================= */

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

function generateCertificationsHtml(config) {
  if (!config.CERTIFICATIONS) return '';

  return config.CERTIFICATIONS.map(cert => `
              <div class="p-4 rounded-xl border border-${cert.color}-400/30 bg-${cert.color}-400/5 card-hover">
                <i data-lucide="award" class="w-5 h-5 mb-2 text-${cert.color}-400"></i>
                <p class="font-mono text-xs font-semibold leading-tight">${escapeHtml(cert.name)}</p>
                <p class="text-xs text-[var(--muted)] mt-1">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.status)}</p>
              </div>`).join('');
}

/* =========================================================================
   3. SKILLS SECTION GENERATORS
   ========================================================================= */

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
    const color = (config.SKILLS_COLORS && config.SKILLS_COLORS[category]) || 'blue';
    gridHtml += `
              <div class="p-4 rounded-xl border border-${color}-400/30 bg-${color}-400/5 card-hover">
                <p class="font-mono text-xs font-semibold mb-3 text-${color}-400 leading-tight">${category}</p>
                <div class="flex flex-wrap gap-2">`;
    for (const skill of skills) {
      gridHtml += `
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="${skill.icon}" class="w-3 h-3 text-${color}-400"></i>
                    <span class="text-xs text-[var(--muted)]">${skill.name}</span>
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

/* =========================================================================
   4. PROJECTS SECTION GENERATORS
   ========================================================================= */

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

                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 class="font-mono text-[var(--accent)] font-bold mb-4">${escapeHtml(project.title)}</h3>
                  <div class="space-y-2 mb-4">
                    ${archHtml}
                  </div>

                  <div class="space-y-4 text-xs mb-4">
                    <div class="flex flex-col gap-1">
                      <span class="text-red-400 font-mono font-semibold uppercase tracking-wider">Problem:</span>
                      <span class="text-slate-400 leading-relaxed">${escapeHtml(project.problem) || 'N/A'}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-green-400 font-mono font-semibold uppercase tracking-wider">Fix:</span>
                      <span class="text-slate-400 leading-relaxed">${escapeHtml(project.fix) || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <button onclick="flipCard(this)" class="text-xs font-mono flex items-center gap-1.5 text-[var(--accent)] hover:underline self-end mt-4 shrink-0">
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i> flip back
                </button>
              </div>`;
    }

    gridHtml += `
          <!-- Project Card: ${project.title} -->
          <div class="flip-card h-[520px] sm:h-[480px] md:h-[450px]">
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
                  <h3 class="font-mono text-lg font-bold mb-2 text-[var(--accent)] line-clamp-3" title="${escapeHtml(project.title)}">${escapeHtml(project.title)}</h3>
                  <p class="text-[var(--muted)] text-sm mb-4 leading-relaxed">${escapeHtml(project.description)}</p>
                </div>
                
                <div class="flex flex-wrap gap-2 mt-2 mb-2">${tagsHtml}
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

/* =========================================================================
   5. PIPELINE SECTION GENERATORS
   ========================================================================= */

function generatePipelineStepsHtml(config) {
  if (!config.PIPELINE_STEPS) return '';

  return config.PIPELINE_STEPS.map((step, index) => {
    const isLast = index === config.PIPELINE_STEPS.length - 1;
    let stepHtml = `
              <!-- Step ${index + 1}: ${escapeHtml(step.title)} -->
              <div class="flex flex-col items-center gap-3 md:gap-2 shrink-0">
                <div class="p-3 rounded-xl border bg-${step.color}-400/10 border-${step.color}-400/30 shrink-0 hover:scale-110 transition-transform">
                  <i data-lucide="${step.icon}" class="w-6 h-6 text-${step.color}-400"></i>
                </div>
                <div class="text-center">
                  <p class="font-mono text-sm font-semibold text-${step.color}-400">${escapeHtml(step.title)}</p>
                  <p class="text-xs text-[var(--muted)] max-w-[140px]">${escapeHtml(step.description)}</p>
                </div>
              </div>`;

    if (!isLast) {
      stepHtml += `
              <!-- Responsive Arrow -->
              <div class="flex items-center justify-center my-2 md:mx-2 shrink-0">
                <i data-lucide="arrow-down" class="w-6 h-6 text-border block md:hidden"></i>
                <i data-lucide="arrow-right" class="w-6 h-6 text-border hidden md:block"></i>
              </div>`;
    }
    return stepHtml;
  }).join('');
}

/* =========================================================================
   6. CONTACT & FOOTER GENERATORS
   ========================================================================= */

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

function generateFooterLinksHtml(config) {
  if (!config.CONTACT_LINKS) return '';

  return config.CONTACT_LINKS
    .filter(link => link.type === 'link')
    .map(link => `
            <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" class="text-[var(--muted)] hover:text-[var(--accent)] transition-all hover:scale-110">
              <i data-lucide="${link.icon}" class="w-4 h-4"></i>
            </a>`).join('');
}

/* =========================================================================
   7. CORE BUILD ENGINE
   ========================================================================= */

function applyReplacements(content, config) {
  let modifiedContent = content;
  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      let value = config[key];
      const templatePlaceholder = `{{${key}}}`;
      
      // If the value is an object or array, stringify it to a JSON literal
      if (typeof value === 'object' && value !== null) {
        const stringifiedValue = JSON.stringify(value);
        
        // Handle quoted placeholders: "{{KEY}}" -> JSON_LITERAL
        const quotedPlaceholder = `"${templatePlaceholder}"`;
        if (modifiedContent.includes(quotedPlaceholder)) {
          modifiedContent = modifiedContent.split(quotedPlaceholder).join(stringifiedValue);
        } else {
          modifiedContent = modifiedContent.split(templatePlaceholder).join(stringifiedValue);
        }
      } else {
        // Regular string replacement (using split/join to avoid Regex special characters)
        modifiedContent = modifiedContent.split(templatePlaceholder).join(value);
      }
    }
  }
  return modifiedContent;
}

try {
  // 1. Read configuration
  const configRaw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw);

  console.log('🚀 Starting Professional Build Process...');

  // 1.5 Generate Dynamic HTML Components
  config.SKILLS_GRID = generateSkillsHtml(config);
  config.EXPERIENCE_TIMELINE = generateExperienceHtml(config);
  config.CERTIFICATIONS_GRID = generateCertificationsHtml(config);
  config.CONTACT_LINKS_GRID = generateContactLinksHtml(config);
  config.FOOTER_SOCIAL_LINKS = generateFooterLinksHtml(config);
  config.HERO_SOCIAL_LINKS = generateHeroSocialLinksHtml(config);
  config.PIPELINE_STEPS_GRID = generatePipelineStepsHtml(config);
  config.HIRE_ME_BUTTON = generateHireMeHtml(config);
  generateProjectsHtml(config);
  
  // Inject Terminal Data
  config.VIRTUAL_FILES_DATA = config.VIRTUAL_FILES || {};
  // Create a version specifically escaped for inclusion in a JS single-quoted string literal
  config.VIRTUAL_FILES_DATA_JSON = JSON.stringify(config.VIRTUAL_FILES_DATA)
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "\\'");  // Escape single quotes

  // 1.6 Generate Terminal Components
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentDay = new Date().getDate().toString().padStart(2, ' ');
  
  config.TERMINAL_LS_OUTPUT = [
    `drwxr-xr-x  2 guest guest  4096 ${currentMonth} ${currentDay} 14:00 .`,
    `drwxr-xr-x 22 root  root   4096 ${currentMonth} ${currentDay} 10:30 ..`,
    `-rw-r--r--  1 guest guest   450 ${currentMonth} ${currentDay} 14:12 infrastructure.tf`,
    `-rw-r--r--  1 guest guest   320 ${currentMonth} ${currentDay} 14:15 deployment.yaml`,
    `-rw-r--r--  1 guest guest   210 ${currentMonth} ${currentDay} 14:20 monitoring.prom`,
    `-rw-r--r--  1 guest guest   128 ${currentMonth} ${currentDay} 14:22 secret.txt`,
    `-r--------  1 root  root     64 ${currentMonth} ${currentDay} 09:00 production.env`
  ];

  if (config.EXPERIENCE) {
    const terminalExp = [];
    config.EXPERIENCE.forEach((exp, index) => {
      const i = index + 1;
      // Flattened keys for specific use cases
      config[`EXP_${i}_ROLE`] = exp.role;
      config[`EXP_${i}_COMPANY`] = exp.company;
      config[`EXP_${i}_START`] = exp.start;
      config[`EXP_${i}_END`] = exp.end;
      config[`EXP_${i}_TYPE`] = exp.type;

      // Full list for the 'experience' command
      terminalExp.push(`${exp.role.padEnd(25, ' ')} ${exp.start} – ${exp.end}`);
    });
    config.TERMINAL_EXPERIENCE = terminalExp;
  }

  // 2. Ensure Dist Directories Exist
  const dirsToCreate = [
    distPath,
    path.join(distPath, 'assets'),
    path.join(distPath, 'assets', 'css'),
    path.join(distPath, 'assets', 'js'),
    path.join(distPath, 'assets', 'img')
  ];
  dirsToCreate.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 3. Process index.html
  let indexHtmlContent = fs.readFileSync(indexTemplatePath, 'utf8');
  indexHtmlContent = applyReplacements(indexHtmlContent, config);
  fs.writeFileSync(indexDistPath, indexHtmlContent, 'utf8');
  console.log('✔ dist/index.html generated.');

  // 4. Process resume.html (New professional workflow)
  if (fs.existsSync(resumeTemplatePath)) {
    let resumeContent = fs.readFileSync(resumeTemplatePath, 'utf8');
    resumeContent = applyReplacements(resumeContent, config);
    fs.writeFileSync(resumeDistPath, resumeContent, 'utf8');
    console.log('✔ dist/resume.html generated.');
  }
  
  // 5. CSS is handled by Tailwind CLI (see package.json)

  // 6. Process assets/js/main.js
  let mainJsContent = fs.readFileSync(mainJsTemplatePath, 'utf8');
  mainJsContent = applyReplacements(mainJsContent, config);
  fs.writeFileSync(mainJsDistPath, mainJsContent, 'utf8');
  console.log('✔ dist/assets/js/main.js generated.');

  // 7. Process assets/js/commands.json
  let commandsContent = fs.readFileSync(commandsTemplatePath, 'utf8');
  commandsContent = applyReplacements(commandsContent, config);
  fs.writeFileSync(commandsDistPath, commandsContent, 'utf8');
  console.log('✔ dist/assets/js/commands.json generated.');
  
  // 8. Copy static assets from src/assets to dist/assets
  if (fs.existsSync(assetsSrcPath)) {
    // Helper to copy directory recursively
    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(assetsSrcPath, assetsDistPath);
    console.log('✔ Static assets synced to dist.');
  }

  // 9. Copy config.json to dist/assets/ for client-side fetching
  fs.copyFileSync(configPath, clientConfigPath);
  console.log('✔ config.json copied to dist/assets/config.json.');

  console.log('\n✨ Build complete! Your production-ready site is in the /dist folder.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}