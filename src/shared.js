// Shared Application Controller

class SharedUIController {
  constructor() {
    this.cleanupMockData();
    this.notifications = JSON.parse(localStorage.getItem("academic_notifications")) || [];
    this.init();
  }

  cleanupMockData() {
    try {
      // 1. Subjects cleanup
      const subjectsStr = localStorage.getItem("academic_subjects");
      if (subjectsStr) {
        const subjects = JSON.parse(subjectsStr);
        if (Array.isArray(subjects)) {
          const mockIds = ["sub-csn-301", "sub-adb-402", "sub-mth-104"];
          const filtered = subjects.filter(s => s && s.id && !mockIds.includes(s.id));
          if (filtered.length !== subjects.length) {
            localStorage.setItem("academic_subjects", JSON.stringify(filtered));
          }
        }
      }

      // 2. Requirements cleanup
      const requirementsStr = localStorage.getItem("academic_requirements");
      if (requirementsStr) {
        const requirements = JSON.parse(requirementsStr);
        if (Array.isArray(requirements)) {
          const mockReqIds = ["req-1", "req-2", "req-3"];
          const filtered = requirements.filter(r => r && r.id && !mockReqIds.includes(r.id));
          if (filtered.length !== requirements.length) {
            localStorage.setItem("academic_requirements", JSON.stringify(filtered));
          }
        }
      }

      // 3. Schedule cleanup
      const scheduleStr = localStorage.getItem("academic_schedule");
      if (scheduleStr) {
        const schedule = JSON.parse(scheduleStr);
        if (Array.isArray(schedule)) {
          const filtered = schedule.filter(s => s && s.id !== 1 && s.id !== 2);
          if (filtered.length !== schedule.length) {
            localStorage.setItem("academic_schedule", JSON.stringify(filtered));
          }
        }
      }

      // 4. Notifications cleanup
      const notificationsStr = localStorage.getItem("academic_notifications");
      if (notificationsStr) {
        const notifications = JSON.parse(notificationsStr);
        if (Array.isArray(notifications)) {
          const filtered = notifications.filter(n => n && n.id !== 1 && n.title !== "Welcome to AcademEcZ");
          if (filtered.length !== notifications.length) {
            localStorage.setItem("academic_notifications", JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.warn("Failed to clean up old mock data:", e);
    }
  }

  init() {
    // Inject Toast Container if not exists
    if (!document.getElementById("toast-container")) {
      const toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    // Apply saved theme preference on page load
    this.applySavedTheme();

    // Setup global hooks once document is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindSharedEvents());
    } else {
      this.bindSharedEvents();
    }
  }

  bindSharedEvents() {
    // Clock Updates
    this.startClock();

    // Mobile Sidebar Toggling
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("sidebar");
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
      });
      // Close sidebar if clicking main content area on mobile
      const mainWrapper = document.querySelector(".main-wrapper");
      if (mainWrapper) {
        mainWrapper.addEventListener("click", () => {
          if (sidebar.classList.contains("active")) {
            sidebar.classList.remove("active");
          }
        });
      }
    }

    // Header Theme Toggle Buttons
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Settings Theme Toggle checkbox
    const settingsThemeToggle = document.getElementById("settings-theme-toggle");
    if (settingsThemeToggle) {
      settingsThemeToggle.checked = document.body.classList.contains("dark-mode");
      settingsThemeToggle.addEventListener("change", (e) => {
        this.setTheme(e.target.checked ? "dark" : "light");
      });
    }

    this.renderThemeIcons();
  }

  startClock() {
    const clockEl = document.getElementById("current-time-val");
    const updateTime = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString() + " - " + now.toLocaleDateString();
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  applySavedTheme() {
    const savedTheme = localStorage.getItem("app_theme") || "dark";
    if (savedTheme === "light") {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
    }
    this.renderThemeIcons();
  }

  toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    this.setTheme(isDark ? "light" : "dark");
  }

  setTheme(theme) {
    if (theme === "dark") {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("app_theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
      localStorage.setItem("app_theme", "light");
    }

    // Sync theme settings checkbox if on settings page
    const settingsThemeToggle = document.getElementById("settings-theme-toggle");
    if (settingsThemeToggle) {
      settingsThemeToggle.checked = (theme === "dark");
    }

    this.renderThemeIcons();
    this.showToast(`Switched to ${theme} mode`);
  }

  renderThemeIcons() {
    const iconContainer = document.getElementById("theme-toggle-icon");
    if (!iconContainer) return;

    const isDark = document.body.classList.contains("dark-mode");
    if (isDark) {
      // Render Sun Icon
      iconContainer.innerHTML = `
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      `;
    } else {
      // Render Moon Icon
      iconContainer.innerHTML = `
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      `;
    }
  }

  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-color)">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove after animation completes (3 seconds)
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  addNotification(title, text) {
    const newNotif = {
      id: Date.now(),
      title,
      text,
      date: new Date().toLocaleDateString()
    };
    this.notifications.unshift(newNotif);
    // Maintain max 10 logs
    if (this.notifications.length > 10) {
      this.notifications.pop();
    }
    localStorage.setItem("academic_notifications", JSON.stringify(this.notifications));
    
    // Refresh overview logs if function is available
    if (window.overviewController && typeof window.overviewController.renderNotifications === "function") {
      window.overviewController.renderNotifications();
    }
  }
}

window.sharedController = new SharedUIController();
export default window.sharedController;
