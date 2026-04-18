document.addEventListener('DOMContentLoaded', () => {
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => {
                preloader.remove();
            });
        });
    }

    // --- Declare Theme Toggle buttons early to avoid TypeError ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');

    // --- Theme Toggle ---
    const htmlElement = document.documentElement;

    // Helper function to update a single theme icon element dynamically
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

        // Re-render only the newly added icon using Lucide
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons({ container: newIcon });
        }
    }

    const currentTheme = localStorage.getItem('theme'); // Now themeToggleBtn is defined
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

    // Main function to update both theme icons
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

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex'); // Assuming you want flex for mobile menu
            mobileMenu.classList.toggle('flex-col');
        });

        // Close mobile menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex', 'flex-col');
            });
        });
    }

    // --- Scroll to Top Button ---
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // Show button after scrolling 300px
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- Typewriter Effect ---
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

    // --- Hero Canvas Particle Animation (Simple) ---
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const numParticles = 150; // Increased particle quantity for higher density
        let mouse = {
            x: null,
            y: null,
            radius: 100 // Repulsion radius for particles
        };
        const maxLineDistance = 100; // Maximum distance for particles to connect with a line


        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 2;
                this.speedX = Math.random() * 1 - 0.5; // Increased particle speed
                this.speedY = Math.random() * 1 - 0.5; // Increased particle speed
                this.color = `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.1})`; // Accent color with transparency
            }
            // Method to calculate distance and apply repulsion from mouse
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
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.1) this.size -= 0.01;
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

        function initParticles() {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                // Draw lines between nearby particles
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
                particles[i].repel(); // Apply repulsion
                particles[i].draw();
                if (particles[i].size <= 0.1) {
                    particles.splice(i, 1);
                    particles.push(new Particle());
                }
            }
            requestAnimationFrame(animateParticles);
        }

        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', (event) => {
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

    // --- Terminal Simulator ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    let commands = {}; // Declare commands as a mutable object

    // Fetch commands from JSON file
    fetch('assets/js/commands.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            commands = data; // Assign fetched data to commands
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

            // Update dynamic commands
            // Initial welcome message after commands are loaded
            if (terminalOutput) {
                addOutput('Welcome to devops.sh — type \'help\' to get started.');
            }
        })
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

    // --- Flip Card Functionality ---
    window.flipCard = function(button) {
        const card = button.closest('.flip-card');
        if (card) {
            card.classList.toggle('flipped');
        }
    };

    // --- Copy to Clipboard & Toast Notifications ---
    const toastContainer = document.getElementById('toast-container');

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

    // --- Contact Form Submission (Formspree) ---
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const statusMessage = document.getElementById('status-message');

    if (contactForm && submitBtn && statusMessage) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formspreeId = submitBtn.getAttribute('data-formspree');
            if (!formspreeId || formspreeId === 'YOUR_FORMSPREE_ID') {
                showToast('Please replace YOUR_FORMSPREE_ID in index.html for the contact form.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitText.textContent = 'Sending...';
            statusMessage.classList.add('hidden');

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
                    showToast('Message sent successfully!');
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        statusMessage.textContent = data.errors.map(error => error.message).join(', ');
                    } else {
                        statusMessage.textContent = 'Oops! There was an error sending your message.';
                    }
                    statusMessage.classList.remove('hidden');
                    showToast('Failed to send message.', 'error');
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

    // --- Intersection Observer for fade-up animations ---
    const fadeUpElements = document.querySelectorAll('.animate-fade-up');
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Stop observing once animated
            } else {
                // Reset for elements that scroll out of view and might come back
                // entry.target.style.opacity = 0;
                // entry.target.style.transform = 'translateY(20px)';
            }
        });
    }, observerOptions);

    fadeUpElements.forEach(el => {
        el.style.opacity = 0; // Hide elements initially
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // --- Navbar sticky/scroll behavior (optional, if you want it to change on scroll) ---
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

    // --- Final Lucide Icons initialization after all elements are in DOM and attributes are set ---
    initializeAllLucideIcons(); // Corrected function call
});