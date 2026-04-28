/**
 * =============================================================================
 * SITE BUILD AUTOMATION ENGINE
 * =============================================================================
 * This script transforms templates and site-config.json into a production-ready
 * static website. It handles dynamic HTML generation, placeholder replacement,
 * and build validation.
 * 
 * Logic Flow:
 * 1. Load config & paths
 * 2. Generate dynamic HTML components (Projects, Experience, etc.)
 * 3. Replace placeholders in templates
 * 4. Validate output integrity
 * 5. Sync static assets
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

/* =========================================================================
   1. CONFIGURATION & PATHS
   ========================================================================= */

const PROJECT_ROOT = path.join(__dirname, '..');

const PATHS = {
  config: path.join(PROJECT_ROOT, 'config', 'site-config.json'),
  dist: path.join(PROJECT_ROOT, 'dist'),
  templates: {
    index: path.join(PROJECT_ROOT, 'src', 'templates', 'index.html'),
    resume: path.join(PROJECT_ROOT, 'src', 'templates', 'resume.html'),
    mainCss: path.join(PROJECT_ROOT, 'src', 'styles', 'main.css'),
    mainJs: path.join(PROJECT_ROOT, 'src', 'scripts', 'main.js'),
    commands: path.join(PROJECT_ROOT, 'src', 'scripts', 'commands.json'),
    assets: path.join(PROJECT_ROOT, 'src', 'assets')
  },
  output: {
    index: path.join(PROJECT_ROOT, 'dist', 'index.html'),
    resume: path.join(PROJECT_ROOT, 'dist', 'resume.html'),
    mainCss: path.join(PROJECT_ROOT, 'dist', 'assets', 'css', 'main.css'),
    mainJs: path.join(PROJECT_ROOT, 'dist', 'assets', 'js', 'main.js'),
    commands: path.join(PROJECT_ROOT, 'dist', 'assets', 'js', 'commands.json'),
    clientConfig: path.join(PROJECT_ROOT, 'dist', 'assets', 'config.json'),
    assets: path.join(PROJECT_ROOT, 'dist', 'assets')
  }
};

const DEFAULT_CONFIG = {
  "PERSON_NAME": "Shubham Mate",
  "JOB_TITLE": "DevOps Engineer",
  "SITE_LOGO_TEXT": "devops.sh",
  "PRELOADER_TEXT": "Initializing...",
  "NAV_HOME": "Home",
  "NAV_ABOUT": "About",
  "NAV_EXPERIENCE": "Experience",
  "NAV_STACK": "Stack",
  "NAV_PROJECTS": "Projects",
  "NAV_PIPELINE": "Pipeline",
  "NAV_CONTACT": "Contact",
  "NAV_RESUME": "Resume",
  "HIRE_ME_TEXT": "HIRE ME",
  "HERO_SUBTITLE": "DevOps Engineer",
  "YEARS_EXPERIENCE": "2+ years",
  "SECTION_PROJECTS_TITLE": "Featured Projects",
  "PROJECTS_FLIP_HINT": "click to flip"
};

/* =========================================================================
   2. UTILITY HELPERS
   ========================================================================= */

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Recursively copies a directory to a destination.
 */
function copyRecursiveSync(src, dest) {
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
}

/**
 * Validates that all {{tags}} were replaced in the final file.
 * THROWS if any placeholder is unreplaced — stops build before writing to dist/.
 */
function validateContentIntegrity(content, fileName) {
  const placeholderRegex = /\{\{([A-Z0-9_]+)\}\}/g;
  const matches = [...content.matchAll(placeholderRegex)];
  if (matches.length > 0) {
    const missingKeys = [...new Set(matches.map(m => m[1]))];
    console.error(`\n❌ BUILD BLOCKED: Unreplaced placeholders found in ${fileName}:`);
    missingKeys.forEach(key => console.error(`   - {{${key}}}`));
    console.error(`\n   Fix: Add the missing key(s) to config/site-config.json\n`);
    throw new Error(`Missing ${missingKeys.length} placeholder(s) in ${fileName}. Build stopped to protect dist/.`);
  }
}

