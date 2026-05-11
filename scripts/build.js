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
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

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
    resumePdf: path.join(PROJECT_ROOT, 'src', 'templates', 'resume-pdf-template.html'),
    projects: path.join(PROJECT_ROOT, 'src', 'templates', 'projects.html'),
    mainCss: path.join(PROJECT_ROOT, 'src', 'styles', 'main.css'),
    mainJs: path.join(PROJECT_ROOT, 'src', 'scripts', 'main.js'),
    commands: path.join(PROJECT_ROOT, 'src', 'scripts', 'commands.json'),
    assets: path.join(PROJECT_ROOT, 'src', 'assets')
  },
  output: {
    index: path.join(PROJECT_ROOT, 'dist', 'index.html'),
    resume: path.join(PROJECT_ROOT, 'dist', 'resume.html'),
    resumePdf: path.join(PROJECT_ROOT, 'dist', 'resume-pdf.html'),
    mainCss: path.join(PROJECT_ROOT, 'dist', 'assets', 'css', 'main.css'),
    mainJs: path.join(PROJECT_ROOT, 'dist', 'assets', 'js', 'main.js'),
    commands: path.join(PROJECT_ROOT, 'dist', 'assets', 'js', 'commands.json'),
    clientConfig: path.join(PROJECT_ROOT, 'dist', 'assets', 'config.json'),
    assets: path.join(PROJECT_ROOT, 'dist', 'assets')
  }
};

/* =========================================================================
   2. GLOBAL DESIGN SYSTEM (3D ARCHITECTURE)
   ========================================================================= */

const DISH_CLASSES = `flex items-center justify-center rounded-full bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-md border border-white/20 text-[var(--accent)] transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_20px_rgba(0,0,0,0.4)]`;
const DISH_HOVER_CLASSES = `hover:scale-105 group-hover:scale-105 hover:border-white/30 group-hover:border-white/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95`;
const ICON_CLASSES_MD = `w-4 h-4 transition-transform group-hover:scale-110 drop-shadow-[0_0_5px_var(--accent)]`;
const ICON_CLASSES_LG = `w-6 h-6 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_var(--accent)]`;

const DEFAULT_CONFIG = {
  'PERSON_NAME': 'Shubham Mate',
  'JOB_TITLE': 'DevOps Engineer',
  'SITE_LOGO_TEXT': 'devops.sh',
  'PRELOADER_TEXT': 'Initializing devops.sh...',
  'HIRE_ME_TEXT': 'HIRE ME'
};

/**
 * Pre-calculates the professional resume link
 * @param {any} config 
 * @returns {string}
 */
