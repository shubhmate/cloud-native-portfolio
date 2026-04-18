/* COPY THIS JAVASCRIPT CODE INTO YOUR index.html BEFORE THE TERMINAL SIMULATION SECTION */

    // Theme Toggle
    function toggleTheme() {
      const html = document.documentElement;
      const isDark = html.classList.toggle('light');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
      updateThemeIcons();
      lucide.createIcons();
    }

    function updateThemeIcons() {
      const isDark = !document.documentElement.classList.contains('light');
      const icon = isDark ? 'moon' : 'sun';
      document.querySelectorAll('[id*="theme-toggle"] i').forEach(el => {
        el.setAttribute('data-lucide', icon);
      });
    }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    }
    updateThemeIcons();

    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);

    // Scroll to Top Button
    const scrollBtn = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    });
    scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Toast Notifications
    function showToast(message, type = 'success', duration = 3000) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    // Copy to Clipboard
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success', 2000);
      }).catch(() => {
        showToast('Failed to copy', 'error');
      });
    }

    // Keyboard navigation for flip cards
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.flip-card')) {
        e.preventDefault();
        const card = e.target.closest('.flip-card');
        if (card) flipCard(card.querySelector('button'));
      }
    });

/* END OF NEW JAVASCRIPT CODE */