/* =========================================================================
   3. DYNAMIC HTML GENERATORS
   ========================================================================= */

/**
 * Generates Social Links for the Hero section.
 */
function generateHeroSocialLinks(config) {
  if (!config.CONTACT_LINKS) return '';
  return config.CONTACT_LINKS
    .filter(link => link.type === 'link')
    .map(link => `
          <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(link.label)} profile" class="hover:text-[var(--accent)] transition-all hover:scale-110">
            <i data-lucide="${link.icon}" class="w-6 h-6"></i>
          </a>`).join('');
}

/**
 * Generates the "Hire Me" button with specific animation parts.
 */
function generateHireMeButton(config) {
  const text = config.HIRE_ME_TEXT || 'HIRE ME';
  const parts = text.split(' ');
  let html = `<span class="pulse-dot"></span>`;
  parts.forEach((part, index) => {
    html += `<span class="hire-part-${index + 1}">${escapeHtml(part)}</span>`;
  });
  return html;
}

/**
 * Generates Desktop/Mobile Navigation links.
 */
function generateNavigation(config, type = 'desktop') {
  const items = config.NAV_ITEMS || [];
  if (type === 'desktop') {
    return items.map(item => {
      if (item.type === 'button') {
        return `<a href="${item.href}" class="px-4 py-2 border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white font-mono text-sm rounded-lg transition-colors" aria-label="${item.label}">${item.label}</a>`;
      }
      return `<a href="${item.href}" class="font-mono text-sm text-[var(--accent)] hover:scale-110 transition-colors">${item.label}</a>`;
    }).join('\n        ');
  }
  return items.map(item => {
    if (item.type === 'button') {
      return `<a href="${item.href}" class="block px-2 py-1 w-fit font-mono text-sm text-[var(--green)] transition-colors border border-[var(--green)] rounded-lg" aria-label="${item.label}">${item.label}</a>`;
    }
    return `<a href="${item.href}" class="block font-mono text-sm text-[var(--accent)] transition-colors py-1">${item.label}</a>`;
  }).join('\n      ');
}

/**
 * Generates Work Experience Timeline HTML.
 */
function generateExperience(config) {
  if (!config.EXPERIENCE) return '';
  return config.EXPERIENCE.map((exp, index) => {
    const bulletsHtml = exp.bullets.map(bullet => `
                    <li class="text-sm text-[var(--muted)] flex gap-2">
                      <span class="text-[var(--accent)] shrink-0">▸</span>
                      ${escapeHtml(bullet)}
                    </li>`).join('');

    return `
                <!-- Experience Item ${index + 1} -->
                <div class="relative">
                  <div class="absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]"></div>
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="font-mono font-semibold text-[var(--accent)]">${escapeHtml(exp.role)}</h3> 
                    ${exp.end.toLowerCase() === 'present' ? '<span class="px-2 py-0.5 rounded text-xs font-mono bg-green-400/10 text-green-400">Full-time</span>' : `<span class="px-2 py-0.5 rounded text-xs font-mono bg-[var(--accent)]/10 text-[var(--accent)]">${escapeHtml(exp.type)}</span>`}
                  </div>
                  <p class="text-xs text-[var(--accent)] font-mono mb-1">@ ${escapeHtml(exp.company)}</p>
                  <p class="text-xs text-[var(--muted)] font-mono mb-3">${escapeHtml(exp.start)} – ${escapeHtml(exp.end)}</p>
                  <ul class="space-y-1.5">${bulletsHtml}</ul>
                </div>`;
  }).join('');
}

/**
 * Generates Professional Credentials Grid HTML.
 */
function generateCertificationsHtml(config) {
  if (!config.CERTIFICATIONS) return '';
  return config.CERTIFICATIONS.map(cert => `
              <div class="p-4 rounded-xl border border-${cert.color}-400/30 bg-${cert.color}-400/5 card-hover">
                <i data-lucide="award" class="w-5 h-5 mb-2 text-${cert.color}-400"></i>
                <p class="font-mono text-xs font-semibold leading-tight">${escapeHtml(cert.name)}</p>
                <p class="text-xs text-[var(--muted)] mt-1">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.status)}</p>
              </div>`).join('');
}