const getResumeLink = (config) => {
  const fileName = config.RESUME_FILENAME || 'Shubham_Mate_Resume.pdf';
  return `assets/${fileName}`;
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
 * Recursively deletes a directory and its contents.
 */
function deleteRecursiveSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteRecursiveSync(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
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
    console.error('\n   Fix: Add the missing key(s) to config/site-config.json\n');
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
          <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" aria-label="Visit ${escapeHtml(link.label)} profile" class="group ${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-12 h-12">
            <i data-lucide="${link.icon}" class="${ICON_CLASSES_LG}"></i>
          </a>`).join('');
}

/**
 * Generates the "Hire Me" button with specific animation parts.
 */
function generateHireMeButton(config) {
  const text = config.HIRE_ME_TEXT || 'HIRE ME';
  const parts = text.split(' ');
  let html = '<span class="pulse-dot"></span>';
  parts.forEach((part, index) => {
    html += `<span class="hire-part-${index + 1}">${escapeHtml(part)}</span>`;
  });
  return html;
}

/**
 * Generates the FULL Navigation Navbar HTML (Standardized)
 */
function generateFullNavbar(config, activePage = 'home') {
  const items = config.NAV_ITEMS || [];
  const logoText = config.SITE_LOGO_TEXT || 'devops.sh';
  const isHomePage = activePage === 'index';

  // 1. Generate Desktop Links
  const desktopLinks = items.map(item => {
    const isActive = item.id === activePage;
    const activeClasses = isActive ? 'active' : '';

    // Fix: If we are on a sub-page, anchor links should point to index.html#section
    let href = item.href;
    if (!isHomePage && href.startsWith('#')) {
      href = `index.html${href}`;
    }

    if (item.type === 'button') {
      return `<a href="${href}" class="group px-4 py-2 border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white font-mono text-sm font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[var(--green)]/10" aria-label="${item.label}">${item.label}</a>`;
    }
    return `<a href="${href}" class="nav-link font-mono text-sm font-medium tracking-tight text-[var(--accent)] ${activeClasses}">${item.label}</a>`;
  }).join('\n        ');

  // 2. Generate Mobile Links
  const mobileLinks = items.map(item => {
    const isActive = item.id === activePage;
    const activeClasses = isActive ? 'active' : '';

    // Fix: If we are on a sub-page, anchor links should point to index.html#section
    let href = item.href;
    if (!isHomePage && href.startsWith('#')) {
      href = `index.html${href}`;
    }

    if (item.type === 'button') {
      return `<a href="${href}" class="block mt-4 px-4 py-2 w-fit font-mono text-sm font-bold text-[var(--green)] transition-all border border-[var(--green)] rounded-xl active:scale-95" aria-label="${item.label}">${item.label}</a>`;
    }
    return `<a href="${href}" class="nav-link block font-mono text-sm text-[var(--accent)] ${activeClasses} py-2 transition-all active:scale-95 active:pl-4">${item.label}</a>`;
  }).join('\n      ');

  return `
  <!-- Navbar (Industry Standard: Synchronized) -->
  <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--border)]">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <a href="${isHomePage ? '#home' : 'index.html'}" class="flex items-center gap-3 font-mono font-bold text-[var(--accent)] group">
        <div class="relative w-8 h-8 flex items-center justify-center">
          <i data-lucide="cloud" class="w-8 h-8 text-[var(--accent)] animate-pulse"></i>
          <i data-lucide="terminal" class="absolute w-3.5 h-3.5 text-[var(--accent)] top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"></i>
        </div>
        <span class="tracking-tight">${logoText}</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center gap-5 h-16">
        ${desktopLinks}
        <div class="h-6 w-px bg-[var(--border)] mx-2 opacity-50"></div>
        <button id="theme-toggle" aria-label="Toggle theme" class="theme-toggle ${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-10 h-10 text-[var(--accent)] group">
          <i data-lucide="sun" class="w-5 h-5 transition-transform duration-700 group-hover:rotate-[360deg]"></i>
        </button>
      </div>

      <!-- Mobile Controls -->
      <div class="flex items-center gap-2 lg:hidden">
        <button id="theme-toggle-mobile" aria-label="Toggle theme" class="theme-toggle ${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-10 h-10 text-[var(--accent)] group">
          <i data-lucide="sun" class="w-5 h-5 transition-transform duration-700 group-hover:rotate-[360deg]"></i>
        </button>
        <button id="mobile-menu-btn" aria-label="Toggle menu" class="mobile-menu-btn ${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-10 h-10 text-[var(--accent)] group">
          <div class="hamburger-box w-5 h-5 relative flex items-center justify-center">
            <div class="hamburger-inner"></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="lg:hidden bg-brand-bg/95 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 space-y-1 hidden">
      ${mobileLinks}
    </div>
  </nav>`;
}

/**
 * Generates the Global Image Zoom Modal (Standardized)
 */
function generateImageModal(config) {
  return `
  <!-- Image Zoom Modal (Executive Bottom-Tier Refinement) -->
  <div id="image-modal"
    class="fixed inset-0 z-[100] hidden bg-black/95 backdrop-blur-md items-center justify-center p-4 cursor-zoom-out"
    onclick="window.closeImageModal()">
    <div class="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6">
      <img id="modal-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        alt="Zoomed Project Image"
        class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 scale-95 opacity-0">
      
      <button onclick="window.closeImageModal()"
        class="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all hover:scale-110 active:scale-95 group shadow-2xl">
        <i data-lucide="x" class="w-6 h-6 transition-transform group-hover:rotate-90"></i>
      </button>
    </div>
  </div>`;
}

/**
 * Generates the FULL Global Footer HTML (Standardized)
 */
function generateFullFooter(config) {
  const personName = config.PERSON_NAME || 'Shubham Mate';
  const siteVersion = config.SITE_VERSION || '2.0.3';
  const techStack = config.FOOTER_TECH_STACK || '';
  const socialLinks = generateContactUI(config, 'footer');

  return `
    <!-- ==================== Footer (Industry Standard: Synchronized) ==================== -->
    <footer class="pb-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="mt-16 pt-8 border-t border-[var(--border)] flex flex-col items-center gap-4">
          <p class="font-mono text-xs text-[var(--muted)] text-center md:text-left">
            ${techStack}
          </p>
          <div class="flex items-center gap-4 text-[var(--muted)]">
            ${socialLinks}
          </div>
          <p class="font-mono text-xs text-[var(--muted)] text-center md:text-left">
            © <span id="current-year">2026</span> ${personName} · Made with ❤️
          </p> 
          <div class="flex items-center gap-2 mt-2">
            <p class="font-mono text-[10px] text-[var(--muted)] uppercase tracking-widest opacity-60">
              release: <span class="text-green-400 font-bold">${siteVersion}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>`;
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
                      ${bullet}
                    </li>`).join('');

    return `
                <!-- Experience Item ${index + 1} -->
                <div class="relative">
                  <div class="absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]"></div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <h3 class="font-mono font-semibold text-[var(--accent)]">${exp.role}</h3> 
                    ${exp.end.toLowerCase() === 'present' ? '<span class="px-2 py-0.5 rounded text-xs font-mono bg-green-400/10 text-green-400">Full-time</span>' : `<span class="px-2 py-0.5 rounded text-xs font-mono bg-[var(--accent)]/10 text-[var(--accent)]">${exp.type}</span>`}
                  </div>
                  <p class="text-xs text-[var(--accent)] font-mono mb-1 italic">@ ${exp.company}</p>
                  <p class="text-xs text-[var(--muted)] font-mono mb-3 italic">${exp.start} – ${exp.end}</p>
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
              <div class="p-4 rounded-xl border border-${cert.color}-400/30 bg-${cert.color}-400/5 card-hover flex flex-col justify-between h-full">
                <div>
                  <i data-lucide="award" class="w-5 h-5 mb-2 text-${cert.color}-400"></i>
                  <p class="font-mono text-xs font-semibold leading-tight">${cert.name}</p>
                  <p class="text-[10px] text-[var(--muted)] mt-1 mb-4">
                    ${cert.issuer} · ${cert.status}
                    ${cert.certId ? `<br/><span class="text-[var(--accent)]/60">ID: ${cert.certId}</span>` : ''}
                  </p>
                </div>
                ${cert.link ? `
                <a href="${cert.link}" target="_blank" rel="noopener noreferrer" class="mt-auto inline-flex items-center gap-1.5 text-[10px] font-mono text-${cert.color}-400 hover:underline">
                  <i data-lucide="external-link" class="w-3 h-3"></i> VERIFY
                </a>` : ''}
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

  // 1. Generate ALL projects for the Library page
  const allProjectsHtml = config.PROJECTS.map(project => generateProjectCard(project)).join('');
  config.PROJECTS_LIBRARY_GRID = allProjectsHtml;

  // 2. Generate only top 2 projects for the Home page
  const featuredProjectsHtml = config.PROJECTS.slice(0, 2).map(project => generateProjectCard(project)).join('');
  config.PROJECTS_GRID = featuredProjectsHtml;

  config.TERMINAL_PROJECTS = config.PROJECTS.map((p, i) => `${i + 1}. ${p.title}`);
  config.TERMINAL_PROJECTS.push('', 'Run \'open projects\' to jump to the section.');
}

/**
 * Internal helper to generate a single project card HTML.
 */
function generateProjectCard(project) {
  const tagsHtml = (project.tags || []).map(tag => `\n                  <span class="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400">${tag}</span>`).join('');
  const archHtml = (project.architecture || []).map(step => `
                <div class="flex items-start gap-2 font-mono text-xs">
                  <span class="text-[var(--accent)]">▸</span>
                  <span class="text-[var(--muted)]">${escapeHtml(step)}</span>
                </div>`).join('');

  const hasBack = archHtml.trim().length > 0 || project.problem || project.fix;
  const flipButton = hasBack ? `
                <button onclick="flipCard(this)" class="group flex items-center gap-1.5 px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg transition-all hover:scale-105 active:scale-95">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180"></i>
                  <span>Flip</span>
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
              <button onclick="flipCard(this)" class="group flex items-center gap-1.5 px-3 py-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg transition-all hover:scale-105 active:scale-95 self-end mt-4 shrink-0">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-180"></i>
                <span>Back</span>
              </button>
            </div>` : '';

  return `
        <!-- Project: ${project.title} -->
        <div class="flip-card h-[580px] sm:h-[540px] md:h-[520px]">
          <div class="flip-card-inner card-hover rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors bg-[var(--surface)]">
            <div class="flip-card-front p-6 flex flex-col overflow-hidden">
              <div class="shrink-0 group relative w-full h-32 rounded-lg border border-[var(--border)] mb-4 flex items-center justify-center overflow-hidden cursor-zoom-in" onclick="window.openImageModal('${project.image}')">
                <img src="${project.image}" alt="Project Architecture" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.onerror=null; this.src='assets/img/default-project.png';">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><i data-lucide="zoom-in" class="w-6 h-6 text-white"></i></div>
              </div>
              <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <h3 class="font-mono text-lg font-bold mb-2 text-[var(--accent)] line-clamp-3">${project.title}</h3>
                <p class="text-[var(--muted)] text-sm mb-4 leading-relaxed">${project.description}</p>
              </div>
              <div class="flex flex-wrap gap-2 mt-2 mb-2">${tagsHtml}</div>
              <div class="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/5 hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white text-[10px] uppercase tracking-wider font-mono font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm">
                  <i data-lucide="github" class="w-3.5 h-3.5 transition-transform group-hover:-rotate-12"></i>
                  <span>Code</span>
                </a>
                ${flipButton}
              </div>
            </div>${backCard}
          </div>
        </div>`;
}

/**
 * Generates CI/CD Pipeline visualization HTML.
 */
function generatePipeline(config) {
  if (!config.PIPELINE_STEPS) return '';
  return config.PIPELINE_STEPS.map((step, index) => {
    const isLast = index === config.PIPELINE_STEPS.length - 1;
    const arrow = isLast ? '' : `
              <div class="flex items-center justify-center my-2 md:mt-6 md:mx-2 shrink-0">
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
            <a href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" class="group ${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-11 h-11 text-[var(--accent)]" aria-label="${escapeHtml(link.label)}">
              <i data-lucide="${link.icon}" class="${ICON_CLASSES_MD}"></i>
            </a>`).join('');
  }

  return config.CONTACT_LINKS.map(link => {
    const isCopy = link.type === 'copy';
    const tag = isCopy ? 'button' : 'a';
    const attrs = isCopy ? `onclick="copyToClipboard('${escapeHtml(link.value)}', event)" title="Click to copy"` : `href="${escapeHtml(link.value)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(link.label)}"`;
    return `
              <${tag} ${attrs} class="flex items-start gap-4 text-[var(--muted)] hover:text-[var(--accent)] transition-colors group pr-6 ${isCopy ? 'copy-btn w-full text-left' : ''}">
                <div class="${DISH_CLASSES} ${DISH_HOVER_CLASSES} w-11 h-11 shrink-0 aspect-square flex items-center justify-center">
                  <i data-lucide="${link.icon}" class="${ICON_CLASSES_MD}"></i>
                </div>
                <span class="font-mono text-sm pt-2.5 break-all leading-relaxed">${escapeHtml(link.value)}</span>
              </${tag}>`;
  }).join('');
}

/* =========================================================================
   4. RESUME-SPECIFIC GENERATORS (LaTeX Replication)
   ========================================================================= */

function generateResumeExperience(config) {
  if (!config.RESUME_EXPERIENCE) return '';
  return config.RESUME_EXPERIENCE.map(exp => {
    const bulletsHtml = exp.bullets.map(bullet => `<li>${bullet}</li>`).join('');
    return `
      <div class="subheading">
        <span>${exp.role}</span>
        <span><i>${exp.start} – ${exp.end}</i></span>
      </div>
      <div class="subheading-detail">
        <span>${exp.company} — ${exp.location || ''}</span>
      </div>
      <ul>${bulletsHtml}</ul>`;
  }).join('');
}

function generateResumeSkills(config) {
  if (!config.RESUME_SKILLS) return '';
  const skillsHtml = Object.entries(config.RESUME_SKILLS).map(([category, skills]) => {
    return `<li><b>${category}:</b> ${skills.join(', ')}</li>`;
  }).join('');
  return `<ul>${skillsHtml}</ul>`;
}

function generateResumeProjects(config) {
  if (!config.RESUME_PROJECTS) return '';
  return config.RESUME_PROJECTS.map(project => {
    const bulletsHtml = (project.bullets || []).map(b => `<li>${b}</li>`).join('');
    return `
      <div class="subheading">
        <span>${project.title}</span>
        <span>${project.link ? `<a href="${project.link}" style="text-decoration:none; color:inherit;">Project Link</a>` : ''}</span>
      </div>
      <div class="subheading-detail" style="margin-bottom: 2pt;">
        <i>${project.tech || ''}</i>
      </div>
      <ul style="margin-top: 0pt;">${bulletsHtml}</ul>`;
  }).join('');
}

function generateResumeCertifications(config) {
  if (!config.RESUME_CERTIFICATIONS) return '';
  return config.RESUME_CERTIFICATIONS.map(cert => `
      <div class="subheading">
        <span>${cert.name}</span>
        <span>${cert.link ? `<a href="${cert.link}" style="text-decoration:none; color:inherit;"><i>View Credential</i></a>` : `<i>${cert.date}</i>`}</span>
      </div>
      <div class="subheading-detail">
        <span>${cert.issuer}${cert.certId ? ` · ID: ${cert.certId}` : ''}</span>
      </div>`).join('');
}

function generateResumeEducation(config) {
  if (!config.RESUME_EDUCATION) return '';
  return config.RESUME_EDUCATION.map(edu => `
      <div class="subheading">
        <span>${edu.school}</span>
        <span><i>${edu.date}</i></span>
      </div>
      <div class="subheading-detail">
        <span>${edu.degree} — ${edu.location || ''}</span>
      </div>`).join('');
}

/* =========================================================================
   5. CORE REPLACEMENT ENGINE
   ========================================================================= */

function minifyContent(content, type) {
  if (type === 'html') {
    // Protect <pre> and <code> tags by replacing them with placeholders
    const blocks = [];
    const protectedContent = content.replace(/<(pre|code)[\s\S]*?<\/\1>/gi, (match) => {
      const placeholder = `__PRE_BLOCK_${blocks.length}__`;
      blocks.push(match);
      return placeholder;
    });

    let minified = protectedContent
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/>\s+</g, '><')          // Remove space between tags
      .replace(/\s{2,}/g, ' ')          // Collapse multiple spaces
      .trim();

    // Restore protected blocks
    blocks.forEach((block, i) => {
      minified = minified.replace(`__PRE_BLOCK_${i}__`, block);
    });
    return minified;
  }
  if (type === 'json') {
    try {
      return JSON.stringify(JSON.parse(content));
    } catch (e) {
      return content.replace(/\s{2,}/g, ' ').trim();
    }
  }
  if (type === 'js') {
    return content
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n\s*/g, '')
      .trim();
  }
  return content;
}

function applyReplacements(content, config, fileType = 'html') {
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
  return minifyContent(modifiedContent, fileType);
}

/* =========================================================================
   5. MAIN BUILD PROCESS
   ========================================================================= */

async function build() {
  try {
    console.log('🚀 Starting Professional Build Process...');

    // 0. Clean dist folder to ensure no orphan files remain
    if (fs.existsSync(PATHS.dist)) {
      deleteRecursiveSync(PATHS.dist);
      console.log('✔ Cleaned dist/ directory.');
    }
    // 1. Load User Config
    let userConfig = {};
    if (fs.existsSync(PATHS.config)) {
      userConfig = JSON.parse(fs.readFileSync(PATHS.config, 'utf8'));
    }

    // 1.1 Compile Tailwind CSS first so we can hash it
    console.log('🎨 Compiling Tailwind CSS...');
    const { execSync } = require('child_process');
    const tempCss = path.join(PATHS.dist, 'temp.css');
    if (!fs.existsSync(PATHS.dist)) fs.mkdirSync(PATHS.dist, { recursive: true });

    try {
      execSync(`npx tailwindcss -c tailwind.config.js -i ./src/styles/main.css -o "${tempCss}" --minify`, { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ Tailwind Build Failed:', e.message);
      // Fallback if tailwind fails
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

    /** @type {any} */
    const config = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      SITE_VERSION: gitVersion
    };

    // Set professional resume link before processing any templates
    config.RESUME_LINK = getResumeLink(config);

    // 1.2 Flatten nested page configs for headless placeholder replacement
    if (config.RESUME_PAGE) {
      config.RESUME_TITLE = config.RESUME_PAGE.TITLE || '';
      config.RESUME_SUBTITLE = config.RESUME_PAGE.SUBTITLE || '';
      config.RESUME_TAGLINE = config.RESUME_PAGE.TAGLINE || '';
      config.RESUME_CTA_TITLE = config.RESUME_PAGE.CTA_TITLE || '';
      config.RESUME_CTA_SUBTITLE = config.RESUME_PAGE.CTA_SUBTITLE || '';
      config.RESUME_CTA_BUTTON = config.RESUME_PAGE.CTA_BUTTON || '';
    }
    if (config.PROJECTS_PAGE) {
      config.PROJECTS_TITLE = config.PROJECTS_PAGE.TITLE || '';
      config.PROJECTS_SUBTITLE = config.PROJECTS_PAGE.SUBTITLE || '';
      config.PROJECTS_TAGLINE = config.PROJECTS_PAGE.TAGLINE || '';
      config.PROJECTS_CTA_TITLE = config.PROJECTS_PAGE.CTA_TITLE || '';
      config.PROJECTS_CTA_SUBTITLE = config.PROJECTS_PAGE.CTA_SUBTITLE || '';
      config.PROJECTS_CTA_BUTTON = config.PROJECTS_PAGE.CTA_BUTTON || '';
    }

    console.log(`🚀 Starting Professional Build Process [${gitVersion}]...`);
    // Pre-calculate common parts
    config.SKILLS_GRID = generateSkills(config);
    config.EXPERIENCE_TIMELINE = generateExperience(config);
    config.CERTIFICATIONS_GRID = generateCertificationsHtml(config); // Keeping old name for compatibility
    config.CONTACT_LINKS_GRID = generateContactUI(config, 'grid');
    config.FOOTER_SOCIAL_LINKS = generateContactUI(config, 'footer');
    config.HERO_SOCIAL_LINKS = generateHeroSocialLinks(config);
    config.PIPELINE_STEPS_GRID = generatePipeline(config);
    config.HIRE_ME_BUTTON = generateHireMeButton(config);
    generateProjects(config);

    // 2b. Generate Resume-Specific Content
    config.RESUME_EXPERIENCE_HTML = generateResumeExperience(config);
    config.RESUME_SKILLS_HTML = generateResumeSkills(config);
    config.RESUME_PROJECTS_HTML = generateResumeProjects(config);
    config.RESUME_CERTIFICATIONS_HTML = generateResumeCertifications(config);
    config.RESUME_EDUCATION_HTML = generateResumeEducation(config);

    // 3. Inject Terminal Data
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
    const currentDay = new Date().getDate().toString().padStart(2, ' ');

    config.VIRTUAL_FILES_DATA = config.VIRTUAL_FILES || {};
    config.VIRTUAL_FILES_DATA_JSON = JSON.stringify(config.VIRTUAL_FILES_DATA).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');

    if (config.EXPERIENCE) {
      config.TERMINAL_EXPERIENCE = config.EXPERIENCE.map(exp => `${exp.role.padEnd(25, ' ')} ${exp.start} – ${exp.end}`);
    }

    // 4. Ensure Output Directories
    [PATHS.dist, PATHS.output.assets, path.join(PATHS.output.assets, 'css'), path.join(PATHS.output.assets, 'js'), path.join(PATHS.output.assets, 'img')]
      .forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

    // 5. Generate Hashes for Cache Busting
    const crypto = require('crypto');
    const getHash = (file) => {
      if (!fs.existsSync(file)) return 'default';
      return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').substring(0, 8);
    };

    const jsHash = getHash(PATHS.templates.mainJs);
    const cssHash = getHash(tempCss);

    config.JS_FILENAME = `main.${jsHash}.js`;
    config.CSS_FILENAME = `main.${cssHash}.css`;

    // Move temp.css to its hashed destination
    const finalCssPath = path.join(PATHS.output.assets, 'css', config.CSS_FILENAME);
    if (fs.existsSync(tempCss)) {
      fs.renameSync(tempCss, finalCssPath);
      console.log(`✔ Generated: ${config.CSS_FILENAME}`);
    }

    // 6. Process Files
    const filesToProcess = [
      { src: PATHS.templates.index, dest: PATHS.output.index, name: 'index.html', id: 'home' },
      { src: PATHS.templates.projects, dest: path.join(PATHS.dist, 'projects.html'), name: 'projects.html', id: 'projects' },
      { src: PATHS.templates.resume, dest: PATHS.output.resume, name: 'resume.html', id: 'resume' },
      { src: PATHS.templates.resumePdf, dest: PATHS.output.resumePdf, name: 'resume-pdf.html', id: 'none' },
      { src: PATHS.templates.mainJs, dest: path.join(PATHS.output.assets, 'js', config.JS_FILENAME), name: config.JS_FILENAME },
      { src: PATHS.templates.commands, dest: PATHS.output.commands, name: 'commands.json' }
    ];

    filesToProcess.forEach(file => {
      if (fs.existsSync(file.src)) {
        let content = fs.readFileSync(file.src, 'utf8');
        const ext = path.extname(file.src).substring(1);

        // Generate Dynamic Components per page if it's HTML
        if (ext === 'html') {
          config.GLOBAL_NAVBAR = generateFullNavbar(config, file.id);
          config.GLOBAL_FOOTER = generateFullFooter(config);
          config.GLOBAL_IMAGE_MODAL = generateImageModal(config);
        }

        content = applyReplacements(content, config, ext);
        if (file.name === 'resume-pdf.html') {
          // No validation for the hidden PDF template to avoid noise
          fs.writeFileSync(file.dest, content, 'utf8');
        } else {
          validateContentIntegrity(content, `dist/${file.name}`);
          fs.writeFileSync(file.dest, content, 'utf8');
          console.log(`✔ Generated: ${file.name}`);
        }
      }
    });

    // 7. Final Sync
    if (fs.existsSync(PATHS.templates.assets)) {
      copyRecursiveSync(PATHS.templates.assets, PATHS.output.assets);
      console.log('✔ Static assets synced.');
    }
    fs.copyFileSync(PATHS.config, PATHS.output.clientConfig);
    console.log('✔ Client configuration synced.');

    // 7. Process & Copy public/ root files (robots.txt, sitemap.xml, etc.)
    const publicDir = path.join(PROJECT_ROOT, 'public');
    if (fs.existsSync(publicDir)) {
      fs.readdirSync(publicDir).forEach(file => {
        const srcFile = path.join(publicDir, file);
        const destFile = path.join(PATHS.dist, file);
        let content = fs.readFileSync(srcFile, 'utf8');
        const ext = path.extname(srcFile).substring(1);
        content = applyReplacements(content, config, ext);
        fs.writeFileSync(destFile, content, 'utf8');
      });
      console.log('✔ Public root files synced. (robots.txt, sitemap.xml)');
    }

    // 8. Generate Automated PDF Resume
    console.log('📄 Generating Automated PDF Resume...');
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto('file://' + path.resolve(PATHS.output.resumePdf), { waitUntil: 'networkidle0' });
      await page.pdf({
        path: path.join(PATHS.output.assets, 'resume.pdf'),
        format: 'A4',
        printBackground: true
      });
      await browser.close();

      // 8.1 Inject Professional Metadata using pdf-lib
      const pdfPath = path.join(PATHS.dist, config.RESUME_LINK);
      const pdfBytes = fs.readFileSync(path.join(PATHS.output.assets, 'resume.pdf'));
      const pdfDoc = await PDFDocument.load(pdfBytes);

      pdfDoc.setTitle(`${config.PERSON_NAME} - Resume`);
      pdfDoc.setAuthor(config.PERSON_NAME);
      pdfDoc.setSubject(`Professional Resume of ${config.PERSON_NAME}`);
      pdfDoc.setKeywords(['DevOps', 'Cloud Engineer', 'AWS', 'Terraform', 'Kubernetes', 'CI/CD']);
      pdfDoc.setProducer('Professional Resume-as-Code Pipeline');
      pdfDoc.setCreator(config.PERSON_NAME);

      const modifiedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(pdfPath, modifiedPdfBytes);

      // Remove the generic 'resume.pdf' if it exists
      const genericPath = path.join(PATHS.output.assets, 'resume.pdf');
      if (fs.existsSync(genericPath) && genericPath !== pdfPath) {
        fs.unlinkSync(genericPath);
      }

      // Clean up the temporary PDF template
      if (fs.existsSync(PATHS.output.resumePdf)) {
        fs.unlinkSync(PATHS.output.resumePdf);
      }

      console.log('✔ Generated: resume.pdf');
    } catch (pdfError) {
      console.warn('⚠️ PDF generation skipped or failed (Puppeteer error):', pdfError.message);
      console.warn('   Note: You can still use the "Print" button in the browser on resume.html');
    }

    console.log('\n✨ Build complete! Your site is ready in /dist');

  } catch (error) {
    console.error('❌ Build failed:', error.stack);
    process.exit(1);
  }
}

build();