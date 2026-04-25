// Ensure all DOM content is loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. Preloader Logic
    // =========================================================================
    // This section handles the preloader animation, ensuring it hides only after
    // all page resources (images, scripts, etc.) have fully loaded.
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Listen for the 'load' event on the window, which fires when all assets are loaded.
        window.addEventListener('load', () => {
            // Add 'hidden' class to trigger CSS fade-out.
            preloader.classList.add('hidden');
            // After the CSS transition for hiding completes, remove the element from the DOM
            // to prevent it from interfering with user interactions or accessibility.
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
        });
    }

    // =========================================================================
    // 2. Theme Toggle Functionality (Dark/Light Mode)
    // =========================================================================
    // Manages switching between dark and light themes, persisting user preference
    // in localStorage and updating UI elements accordingly.
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
    const htmlElement = document.documentElement;

    /**
     * Dynamically updates a single theme icon (sun/moon) within a given container.
     * It handles removing existing icons and creating/rendering new ones using Lucide.
     * @param {HTMLElement} container - The DOM element that holds the theme icon.
     * @param {string} iconName - The name of the Lucide icon to display ('sun' or 'moon').
     */
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
        newIcon.classList.add('w-5', 'h-5'); // Apply necessary Tailwind classes for sizing.
        container.appendChild(newIcon); // Add the new <i> element
        
        // Re-render only the newly added icon using Lucide.
        // A retry mechanism is used to ensure Lucide's internal icon registry is populated
        // before attempting to render dynamic icons. This is crucial because `lucide.js`
        // might be loaded with 'defer' and its internal icon definitions might not be
        // ready immediately, even if the `lucide` object itself exists.
        const tryRenderLucideIcon = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) { // Check if Lucide library is loaded
                // Check if the icons object is populated with any icons
                if (lucide.icons && Object.keys(lucide.icons).length > 0) {
                lucide.createIcons({ container: newIcon });
                } else {
                    console.warn(`Lucide.icons object not yet populated for dynamic icon "${iconName}", retrying...`);
                    setTimeout(tryRenderLucideIcon, 50); // Retry after a short delay
                }
            } else { // If Lucide library is not yet available
                console.warn('Lucide library not available for dynamic icon, retrying...');
                setTimeout(tryRenderLucideIcon, 50); // Retry if lucide is not yet available
            }
        };
        tryRenderLucideIcon();
    }
    
    // Initialize theme:
    // 1. Check localStorage for a previously saved theme.
    // 2. If not found, check system preference (prefers-color-scheme).
    // 3. Default to 'dark' if no preference is found.
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        htmlElement.classList.add(currentTheme);
        updateThemeIcon(currentTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlElement.classList.add('dark');
        updateThemeIcon('dark');
    } else {
        htmlElement.classList.add('dark'); // Default to dark if no preference
        updateThemeIcon('dark');
    }
    
    /**
     * Updates the theme icons for both desktop and mobile based on the current theme.
     * @param {string} theme - The current theme ('dark' or 'light').
     */
    function updateThemeIcon(theme) {
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        updateSingleThemeIconElement(themeToggleBtn, iconName);
        updateSingleThemeIconElement(themeToggleBtnMobile, iconName);
    }

    function toggleTheme() {
        // Toggle 'dark' and 'light' classes on the <html> element.
        // Update localStorage to persist the user's choice.
        // Call updateThemeIcon to change the visual icon.
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

    // Attach event listeners to the theme toggle buttons.
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme); // Desktop theme toggle
    if (themeToggleBtnMobile) themeToggleBtnMobile.addEventListener('click', toggleTheme); // Mobile theme toggle

    // =========================================================================
    // 3. Mobile Menu Toggle
    // =========================================================================
    // Manages the visibility and accessibility attributes of the mobile navigation menu.
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded); // Toggle ARIA attribute for accessibility
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex'); // Toggle display property
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

    // =========================================================================
    // 4. Scroll to Top Button
    // =========================================================================
    // Controls the visibility of a "scroll to top" button and provides smooth scrolling functionality.
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => { // Listen for scroll events
            if (window.scrollY > 300) { // Show button after scrolling 300px
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => { // On click, smoothly scroll to the top of the page.
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // =========================================================================
    // 5. Typewriter Effect
    // =========================================================================
    // Animates a sequence of phrases by typing and deleting them character by character.
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const phrases = "{{TYPEWRITER_PHRASES}}"; // Dynamically loaded from config.json
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        const typingSpeed = 100;
        const deletingSpeed = 50;
        const pauseBeforeDelete = 1500;
        const pauseBeforeType = 500;

        /**
         * Recursive function to simulate typing and deleting text.
         * It updates the content of the typewriterElement with delays.
         */
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
    };

    // =========================================================================
    // 6. Hero Canvas Particle Animation
    // =========================================================================
    // Generates an interactive particle background using HTML Canvas, reacting to mouse movement.
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


        /**
         * Resizes the canvas element to match the current window dimensions.
         */
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        /**
         * Represents a single particle in the canvas animation.
         * Handles its position, movement, drawing, and interaction with the mouse.
         */
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 2;
                this.speedX = Math.random() * 1 - 0.5; // Increased particle speed
                this.speedY = Math.random() * 1 - 0.5; // Increased particle speed
                this.color = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.1})`; // Accent color with transparency
            }
            
            /**
             * Calculates the distance to the mouse and applies a repulsion force if within range.
             */
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
            /**
             * Updates the particle's position and handles boundary collisions.
             */
            // Updates particle position and handles boundary collisions.
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.01;
                if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
                if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
            }

            /**
             * Draws the particle as a circle on the canvas.
             */
            // Draws the particle on the canvas.
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        /**
         * Initializes the array of particles with random positions and properties.
         */
        // Initializes the array of particles.
        function initParticles() {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }
        /**
         * The main animation loop for particles.
         * Clears the canvas, updates/draws particles, and draws lines between nearby particles.
         */
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
                particles[i].draw(); // Draw the particle
                if (particles[i].size <= 0.1) {
                    particles.splice(i, 1);
                    particles.push(new Particle());
                }
            }
            requestAnimationFrame(animateParticles);
        }

        // Event listeners for canvas resizing and mouse interaction to update mouse position.
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
    } // End of Hero Canvas Particle Animation

    // =========================================================================
    // 7. Terminal Simulator
    // =========================================================================
    // Provides an interactive command-line interface experience within the browser.
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    // `commands` will store the available terminal commands, loaded from `commands.json`.
    let commands = {}; // Object to store available terminal commands and their responses/functions.
    // Define dynamic command handlers
    const dynamicCommandHandlers = {
        clear: () => {
            terminalOutput.innerHTML = '';
            addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400');
        },
        echo: (args) => ({ output: args.join(' '), color: 'text-yellow-400' }),
        date: () => ({ output: new Date().toLocaleString(), color: 'text-purple-400' }),
        uptime: () => ({ output: "Simulated uptime: 120 days, 5 hours, 30 minutes", color: 'text-purple-400' }),
        open: (args) => {
            if (!args || args.length === 0) {
                return { output: "Usage: open [section]. Available: home, skills, projects, experience, contact", color: 'text-yellow-400' };
            }
            const section = args[0].toLowerCase();
            const validSections = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];
            
            if (validSections.includes(section)) {
                const element = document.getElementById(section);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Still update hash for URL consistency, but scrolling is handled explicitly
                    if (window.location.hash !== `#${section}`) {
                        window.location.hash = `#${section}`;
                    }
                }
                return { output: `Navigating to ${section}...`, color: 'text-[var(--accent)]' };
            } else {
                return { output: `Section not found. Available: ${validSections.join(', ')}`, color: 'text-red-400' };
            }
        },
        ssh: (args) => {
            if (!args || args.length === 0) {
                return { output: "Usage: ssh [user]@[host]", color: 'text-yellow-400' };
            }
            const target = args[0].toLowerCase();
            if (target.includes('guest@')) {
                return { 
                    output: [
                        "Connecting to remote host...",
                        "Authenticating as guest...",
                        "Access Granted! 🔓",
                        "",
                        "Welcome to the hidden vault.",
                        "Status: Connected to shubham-mate-vps-01",
                        "System: Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-generic)",
                        "",
                        "Type 'ls' to see hidden files or 'cat secret.txt' for a surprise."
                    ], 
                    color: 'text-green-400' 
                };
            }
            return { output: `ssh: Could not resolve hostname ${target}: Name or service not known`, color: 'text-red-400' };
        },
        cat: (args) => {
            if (!args || args.length === 0) {
                return { output: "Usage: cat [filename]", color: 'text-yellow-400' };
            }
            if (args[0].toLowerCase() === 'secret.txt') {
                return { 
                    output: [
                        "Reading secret.txt...",
                        "--------------------------------",
                        "🚀 MISSION LOG: DEVOPS PORTFOLIO",
                        "--------------------------------",
                        "Status: Fully Automated.",
                        "Goal: Secure a Top-Tier Cloud Role.",
                        "Message: Thanks for exploring my code!",
                        "Tip: Try typing 'build' to see the pipeline.",
                        "--------------------------------"
                    ], 
                    color: 'text-green-400' 
                };
            }
            return { output: `cat: ${args[0]}: No such file or directory`, color: 'text-red-400' };
        }
    };

    // Fetch commands from JSON file
    fetch('assets/js/commands.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(fetchedCommands => {
            commands = fetchedCommands; // Assign fetched data to the `commands` object.
            // Merge static commands from JSON with dynamic command handlers
            // Dynamic handlers will override static ones if keys are the same
            Object.assign(commands, dynamicCommandHandlers);

            // Display initial welcome message after commands are successfully loaded.
            if (terminalOutput) {
                addOutput('Welcome to devops.sh — type \'help\' to get started.', 'text-green-400');
            }
        })
        // Catch and log any errors that occur during the fetch operation.
        .catch(error => console.error('Error loading terminal commands:', error));

    if (terminalInput && terminalOutput) {
        /**
         * Event listener for the terminal input field.
         * Processes commands when the 'Enter' key is pressed.
         * @param {KeyboardEvent} e - The keyboard event object.
         */
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = terminalInput.value.trim();
                terminalInput.value = '';
                addOutput(`$ ${input}`, 'text-green-400'); // Apply green color to the echoed command
                executeCommand(input);
                terminalOutput.scrollTop = terminalOutput.scrollHeight; // Scroll to bottom
            }
        });

        /**
         * Adds a new line of output to the terminal display.
         * @param {string|string[]} text - The text to display. Can be a string or an array of strings (for multi-line output).
         * @param {string} color - Tailwind CSS class for text color (e.g., 'text-red-400').
         */
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

        /**
         * Executes a given command by looking it up in the `commands` object.
         * Handles both string responses and function-based dynamic responses.
         * @param {string} input - The raw command string entered by the user.
         */
        function executeCommand(input) {
            const trimmedInput = input.trim().toLowerCase();
            let command = trimmedInput;
            let args = [];

            // If the exact full string isn't a command, split it up
            if (!commands[command]) {
                const parts = trimmedInput.split(' ');
                command = parts[0];
                args = parts.slice(1);
            }

            if (commands[command]) {
                let commandResponse = commands[command];
                let outputText;
                let outputColor = 'text-slate-200'; // Default color for command output

                if (typeof commandResponse === 'function') { // If the command is a function, execute it.
                    commandResponse = commandResponse(args);
                }
                // Determine the output text and color from the command's response.
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
    // End of Flip Card Functionality

    // =========================================================================
    // 9. Copy to Clipboard & Toast Notifications
    // =========================================================================
    // Provides functionality to copy text to clipboard and display temporary,
    // non-intrusive feedback messages (toasts).
    const toastContainer = document.getElementById('toast-container');
    
    /**
     * Displays a toast notification with a given message and type.
     * @param {string} message - The message to display in the toast.
     * @param {'success'|'error'} type - The type of toast, influencing its styling.
     */
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

    /**
     * Copies the provided text to the clipboard and displays a toast notification
     * indicating success or failure.
     * @param {string} text - The text content to copy to the clipboard.
     */
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
    // End of Copy to Clipboard & Toast Notifications

    // =========================================================================
    // 10. Contact Form Submission (Formspree)
    // =========================================================================
    // Manages the submission of the contact form to Formspree, providing user feedback.
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text'); // Text inside the submit button
    const statusMessage = document.getElementById('status-message');

    if (contactForm && submitBtn && statusMessage) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Retrieve Formspree ID from the button's data attribute.
            const formspreeId = submitBtn.getAttribute('data-formspree');
            if (!formspreeId || formspreeId === 'your-formspree-id') { // Basic validation for placeholder ID.
                showToast('Please replace your-formspree-id in index.html for the contact form.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitText.textContent = 'Sending...';
            statusMessage.classList.add('hidden'); // Hide previous status messages.

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
                    showToast('Message sent successfully!'); // Display success toast.
                    contactForm.reset(); // Clear the form fields.
                } else {
                    const data = await response.json(); // Parse error response from Formspree.
                    if (data.errors) {
                        statusMessage.textContent = data.errors.map(error => error.message).join(', ');
                    } else {
                        statusMessage.textContent = 'Oops! There was an error sending your message.';
                    }
                    statusMessage.classList.remove('hidden');
                    showToast('Failed to send message.', 'error'); // Error feedback
                }
            } catch (error) {
                console.error('Form submission error:', error); // Log network or other unexpected errors.
                statusMessage.textContent = 'Network error. Please try again later.';
                statusMessage.classList.remove('hidden');
                showToast('Network error. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false; // Re-enable the submit button.
                submitText.textContent = 'Send Message'; // Restore button text.
            }
        });
    } // End of Contact Form Submission

    // =========================================================================
    // 11. Intersection Observer for Fade-Up Animations
    // =========================================================================
    // Uses the Intersection Observer API to trigger CSS fade-up animations
    // when elements become visible in the viewport.
    const fadeUpElements = document.querySelectorAll('.animate-fade-up');
    // Configuration options for the Intersection Observer.
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => { // Iterate over each observed entry.
            if (entry.isIntersecting) { // If the element is currently intersecting the viewport.
                entry.target.style.opacity = 1; // Make it fully visible.
                entry.target.style.transform = 'translateY(0)'; // Move it to its final position.
                observer.unobserve(entry.target); // Stop observing this element to prevent re-triggering.
            }
        });
    }, observerOptions); // Pass the defined options to the observer.

    // Initialize elements for fade-up animation:
    // Set initial styles (hidden and slightly moved down) and start observing them.
    fadeUpElements.forEach(el => {
        el.style.opacity = 0; // Hide elements initially
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    // End of Intersection Observer

    // =========================================================================
    // 12. Navbar Scroll Behavior
    // =========================================================================
    // Dynamically adds/removes CSS classes to the navbar based on scroll position,
    // creating a sticky/scrolling effect.
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // If scrolled down more than 50px.
                navbar.classList.add('bg-bg/95', 'backdrop-blur-md', 'border-b', 'border-border');
            } else {
                navbar.classList.remove('bg-bg/95', 'backdrop-blur-md', 'border-b', 'border-border');
            }
        });
    } // End of Navbar Scroll Behavior

    // =========================================================================
    // 13. Final Lucide Icons Initialization
    // =========================================================================
    // Ensures all static Lucide icons (those defined directly in HTML with `data-lucide` attributes)
    // are rendered after the entire page and the Lucide library itself have fully loaded.
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
                    console.warn('Lucide icons library not fully initialized for static icons, retrying...'); // Warn if icons are not yet registered.
                    setTimeout(tryRenderAllLucideIcons, 100); // Retry with a slightly longer delay
                }
            } else {
                console.error('Lucide icons library not found or createIcons method missing on window.load.'); // This is a more critical error
            }
        };
        tryRenderAllLucideIcons(); // Initiate the retry mechanism.
    }); // End of Lucide Icons Initialization

    // =========================================================================
    // 14. Dynamic Copyright Year
    // =========================================================================
    // Automatically updates the copyright year in the footer to the current year,
    // ensuring it's always up-to-date without manual intervention.
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        const currentYear = new Date().getFullYear();
        currentYearSpan.textContent = currentYear;
    };

    // =========================================================================
    // 15. "Hire Me" Button Scroll
    // =========================================================================
    // In main.js, within the DOMContentLoaded listener:
    const hireMeButton = document.getElementById('hire-me');
    if (hireMeButton) {
        hireMeButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior if it's inside a form or has a default action
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    // ==================== Image Zoom Modal ====================
    const imageModal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');

    window.openImageModal = function(src) {
        if (!imageModal || !modalImg) return;
        modalImg.src = src;
        imageModal.classList.remove('hidden');
        imageModal.classList.add('flex');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';

        // Trigger animation
        setTimeout(() => {
            modalImg.classList.remove('scale-95', 'opacity-0');
            modalImg.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    window.closeImageModal = function() {
        if (!imageModal || !modalImg) return;
        
        modalImg.classList.remove('scale-100', 'opacity-100');
        modalImg.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            imageModal.classList.add('hidden');
            imageModal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal && !imageModal.classList.contains('hidden')) {
            window.closeImageModal();
        }
    });
});