/**
 * Generates Skills Grid and Marquee HTML.
 */
function generateSkills(config) {
  if (!config.SKILLS_GROUPED) return '';

  // 1. Marquee
  config.SKILLS_MARQUEE = Object.values(config.SKILLS_GROUPED).flat().map(skill => `
            <div class="flex flex-col items-center gap-2 px-4 py-3 rounded-lg hover:border-[var(--accent)]/50 hover:scale-105 transition-all min-w-[80px] group card-hover">
              <i data-lucide="${skill.icon}" class="w-7 h-7 transition-colors group-hover:scale-110 transition-transform"></i>
              <span class="text-xs text-center font-mono">${skill.name}</span>
            </div>`).join('');

  // 2. Grid
  config.SKILLS_GRID = Object.entries(config.SKILLS_GROUPED).map(([category, skills]) => {
    const color = (config.SKILLS_COLORS && config.SKILLS_COLORS[category]) || 'blue';
    const skillList = skills.map(skill => `
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="${skill.icon}" class="w-3 h-3 text-${color}-400"></i>
                    <span class="text-xs text-[var(--muted)]">${skill.name}</span>
                  </div>`).join('');

    return `
              <div class="p-4 rounded-xl border border-${color}-400/30 bg-${color}-400/5 card-hover">
                <p class="font-mono text-xs font-semibold mb-3 text-${color}-400 leading-tight">${category}</p>
                <div class="flex flex-wrap gap-2">${skillList}</div>
              </div>`;
  }).join('');

  // 3. Terminal output
  config.TERMINAL_SKILLS = Object.entries(config.SKILLS_GROUPED).map(([category, skills]) => {
    return `${category.padEnd(16, ' ')}→ ${skills.map(s => s.name).join(', ')}`;
  });

  return config.SKILLS_GRID;
}

/**
 * Generates Projects Grid HTML with flip-card logic.
 */
function generateProjects(config) {
  if (!config.PROJECTS) return;

  config.PROJECTS_GRID = config.PROJECTS.map(project => {
    const tagsHtml = (project.tags || []).map(tag => `\n                  <span class="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400">${tag}</span>`).join('');
    const archHtml = (project.architecture || []).map(step => `
                  <div class="flex items-start gap-2 font-mono text-xs">
                    <span class="text-[var(--accent)]">▸</span>
                    <span class="text-[var(--muted)]">${escapeHtml(step)}</span>
                  </div>`).join('');

    const hasBack = archHtml.trim().length > 0 || project.problem || project.fix;
    const flipButton = hasBack ? `
                  <button onclick="flipCard(this)" class="text-xs font-mono flex items-center gap-1.5 text-[var(--accent)] hover:underline">
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i> flip
                  </button>` : '';

    const backCard = hasBack ? `
              <div class="flip-card-back p-6 flex flex-col overflow-hidden">
                <p class="font-mono text-xs font-semibold mb-4 text-[var(--accent)] shrink-0">// architecture</p>
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 class="font-mono text-[var(--accent)] font-bold mb-4">${escapeHtml(project.title)}</h3>
                  <div class="space-y-2 mb-4">${archHtml}</div>
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
              </div>` : '';

    return `
          <!-- Project: ${project.title} -->
          <div class="flip-card h-[520px] sm:h-[480px] md:h-[450px]">
            <div class="flip-card-inner card-hover rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors bg-[var(--surface)]">
              <div class="flip-card-front p-6 flex flex-col overflow-hidden">
                <div class="shrink-0 group relative w-full h-32 rounded-lg border border-[var(--border)] mb-4 flex items-center justify-center overflow-hidden cursor-zoom-in" onclick="window.openImageModal('${project.image}')">
                  <img src="${project.image}" alt="Project Architecture" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.onerror=null; this.src='assets/img/default-project.png';">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i data-lucide="zoom-in" class="w-6 h-6 text-white"></i></div>
                </div>
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 class="font-mono text-lg font-bold mb-2 text-[var(--accent)] line-clamp-3">${escapeHtml(project.title)}</h3>
                  <p class="text-[var(--muted)] text-sm mb-4 leading-relaxed">${escapeHtml(project.description)}</p>
                </div>
                <div class="flex flex-wrap gap-2 mt-2 mb-2">${tagsHtml}</div>
                <div class="flex items-center justify-between">
                  <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-[var(--accent)] hover:underline text-sm"><i data-lucide="github" class="w-4 h-4"></i> Code</a>
                  ${flipButton}
                </div>
              </div>${backCard}
            </div>
          </div>`;
  }).join('');

  config.TERMINAL_PROJECTS = config.PROJECTS.map((p, i) => `${i + 1}. ${p.title}`);
  config.TERMINAL_PROJECTS.push("", "Run 'open projects' to jump to the section.");
}

