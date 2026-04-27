// Ensure all DOM content is loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================================
       1. CORE SYSTEMS (Global UI & Infrastructure)
       ========================================================================= */

    // --- 1.1 Preloader Logic ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
            // Safe fallback to ensure preloader is removed if transition fails
            setTimeout(() => { if(preloader.parentElement) preloader.remove(); }, 3000);
        });
    }

    // --- 1.2 Theme Toggle Functionality (Dark/Light Mode) ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
    const htmlElement = document.documentElement;

    function updateSingleThemeIconElement(container, iconName) {
        if (!container) return;
        const existingIcon = container.querySelector('i, svg');
        if (existingIcon) existingIcon.remove();
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        newIcon.classList.add('w-5', 'h-5');
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
    
    // Check for saved theme OR use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    htmlElement.classList.remove('light', 'dark');
    htmlElement.classList.add(currentTheme);
    updateThemeIcon(currentTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            htmlElement.classList.remove('light', 'dark');
            htmlElement.classList.add(newTheme);
            updateThemeIcon(newTheme);
        }
    });
    
    function updateThemeIcon(theme) {
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        updateSingleThemeIconElement(themeToggleBtn, iconName);
        updateSingleThemeIconElement(themeToggleBtnMobile, iconName);
    }

    function toggleTheme() {
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
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
            mobileMenu.classList.toggle('flex-col');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex', 'flex-col');
            });
        });
    }

    // --- 1.4 Global UI Feedback (Toasts & Clipboard) ---
    const toastContainer = document.getElementById('toast-container');
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

    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Email copied to clipboard!');
            const copyBtn = document.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 1500);
            }
        }).catch(() => showToast('Failed to copy email.', 'error'));
    };

    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) scrollToTopBtn.classList.add('visible');
            else scrollToTopBtn.classList.remove('visible');
        });
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // --- 1.5 System Initialization (Lucide & Animations) ---
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

    window.addEventListener('load', () => {
        const tryRenderLucide = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                if (lucide.icons && Object.keys(lucide.icons).length > 0) lucide.createIcons();
                else setTimeout(tryRenderLucide, 100);
            }
        };
        tryRenderLucide();
    });


    /* =========================================================================
       2. HERO SECTION
       ========================================================================= */

    // --- 2.1 Particle Canvas ---
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null, radius: 100 };
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
                if (mouse.x !== null) {
                    let dx = this.x - mouse.x;
                    let dy = this.y - mouse.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < mouse.radius) {
                        this.x += (dx/dist) * ((mouse.radius-dist)/mouse.radius) * 10;
                        this.y += (dy/dist) * ((mouse.radius-dist)/mouse.radius) * 10;
                    }
                }
                this.x += this.speedX;
                this.y += this.speedY;
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
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.update();
                p.draw();
                for (let j = i; j < particles.length; j++) {
                    let dx = p.x - particles[j].x;
                    let dy = p.y - particles[j].y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${1 - (dist/100)})`;
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
        resize(); init(); animate();
    }

    // --- 2.2 Typewriter Effect ---
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const phrases = "{{TYPEWRITER_PHRASES}}";
        let phraseIdx = 0, charIdx = 0, isDeleting = false;
        function type() {
            const current = phrases[phraseIdx];
            typewriterElement.textContent = isDeleting ? current.substring(0, charIdx - 1) : current.substring(0, charIdx + 1);
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
       3. TERMINAL SECTION
       ========================================================================= */

    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    let commands = {};

    const dynamicHandlers = {
        clear: () => { terminalOutput.innerHTML = ''; addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400'); },
        echo: (args) => ({ output: args.join(' '), color: 'text-yellow-400' }),
        date: () => ({ output: new Date().toLocaleString(), color: 'text-purple-400' }),
        uptime: () => ({ output: "Simulated uptime: 120 days, 5 hours, 30 minutes", color: 'text-purple-400' }),
        open: (args) => {
            const section = args[0]?.toLowerCase();
            const valid = ['home', 'about', 'experience', 'skills', 'projects', 'pipeline', 'contact'];
            if (valid.includes(section)) {
                document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
                return { output: `Navigating to ${section}...`, color: 'text-[var(--accent)]' };
            }
            return { output: "Usage: open [section]. Available: " + valid.join(', '), color: 'text-yellow-400' };
        },
        ls: () => {
            const files = JSON.parse('{{VIRTUAL_FILES_DATA_JSON}}');
            const lines = [
                "drwxr-xr-x 2 guest guest  4096 Apr 27 14:00 .",
                "drwxr-xr-x 22 root root   4096 Apr 27 10:30 .."
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
            const user = "{{TERMINAL_SSH_USER}}";
            const host = "{{TERMINAL_SSH_HOST}}";
            const target = args[0]?.toLowerCase();
            
            if (target === `${user}@${host}`) {
                return { 
                    output: [
                        "Connecting...",
                        "Authenticating...",
                        "Access Granted!",
                        "",
                        `<span class="text-green-400">Status: Connected to ${host}</span>`,
                        `<span class="text-green-400">System: {{TERMINAL_SSH_SYSTEM}}</span>`,
                        "",
                        "Type 'ls' or 'cat secret.txt'"
                    ], 
                    color: 'text-green-400' 
                };
            }
            return { output: `Usage: ssh ${user}@${host}`, color: 'text-red-400' };
        }
    };

    fetch('assets/js/commands.json')
        .then(res => res.json())
        .then(data => {
            commands = Object.assign({}, data, dynamicHandlers);
            if (terminalOutput) addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400');
        });

    if (terminalInput && terminalOutput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = terminalInput.value.trim();
                terminalInput.value = '';
                addOutput(`$ ${input}`, 'text-green-400');
                execute(input);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }
        });

        function addOutput(text, color = 'text-slate-200') {
            const div = document.createElement('div');
            div.className = `font-mono text-xs ${color}`;
            if (Array.isArray(text)) div.innerHTML = text.join('<br>');
            else div.appendChild(document.createTextNode(text));
            terminalOutput.appendChild(div);
        }

        function execute(input) {
            const parts = input.toLowerCase().split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);
            if (commands[cmd]) {
                let res = typeof commands[cmd] === 'function' ? commands[cmd](args) : commands[cmd];
                addOutput(res.output || res, res.color);
            } else {
                addOutput(`Command not found: ${cmd}`, 'text-red-400');
            }
        }
    }


    /* =========================================================================
       4. PROJECTS SECTION
       ========================================================================= */

    // --- 4.1 Flip Cards ---
    window.flipCard = function(button) {
        button.closest('.flip-card')?.classList.toggle('flipped');
    };
    document.querySelectorAll('.flip-card button').forEach(btn => {
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.flipCard(btn); }
        });
    });

    // --- 4.2 Image Zoom Modal ---
    const imageModal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    window.openImageModal = function(src) {
        if (!imageModal || !modalImg) return;
        modalImg.src = src;
        imageModal.classList.remove('hidden');
        imageModal.classList.add('flex');
        
        // Trigger animation after a tiny delay to ensure browser handles the display change
        setTimeout(() => {
            modalImg.classList.remove('opacity-0', 'scale-95');
            modalImg.classList.add('opacity-100', 'scale-100');
        }, 10);
    };
    window.closeImageModal = function() {
        if (!imageModal || !modalImg) return;
        modalImg.classList.remove('opacity-100', 'scale-100');
        modalImg.classList.add('opacity-0', 'scale-95');
        
        // Wait for transition to finish before hiding the container
        setTimeout(() => {
            imageModal.classList.add('hidden');
            imageModal.classList.remove('flex');
        }, 300);
    };


    /* =========================================================================
       5. CONTACT SECTION
       ========================================================================= */

    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');

    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // --- Validation Logic ---
            const formData = new FormData(contactForm);
            const name = formData.get('name')?.trim();
            const email = formData.get('email')?.trim();
            const message = formData.get('message')?.trim();

            // 1. Check for empty fields
            if (!name || !email || !message) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            // 2. Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            // 3. Check message length
            if (message.length < 10) {
                showToast('Message must be at least 10 characters long.', 'error');
                return;
            }

            const id = submitBtn.getAttribute('data-formspree');
            if (!id || id.includes('YOUR_')) { 
                showToast('Formspree ID missing! Check site-config.json', 'error'); 
                return; 
            }

            submitBtn.disabled = true;
            const submitText = submitBtn.querySelector('#submit-text');
            const originalText = submitText.textContent;
            submitText.textContent = 'Sending...';

            try {
                const res = await fetch(`https://formspree.io/f/${id}`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    showToast('Message sent successfully!');
                    contactForm.reset();
                } else {
                    showToast('Failed to send message. Please try again.', 'error');
                }
            } catch (err) {
                showToast('Network error. Please check your connection.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitText.textContent = originalText;
            }
        });
    }


    /* =========================================================================
       6. FOOTER SECTION
       ========================================================================= */

    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

});
