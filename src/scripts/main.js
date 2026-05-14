/**
 * @file main.js
 * @description Core application logic for the Cloud-Native Portfolio
 * @version 2.1.0
 *
 * Table of Contents:
 * 1. CORE SYSTEMS (Global UI & Infrastructure)
 *    1.1 Preloader
 *    1.2 Theme Toggle (Dark/Light Mode)
 *    1.3 Navigation (Navbar Scroll & Mobile Menu)
 *    1.4 Toast Notifications & Clipboard
 *    1.5 Scroll-to-Top & Hire Me Visibility
 *    1.6 Intersection Observer (Fade-Up Animations)
 *    1.7 Lucide Icon Initialization
 *    1.8 Scroll Spy (Active Nav Highlighting)
 * 2. HERO SECTION
 *    2.1 Particle Canvas
 *    2.2 Typewriter Effect
 *    2.3 "Hire Me" Navigation
 * 3. TERMINAL SECTION
 *    3.1 Dynamic Command Handlers
 *    3.2 Command Loader & Input Handler
 * 4. PROJECTS SECTION
 *    4.1 Flip Cards
 *    4.2 Image Zoom Modal
 * 5. CONTACT SECTION
 *    5.1 Form Validation & Dual-Send (Lambda + EmailJS Failover)
 * 6. FOOTER
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================================
     1. CORE SYSTEMS (Global UI & Infrastructure)
     ========================================================================= */

  // --- 1.1 Preloader ---
  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.classList.add('hidden');
      preloader.addEventListener('transitionend', () => preloader.remove());
      // Fallback removal if CSS transition doesn't fire
      setTimeout(() => { if (preloader.parentElement) preloader.remove(); }, 3000);
    });
  }

  // --- 1.2 Theme Toggle (Dark/Light Mode) ---
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
  const htmlElement = document.documentElement;

  /**
   * Replaces the icon inside a theme toggle button container.
   * Uses a retry loop to wait for Lucide icons to become available.
   */
  function updateSingleThemeIconElement(container, iconName) {
    if (!container) return;
    const existingIcon = container.querySelector('i, svg');
    if (existingIcon) existingIcon.remove();

    const newIcon = document.createElement('i');
    newIcon.setAttribute('data-lucide', iconName);
    newIcon.classList.add('w-5', 'h-5', iconName === 'sun' ? 'sun-icon' : 'moon-icon');
    container.appendChild(newIcon);

    const tryRenderLucideIcon = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        if (lucide.icons && Object.keys(lucide.icons).length > 0) {
          lucide.createIcons({ container: newIcon });
        } else {
          setTimeout(tryRenderLucideIcon, 50);
        }
      } else {
        setTimeout(tryRenderLucideIcon, 50);
      }
    };
    tryRenderLucideIcon();
  }

  /** Updates both desktop and mobile theme toggle icons. */
  function updateThemeIcon(theme) {
    const iconName = theme === 'dark' ? 'sun' : 'moon';
    updateSingleThemeIconElement(themeToggleBtn, iconName);
    updateSingleThemeIconElement(themeToggleBtnMobile, iconName);
  }

  // Resolve initial theme: saved preference > system preference > dark
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  htmlElement.classList.remove('light', 'dark');
  htmlElement.classList.add(currentTheme);
  updateThemeIcon(currentTheme);

  // Respond to OS-level theme changes (only if user hasn't manually chosen)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      htmlElement.classList.remove('light', 'dark');
      htmlElement.classList.add(newTheme);
      updateThemeIcon(newTheme);
    }
  });

  /** Toggles between dark/light themes with shockwave & spin animations. */
  function toggleTheme() {
    // Shockwave ripple effect on the orb
    const createShockwave = (btn) => {
      if (!btn) return;
      const shockwave = document.createElement('div');
      shockwave.className = 'orb-shockwave';
      shockwave.style.animation = 'orb-shockwave 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      btn.appendChild(shockwave);
      setTimeout(() => shockwave.remove(), 700);
    };

    // Icon spin & scale micro-animation
    const animateIcon = (btn) => {
      if (!btn) return;
      const icon = btn.querySelector('i');
      if (icon) {
        icon.style.transform = 'rotate(360deg) scale(0)';
        setTimeout(() => {
          icon.style.transform = 'rotate(360deg) scale(1)';
          setTimeout(() => { icon.style.transform = ''; }, 500);
        }, 150);
      }
    };

    createShockwave(themeToggleBtn);
    createShockwave(themeToggleBtnMobile);
    animateIcon(themeToggleBtn);
    animateIcon(themeToggleBtnMobile);

    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      updateThemeIcon('light');
    } else {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateThemeIcon('dark');
    }
  }

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  if (themeToggleBtnMobile) themeToggleBtnMobile.addEventListener('click', toggleTheme);

  // --- 1.3 Navigation (Navbar Scroll & Mobile Menu) ---
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('bg-brand-bg/95', 'backdrop-blur-md', 'border-b', 'border-brand-border');
      } else {
        navbar.classList.remove('bg-brand-bg/95', 'backdrop-blur-md', 'border-b', 'border-brand-border');
      }
    });
  }

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenuBtn.classList.toggle('is-active');
      mobileMenu.classList.toggle('active');
      mobileMenu.classList.toggle('flex-col');
    });
    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('is-active');
        mobileMenu.classList.remove('active');
        mobileMenu.classList.remove('flex-col');
      });
    });
  }

  // --- 1.4 Toast Notifications & Clipboard ---
  const toastContainer = document.getElementById('toast-container');

  /** Displays a temporary toast notification. Clears any existing toasts first. */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    // Clear existing toasts to prevent stacking
    while (toastContainer.firstChild) {
      toastContainer.removeChild(toastContainer.firstChild);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  /** Global clipboard copy handler — attached to onclick in HTML. */
  window.copyToClipboard = function(text, event) {
    const copyBtn = event
      ? (event.currentTarget || event.target.closest('.copy-btn'))
      : document.querySelector('.copy-btn');

    navigator.clipboard.writeText(text).then(() => {
      showToast('Email copied to clipboard!');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
      }
    }).catch((err) => {
      console.error('Copy failed:', err);
      showToast('Failed to copy email.', 'error');
    });
  };

  // --- 1.5 Scroll-to-Top & Hire Me Visibility ---
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  const hireMeBtn = document.getElementById('hire-me');
  if (scrollToTopBtn || hireMeBtn) {
    const contactSection = document.getElementById('contact');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      const isVisible = scrollPos > 300;

      // Suppress Hire Me when contact section is visible on mobile to avoid overlap
      let isNearContact = false;
      if (contactSection && window.innerWidth < 1024) {
        const rect = contactSection.getBoundingClientRect();
        isNearContact = rect.top < window.innerHeight - 100;
      }

      if (scrollToTopBtn) {
        scrollToTopBtn.classList.toggle('visible', isVisible);
      }
      if (hireMeBtn) {
        hireMeBtn.classList.toggle('visible', isVisible && !isNearContact);
      }
    });
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }

  // --- 1.6 Intersection Observer (Fade-Up Animations) ---
  const fadeUpElements = document.querySelectorAll('.animate-fade-up');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeUpElements.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });

  // --- 1.7 Lucide Icon Initialization ---
  window.addEventListener('load', () => {
    const tryRenderLucide = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        if (lucide.icons && Object.keys(lucide.icons).length > 0) lucide.createIcons();
        else setTimeout(tryRenderLucide, 100);
      }
    };
    tryRenderLucide();
  });

  // --- 1.8 Scroll Spy (Active Nav Highlighting) ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length > 0 && navLinks.length > 0) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            const normalizedHref = href.split('/').pop(); // Handles index.html#id
            const isMatch = normalizedHref === `#${id}` ||
                            normalizedHref === `index.html#${id}` ||
                            (id === 'projects' && normalizedHref === 'projects.html') ||
                            (id === 'home' && (normalizedHref === '#home' || normalizedHref === 'index.html'));
            link.classList.toggle('active', isMatch);
          });
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '-10% 0px -40% 0px'
    });
    sections.forEach(section => spyObserver.observe(section));
  }


  /* =========================================================================
     2. HERO SECTION
     ========================================================================= */

  // --- 2.1 Particle Canvas ---
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const mouse = { x: null, y: null, radius: 100 };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.1})`;
      }
      update() {
        // Repel particles away from mouse cursor
        if (mouse.x !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            this.x += (dx / dist) * ((mouse.radius - dist) / mouse.radius) * 10;
            this.y += (dy / dist) * ((mouse.radius - dist) / mouse.radius) * 10;
          }
        }
        this.x += this.speedX;
        this.y += this.speedY;
        // Bounce off edges
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < 150; i++) particles.push(new Particle());
    }

    /** Main render loop — updates particles and draws connection lines. */
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.update();
        p.draw();
        // Draw connection lines between nearby particles
        for (let j = i; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${1 - (dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

    resize();
    init();
    animate();
  }

  // --- 2.2 Typewriter Effect ---
  const typewriterElement = document.getElementById('typewriter');
  if (typewriterElement) {
    const phrases = JSON.parse('{{TYPEWRITER_PHRASES}}');
    let phraseIdx = 0, charIdx = 0, isDeleting = false;

    function type() {
      const current = phrases[phraseIdx];
      typewriterElement.textContent = isDeleting
        ? current.substring(0, charIdx - 1)
        : current.substring(0, charIdx + 1);
      charIdx = isDeleting ? charIdx - 1 : charIdx + 1;

      let speed = isDeleting ? 50 : 100;
      if (!isDeleting && charIdx === current.length) { speed = 1500; isDeleting = true; }
      else if (isDeleting && charIdx === 0) { speed = 500; isDeleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; }
      setTimeout(type, speed);
    }
    type();
  }

  // --- 2.3 "Hire Me" Navigation ---
  const hireMeButton = document.getElementById('hire-me');
  if (hireMeButton) {
    hireMeButton.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
  }


  /* =========================================================================
     3. TERMINAL SECTION (Interactive Skills Terminal)
     ========================================================================= */

  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  
  /** Appends a line (or array of lines) to the terminal output. */
  function addOutput(text, color = 'text-slate-200') {
    if (!terminalOutput) return;
    const div = document.createElement('div');
    div.className = `font-mono text-xs ${color}`;
    if (Array.isArray(text)) div.innerHTML = text.join('<br>');
    else div.appendChild(document.createTextNode(text));
    terminalOutput.appendChild(div);
    // Auto-scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  /** Parses and executes a terminal command string. */
  function execute(input) {
    const parts = input.toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    if (commands[cmd]) {
      const res = typeof commands[cmd] === 'function' ? commands[cmd](args) : commands[cmd];
      addOutput(res.output || res, res.color);
    } else {
      addOutput(`Command not found: ${cmd}`, 'text-red-400');
    }
  }

  // --- 3.1 Dynamic Command Handlers ---
  // These commands require runtime logic (DOM access, date, etc.)
  // and cannot be defined in the static commands.json file.
  const dynamicHandlers = {
    clear: () => {
      terminalOutput.innerHTML = '';
      addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400');
    },
    echo: (args) => ({ output: args.join(' '), color: 'text-yellow-400' }),
    date: () => ({ output: new Date().toLocaleString(), color: 'text-purple-400' }),
    uptime: () => ({ output: 'Simulated uptime: 120 days, 5 hours, 30 minutes', color: 'text-purple-400' }),
    open: (args) => {
      const section = args[0]?.toLowerCase();
      const valid = ['home', 'about', 'experience', 'skills', 'projects', 'pipeline', 'contact'];
      if (valid.includes(section)) {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
        return { output: `Navigating to ${section}...`, color: 'text-[var(--accent)]' };
      }
      return { output: 'Usage: open [section]. Available: ' + valid.join(', '), color: 'text-yellow-400' };
    },
    ls: () => {
      const files = JSON.parse('{{VIRTUAL_FILES_DATA_JSON}}');
      const lines = [
        'drwxr-xr-x 2 guest guest  4096 Apr 27 14:00 .',
        'drwxr-xr-x 22 root root   4096 Apr 27 10:30 ..'
      ];
      Object.entries(files).forEach(([name, meta]) => {
        lines.push(`${meta.perm} 1 ${meta.owner} ${meta.size.padStart(4)} ${meta.date} <span class="${meta.color}">${name}</span>`);
      });
      return { output: lines, color: 'text-blue-400' };
    },
    cat: (args) => {
      const files = JSON.parse('{{VIRTUAL_FILES_DATA_JSON}}');
      const file = args[0]?.toLowerCase();
      if (files[file]) {
        return { output: files[file].content, color: files[file].color };
      }
      return { output: `cat: ${file}: No such file`, color: 'text-red-400' };
    },
    ssh: (args) => {
      const user = '{{TERMINAL_SSH_USER}}';
      const host = '{{TERMINAL_SSH_HOST}}';
      const target = args[0]?.toLowerCase();
      if (target === `${user}@${host}`) {
        return {
          output: [
            'Connecting...',
            'Authenticating...',
            'Access Granted!',
            '',
            `<span class="text-green-400">Status: Connected to ${host}</span>`,
            '<span class="text-green-400">System: {{TERMINAL_SSH_SYSTEM}}</span>',
            '',
            'Type \'ls\' or \'cat secret.txt\''
          ],
          color: 'text-green-400'
        };
      }
      return { output: `Usage: ssh ${user}@${host}`, color: 'text-red-400' };
    }
  };
  let commands = Object.assign({}, dynamicHandlers);

  // --- 3.2 Command Loader & Input Handler ---
  // Merge static commands from JSON with dynamic handlers
  // 1. Show welcome message immediately
  if (terminalOutput) {
    addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400');
  }

  // 2. Load commands asynchronously
  fetch('assets/js/commands.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      commands = Object.assign({}, data, dynamicHandlers);
    })
    .catch(err => {
      console.warn('Terminal command loader: Failed to load static commands.json. Falling back to dynamic handlers only.', err);
      commands = Object.assign({}, dynamicHandlers);
    });

  if (terminalInput && terminalOutput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = terminalInput.value.trim();
        terminalInput.value = '';
        addOutput(`$ ${input}`, 'text-green-400');
        execute(input);
      }
    });
  }


  /* =========================================================================
     4. PROJECTS SECTION
     ========================================================================= */

  // --- 4.1 Flip Cards ---
  /** Toggles the flipped state of a project card. */
  window.flipCard = function(button) {
    button.closest('.flip-card')?.classList.toggle('flipped');
  };
  // Keyboard accessibility for flip cards
  document.querySelectorAll('.flip-card button').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.flipCard(btn); }
    });
  });

  // --- 4.2 Image Zoom Modal ---
  const imageModal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');

  /** Opens the fullscreen image modal with a scale-up transition. */
  window.openImageModal = function(src) {
    if (!imageModal || !modalImg) return;
    modalImg.src = src;
    imageModal.classList.remove('hidden');
    imageModal.classList.add('flex');
    // Trigger animation after display change is processed
    setTimeout(() => {
      modalImg.classList.remove('opacity-0', 'scale-95');
      modalImg.classList.add('opacity-100', 'scale-100');
    }, 10);
  };

  /** Closes the image modal with a scale-down transition. */
  window.closeImageModal = function() {
    if (!imageModal || !modalImg) return;
    modalImg.classList.remove('opacity-100', 'scale-100');
    modalImg.classList.add('opacity-0', 'scale-95');
    // Wait for CSS transition before hiding the container
    setTimeout(() => {
      imageModal.classList.add('hidden');
      imageModal.classList.remove('flex');
    }, 300);
  };


  /* =========================================================================
     5. CONTACT SECTION (Dual-Send with Failover)
     ========================================================================= */

  const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm && submitBtn) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // --- Field Extraction ---
      const formData = new FormData(contactForm);
      const name    = formData.get('name')?.trim();
      const email   = formData.get('email')?.trim();
      const message = formData.get('message')?.trim();
      const website = formData.get('website')?.trim(); // Honeypot (anti-bot)

      // --- Validation ---
      if (!name || !email || !message) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }
      if (message.length < 10) {
        showToast('Message must be at least 10 characters long.', 'error');
        return;
      }

      // --- Config from data attributes ---
      const serviceId  = submitBtn.getAttribute('data-ejs-service');
      const templateId = submitBtn.getAttribute('data-ejs-template');
      const publicKey  = submitBtn.getAttribute('data-ejs-key');
      const lambdaUrl  = submitBtn.getAttribute('data-lambda-url');
      const sheetUrl   = submitBtn.getAttribute('data-sheet-url');
      const sheetToken = submitBtn.getAttribute('data-sheet-token');

      // --- Send with failover ---
      submitBtn.disabled = true;
      const submitText = submitBtn.querySelector('#submit-text');
      const originalText = submitText.textContent;
      submitText.textContent = 'Sending...';

      try {
        let sent = false;

        // STEP A: Primary — AWS Lambda + Brevo
        if (lambdaUrl && !lambdaUrl.includes('{{')) {
          console.log('Attempting Primary Send (AWS Lambda)...');
          try {
            const response = await fetch(lambdaUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, message, website })
            });
            if (response.ok) {
              console.log('Primary Send Successful ✓');
              sent = true;
            } else {
              console.warn('Primary Send Failed (Status:', response.status, '). Falling back...');
            }
          } catch (err) {
            console.warn('Primary Send Error (Network). Falling back...');
          }
        }

        // STEP B: Failover — EmailJS
        if (!sent) {
          console.log('Activating Secondary Send (EmailJS)...');
          emailjs.init(publicKey);
          await emailjs.send(serviceId, templateId, {
            from_name: name,
            reply_to: email,
            message: message
          });
          console.log('Secondary Send Successful ✓');
          sent = true;
        }

        // STEP C: Background Logging — Google Sheets Registry
        if (sheetUrl && !sheetUrl.includes('{{')) {
          console.log('Logging to Registry (Google Sheets)...');
          fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, token: sheetToken })
          }).catch(err => console.warn('Registry Logging Error:', err));
        }

        showToast('Message sent! I\'ll get back to you soon. ✓');
        contactForm.reset();
      } catch (err) {
        console.error('Unified Sending Error:', err);
        showToast('Failed to send. Please email me directly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitText.textContent = originalText;
      }
    });
  }


  /* =========================================================================
     6. FOOTER
     ========================================================================= */

  const currentYearSpan = document.getElementById('current-year');
  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

});