/**
 * Generates CI/CD Pipeline visualization HTML.
 */
function generatePipeline(config) {
  if (!config.PIPELINE_STEPS) return '';
  return config.PIPELINE_STEPS.map((step, index) => {
    const isLast = index === config.PIPELINE_STEPS.length - 1;
    const arrow = isLast ? '' : `
              <div class="flex items-center justify-center my-2 md:mx-2 shrink-0">
                <i data-lucide="arrow-down" class="w-6 h-6 text-border block md:hidden"></i>
                <i data-lucide="arrow-right" class="w-6 h-6 text-border hidden md:block"></i>
              </div>`;

    return `
              <div class="flex flex-col items-center gap-3 md:gap-2 shrink-0">
                <div class="p-3 rounded-xl border bg-${step.color}-400/10 border-${step.color}-400/30 shrink-0 hover:scale-110 transition-transform">
                  <i data-lucide="${step.icon}" class="w-6 h-6 text-${step.color}-400"></i>
                </div>
                <div class="text-center">
                  <p class="font-mono text-sm font-semibold text-${step.color}-400">${escapeHtml(step.title)}</p>
                  <p class="text-xs text-[var(--muted)] max-w-[140px]">${escapeHtml(step.description)}</p>
                </div>
              </div>${arrow}`;
  }).join('');
}

/**
 * Generates Contact and Footer links.
 */
function generateContactUI(config, type = 'grid') {
  if (!config.CONTACT_LINKS) return '';
  if (type === 'footer') {
    return config.CONTACT_LINKS
      .filter(link => link.type === 'link')
      .map(link => `
            <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" class="text-[var(--muted)] hover:text-[var(--accent)] transition-all hover:scale-110">
              <i data-lucide="${link.icon}" class="w-4 h-4"></i>
            </a>`).join('');
  }
  return config.CONTACT_LINKS.map(link => {
    const isCopy = link.type === 'copy';
    const tag = isCopy ? 'button' : 'a';
    const attrs = isCopy ? `onclick="copyToClipboard('${escapeHtml(link.value)}', event)" title="Click to copy"` : `href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(link.label)}"`;
    return `
              <${tag} ${attrs} class="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group ${isCopy ? 'copy-btn w-full text-left' : ''}">
                <div class="p-2 rounded-lg border border-[var(--border)] group-hover:border-[var(--accent)] bg-[var(--surface)]">
                  <i data-lucide="${link.icon}" class="w-4 h-4"></i>
                </div>
                <span class="font-mono text-sm">${escapeHtml(link.value)}</span>
              </${tag}>`;
  }).join('');
}

/* =========================================================================
   4. CORE REPLACEMENT ENGINE
   ========================================================================= */

function applyReplacements(content, config) {
  let modifiedContent = content;
  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      const value = config[key];
      const placeholder = `{{${key}}}`;
      
      if (typeof value === 'object' && value !== null) {
        const stringified = JSON.stringify(value);
        const quotedPlaceholder = `"${placeholder}"`;
        if (modifiedContent.includes(quotedPlaceholder)) {
          modifiedContent = modifiedContent.split(quotedPlaceholder).join(stringified);
        } else {
          modifiedContent = modifiedContent.split(placeholder).join(stringified);
        }
      } else {
        modifiedContent = modifiedContent.split(placeholder).join(value);
      }
    }
  }
  return modifiedContent;
}

