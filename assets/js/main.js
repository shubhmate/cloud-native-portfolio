// Ensure all DOM content is loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // ==================== Preloader Logic ====================
    // Hides the preloader once the entire page (including images, etc.) has loaded.
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.classList.add('hidden');
            // Remove the preloader element from the DOM after its transition ends for better performance.
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
        });
    }

    // --- Declare Theme Toggle buttons early to avoid TypeError ---
    // These elements are declared here to be accessible throughout the theme toggle logic.
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');

    // ==================== Theme Toggle Functionality ====================
    // Manages switching between dark and light themes, persisting user preference.
    const htmlElement = document.documentElement;

    // Helper function to dynamically update a single theme icon (sun/moon).
    function updateSingleThemeIconElement(container, iconName) {
        if (!container) return;

        // Remove existing icon (could be <i> or <svg> from previous render)
        const existingIcon = container.querySelector('i, svg');
        if (existingIcon) {
            existingIcon.remove();
        }

        // Create new <i> element with desired data-lucide attribute
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        newIcon.classList.add('w-5', 'h-5'); // Ensure classes are re-added
        container.appendChild(newIcon); // Add the new <i> element
        
        // Re-render only the newly added icon using Lucide.
        // A retry mechanism is used to ensure Lucide's internal icon registry is populated
        // before attempting to render dynamic icons. This is crucial because `lucide.js`
        // might be loaded with 'defer' and its internal icon definitions might not be
        // ready immediately, even if the 'lucide' object itself exists.
        const tryRenderLucideIcon = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                // Check if the icons object is populated with any icons
                if (lucide.icons && Object.keys(lucide.icons).length > 0) {
                lucide.createIcons({ container: newIcon });
                } else {
                    console.warn(`Lucide.icons object not yet populated for dynamic icon "${iconName}", retrying...`);
                    setTimeout(tryRenderLucideIcon, 50); // Retry after a short delay
                }
            } else {
                console.warn('Lucide library not available for dynamic icon, retrying...');
                setTimeout(tryRenderLucideIcon, 50); // Retry if lucide is not yet available
            }
        };
        tryRenderLucideIcon();
    }

    // Initialize theme based on localStorage or system preference.
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        htmlElement.classList.add(currentTheme);
        updateThemeIcon(currentTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { // Check system preference
        htmlElement.classList.add('dark');
        updateThemeIcon('dark');
    } else {
        htmlElement.classList.add('dark'); // Default to dark if no preference
        updateThemeIcon('dark');
    }

    // Main function to update both desktop and mobile theme icons.
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

    // Add event listeners to theme toggle buttons if they exist.
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (themeToggleBtnMobile) themeToggleBtnMobile.addEventListener('click', toggleTheme);

    // ==================== Mobile Menu Toggle ====================
    // Handles opening and closing the mobile navigation menu.
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex'); // Use flex to display the menu
            mobileMenu.classList.toggle('flex-col');
        });

        // Close mobile menu when a navigation link is clicked.
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex', 'flex-col');
            });
        });
    }

    // ==================== Scroll to Top Button ====================
    // Shows/hides a button based on scroll position and handles smooth scrolling to the top.
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => { // Listen for scroll events
            if (window.scrollY > 300) { // Show button after scrolling 300px
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => { // Handle click event
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ==================== Typewriter Effect ====================
    // Animates typing and deleting phrases in the hero section.
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const phrases = [
            "DevOps Engineer",
            "Cloud Architect",
            "Automation Specialist",
            "Infrastructure as Code"
        ];
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 100;
        const deletingSpeed = 50;
        const pauseBeforeDelete = 1500;
        const pauseBeforeType = 500;

        function type() {
            const currentPhrase = phrases[phraseIndex];
            if (isDeleting) {
                typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
            }

            let speed = isDeleting ? deletingSpeed : typingSpeed;

            if (!isDeleting && charIndex === currentPhrase.length) {
                speed = pauseBeforeDelete;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                speed = pauseBeforeType;
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
            setTimeout(type, speed);
        }
        type();
    }

    // ==================== Hero Canvas Particle Animation ====================
    // Creates an interactive particle background in the hero section.
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const numParticles = 150; // Number of particles for the animation
        let mouse = { // Mouse position and repulsion radius for particle interaction
            x: null,
            y: null,
            radius: 100 // Repulsion radius for particles
        };
        const maxLineDistance = 100; // Maximum distance for particles to connect with a line


        // Resizes the canvas to match the window dimensions.
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        // Particle class defines properties and behaviors for each particle.
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 2;
                this.speedX = Math.random() * 1 - 0.5; // Increased particle speed
                this.speedY = Math.random() * 1 - 0.5; // Increased particle speed
                this.color = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.1})`; // Accent color with transparency
            }
            // Calculates distance to mouse and applies a repulsion force.
            repel() {
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = this.x - mouse.x;
                    let dy = this.y - mouse.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouse.radius) {
                        let forceDirectionX = dx / distance;
                        let forceDirectionY = dy / distance;
                        let maxForce = 10; // How strong the repulsion is
                        let force = (mouse.radius - distance) / mouse.radius * maxForce;
                        this.x += forceDirectionX * force;
                        this.y += forceDirectionY * force;
                    }
                }
            }
            // Updates particle position and handles boundary collisions.
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.01;
                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }

            // Draws the particle on the canvas.
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Initializes the array of particles.
        function initParticles() {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }

        // Animation loop for particles: updates, draws, and connects them with lines.
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                // Draws lines between nearby particles, fading with distance.
                for (let j = i; j < particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxLineDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${1 - (distance / maxLineDistance)})`; // Fade line with distance
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                particles[i].repel(); // Apply mouse repulsion effect
                particles[i].draw();
                if (particles[i].size <= 0.1) {
                    particles.splice(i, 1);
                    particles.push(new Particle());
                }
            }
            requestAnimationFrame(animateParticles);
        }

        // Event listeners for canvas resizing and mouse interaction.
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', (event) => { // Track mouse position for repulsion
            // Get mouse position relative to the canvas
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        });
        canvas.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });
        resizeCanvas();
        initParticles();
        animateParticles();
    }

    // ==================== Terminal Simulator ====================
    // Provides an interactive command-line interface experience.
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    let commands = {}; // Object to store available terminal commands and their responses/functions.
    
    // Fetch commands from JSON file
    fetch('assets/js/commands.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(fetchedCommands => {
            commands = fetchedCommands; // Assign fetched data to commands
            // Re-assign functions as they cannot be stored directly in JSON
            commands.clear = () => { // Clear function
                terminalOutput.innerHTML = '';
                addOutput('Welcome to devops.sh — type \'help\' to get started.');
            };
            commands.echo = (args) => ({ output: args.join(' '), color: 'text-yellow-400' });
            commands.date = () => ({ output: new Date().toLocaleString(), color: 'text-purple-400' }); // Dynamic date
            commands.uptime = () => ({ output: "Simulated uptime: 120 days, 5 hours, 30 minutes", color: 'text-purple-400' }); // Simulated uptime
            commands['open projects'] = () => {
                window.location.hash = '#projects'; // Scroll to projects section
                return { output: "Navigating to projects...", color: 'text-accent' };
            };

            // Display initial welcome message after commands are successfully loaded.
            if (terminalOutput) {
                addOutput('Welcome to devops.sh — type \'help\' to get started.');
            }
        })
        // Log any errors during command loading.
        .catch(error => console.error('Error loading terminal commands:', error));

    if (terminalInput && terminalOutput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = terminalInput.value.trim();
                terminalInput.value = '';
                addOutput(`$ ${input}`, 'text-green-400'); // Apply green color to the echoed command
                executeCommand(input);
                terminalOutput.scrollTop = terminalOutput.scrollHeight; // Scroll to bottom
            }
        });

        // Adds a new line of output to the terminal display.
        function addOutput(text, color = 'text-slate-200') {
            const div = document.createElement('div');
            div.className = `font-mono text-xs ${color}`;
            if (Array.isArray(text)) { // If text is an array, join with <br> and set as innerHTML
                div.innerHTML = text.join('<br>');
            } else {
                // For string content, create a text node to prevent HTML injection/misinterpretation
                const textNode = document.createTextNode(text);
                div.appendChild(textNode);
            }
            terminalOutput.appendChild(div);
        }

        // Executes a given command by looking it up in the `commands` object.
        function executeCommand(input) {
            const parts = input.split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            if (commands[command]) {
                let commandResponse = commands[command];
                let outputText;
                let outputColor = 'text-slate-200'; // Default color for command output

                if (typeof commandResponse === 'function') {
                    commandResponse = commandResponse(args);
                }

                if (typeof commandResponse === 'object' && commandResponse !== null && 'output' in commandResponse) {
                    outputText = commandResponse.output;
                    outputColor = commandResponse.color || outputColor;
                } else {
                    outputText = commandResponse;
                }

                if (outputText) addOutput(outputText, outputColor);
            } else {
                addOutput(`Command not found: ${command}`, 'text-red-400');
            }
        }
    }

    // ==================== Flip Card Functionality ====================
    // Toggles the 'flipped' class on project cards to show front/back content.
    window.flipCard = function(button) {
        const card = button.closest('.flip-card');
        if (card) {
            card.classList.toggle('flipped');
        }
    };
    // Adds keyboard accessibility (Enter/Space) to flip card buttons.
    // Add keyboard support for flip cards
    document.querySelectorAll('.flip-card button').forEach(button => {
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent default scroll for spacebar
                window.flipCard(button);
            }
        });
    });

    // ==================== Copy to Clipboard & Toast Notifications ====================
    // Provides functionality to copy text to clipboard and display temporary feedback messages.
    const toastContainer = document.getElementById('toast-container');
    // Displays a toast notification with a given message and type (success/error).
    function showToast(message, type = 'success') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000); // Toast disappears after 3 seconds
    }

    // Copies provided text to the clipboard and shows a toast notification.
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Email copied to clipboard!');
            const copyBtn = document.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 1500);
            }
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy email.', 'error');
        });
    };

    // ==================== Contact Form Submission (Formspree) ====================
    // Handles submission of the contact form using Formspree, including validation and feedback.
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text'); // Text inside the submit button
    const statusMessage = document.getElementById('status-message');

    if (contactForm && submitBtn && statusMessage) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formspreeId = submitBtn.getAttribute('data-formspree');
            if (!formspreeId || formspreeId === 'YOUR_FORMSPREE_ID') { // Basic check for placeholder ID
                showToast('Please replace YOUR_FORMSPREE_ID in index.html for the contact form.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitText.textContent = 'Sending...';
            statusMessage.classList.add('hidden');

            // Collect form data and send to Formspree endpoint.
            const formData = new FormData(contactForm);
            try {
                const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showToast('Message sent successfully!'); // Success feedback
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        statusMessage.textContent = data.errors.map(error => error.message).join(', ');
                    } else {
                        statusMessage.textContent = 'Oops! There was an error sending your message.';
                    }
                    statusMessage.classList.remove('hidden');
                    showToast('Failed to send message.', 'error'); // Error feedback
                }
            } catch (error) {
                console.error('Form submission error:', error);
                statusMessage.textContent = 'Network error. Please try again later.';
                statusMessage.classList.remove('hidden');
                showToast('Network error. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitText.textContent = 'Send Message';
            }
        });
    }

    // ==================== Intersection Observer for Fade-Up Animations ====================
    // Triggers CSS animations when elements enter the viewport.
    const fadeUpElements = document.querySelectorAll('.animate-fade-up');
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);

    fadeUpElements.forEach(el => {
        el.style.opacity = 0; // Hide elements initially
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // ==================== Navbar Scroll Behavior ====================
    // Adds styling to the navbar when the user scrolls down.
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // Adjust scroll threshold as needed
                navbar.classList.add('bg-bg/95', 'backdrop-blur-md', 'border-b', 'border-border');
            } else {
                navbar.classList.remove('bg-bg/95', 'backdrop-blur-md', 'border-b', 'border-border');
            }
        });
    }

    // ==================== Final Lucide Icons Initialization ====================
    // Ensure all static Lucide icons are rendered after the entire page (including lucide.js) has loaded.
    window.addEventListener('load', () => { // Using window.load to ensure all resources (including Lucide.js) are loaded.
        // A retry mechanism is used to ensure Lucide's internal icon registry is fully populated
        // before attempting to render all static icons. This is crucial because lucide.js
        // might be loaded with 'defer' and its internal icon definitions might not be
        // ready immediately, even if the 'lucide' object itself exists.
        const tryRenderAllLucideIcons = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                // Check if the icons object is populated with any icons
                if (lucide.icons && Object.keys(lucide.icons).length > 0) {
                lucide.createIcons();
                } else {
                    console.warn('Lucide icons library not fully initialized for static icons, retrying...');
                    setTimeout(tryRenderAllLucideIcons, 100); // Retry with a slightly longer delay
                }
            } else {
                console.error('Lucide icons library not found or createIcons method missing on window.load.'); // This is a more critical error
            }
        };
        tryRenderAllLucideIcons();
    });

    // ==================== Dynamic Copyright Year ====================
    // Automatically updates the copyright year in the footer to the current year.
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        const currentYear = new Date().getFullYear();
        currentYearSpan.textContent = currentYear;
    };
});