/* =========================================================================
   5. MAIN BUILD PROCESS
   ========================================================================= */

async function build() {
  try {
    console.log('🚀 Starting Professional Build Process...');

    // 1. Setup Configuration
    let userConfig = {};
    if (fs.existsSync(PATHS.config)) {
      userConfig = JSON.parse(fs.readFileSync(PATHS.config, 'utf8'));
    }
    
    // 1.1 Extract Version from package.json or Git
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    let rawVersion = '';
    try {
      const { execSync } = require('child_process');
      rawVersion = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch (e) {
      rawVersion = pkg.version;
    }
    
    // Strip 'v' and any suffixes to get clean numeric version (e.g. 1.3.0)
    const versionMatch = rawVersion.match(/(\d+\.\d+\.?\d*)/);
    const gitVersion = versionMatch ? versionMatch[0] : rawVersion;
    
    const config = { 
      ...DEFAULT_CONFIG, 
      ...userConfig,
      SITE_VERSION: gitVersion 
    };

    console.log(`🚀 Starting Professional Build Process [${gitVersion}]...`);
    config.NAV_DESKTOP = generateNavigation(config, 'desktop');
    config.NAV_MOBILE = generateNavigation(config, 'mobile');
    config.SKILLS_GRID = generateSkills(config);
    config.EXPERIENCE_TIMELINE = generateExperience(config);
    config.CERTIFICATIONS_GRID = generateCertificationsHtml(config); // Keeping old name for compatibility
    config.CONTACT_LINKS_GRID = generateContactUI(config, 'grid');
    config.FOOTER_SOCIAL_LINKS = generateContactUI(config, 'footer');
    config.HERO_SOCIAL_LINKS = generateHeroSocialLinks(config);
    config.PIPELINE_STEPS_GRID = generatePipeline(config);
    config.HIRE_ME_BUTTON = generateHireMeButton(config);
    generateProjects(config);

    // 3. Inject Terminal Data
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
    const currentDay = new Date().getDate().toString().padStart(2, ' ');
    
    config.VIRTUAL_FILES_DATA = config.VIRTUAL_FILES || {};
    config.VIRTUAL_FILES_DATA_JSON = JSON.stringify(config.VIRTUAL_FILES_DATA).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    if (config.EXPERIENCE) {
      config.TERMINAL_EXPERIENCE = config.EXPERIENCE.map(exp => `${exp.role.padEnd(25, ' ')} ${exp.start} – ${exp.end}`);
    }

    // 4. Ensure Output Directories
    [PATHS.dist, PATHS.output.assets, path.join(PATHS.output.assets, 'css'), path.join(PATHS.output.assets, 'js'), path.join(PATHS.output.assets, 'img')]
      .forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

    // 5. Process Files
    const filesToProcess = [
      { src: PATHS.templates.index, dest: PATHS.output.index, name: 'index.html' },
      { src: PATHS.templates.resume, dest: PATHS.output.resume, name: 'resume.html' },
      { src: PATHS.templates.mainJs, dest: PATHS.output.mainJs, name: 'main.js' },
      { src: PATHS.templates.commands, dest: PATHS.output.commands, name: 'commands.json' }
    ];

    filesToProcess.forEach(file => {
      if (fs.existsSync(file.src)) {
        let content = fs.readFileSync(file.src, 'utf8');
        content = applyReplacements(content, config);
        validateContentIntegrity(content, `dist/${file.name}`);
        fs.writeFileSync(file.dest, content, 'utf8');
        console.log(`✔ Generated: ${file.name}`);
      }
    });

    // 6. Final Sync
    if (fs.existsSync(PATHS.templates.assets)) {
      copyRecursiveSync(PATHS.templates.assets, PATHS.output.assets);
      console.log('✔ Static assets synced.');
    }
    fs.copyFileSync(PATHS.config, PATHS.output.clientConfig);
    console.log('✔ Client configuration synced.');

    console.log('\n✨ Build complete! Your site is ready in /dist');

  } catch (error) {
    console.error('❌ Build failed:', error.stack);
    process.exit(1);
  }
}

build();