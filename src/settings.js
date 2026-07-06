import './shared.js';

class SettingsPreferencesController {
  constructor() {
    this.init();
  }

  init() {
    this.loadProfile();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Save Profile Preferences
    const profileForm = document.getElementById("settings-profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProfile();
      });
    }

    // Factory Reset
    const resetBtn = document.getElementById("factory-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.executeFactoryReset();
      });
    }
  }

  loadProfile() {
    const nameInput = document.getElementById("prof-name");
    const semesterInput = document.getElementById("prof-semester");

    if (nameInput) {
      nameInput.value = localStorage.getItem("student_name") || "";
    }
    if (semesterInput) {
      semesterInput.value = localStorage.getItem("student_semester") || "";
    }
  }

  saveProfile() {
    const nameInput = document.getElementById("prof-name");
    const semesterInput = document.getElementById("prof-semester");

    if (nameInput && semesterInput) {
      const name = nameInput.value.trim();
      const sem = semesterInput.value.trim();

      if (!name || !sem) {
        window.sharedController.showToast("Required fields cannot be empty");
        return;
      }

      localStorage.setItem("student_name", name);
      localStorage.setItem("student_semester", sem);

      window.sharedController.showToast("Academic Profile Saved");
      window.sharedController.addNotification("Profile Updated", `Student name registered as "${name}" under semester state: "${sem}".`);
    }
  }

  executeFactoryReset() {
    const btn = document.getElementById("factory-reset-btn");
    if (!btn) return;

    if (btn.getAttribute("data-confirming") !== "true") {
      // First click: transition to confirmation state
      btn.setAttribute("data-confirming", "true");
      btn.innerHTML = "⚠️ Confirm Reset?";
      btn.style.backgroundColor = "var(--danger)";
      btn.style.color = "#ffffff";
      
      // Auto-revert after 4 seconds if not clicked again
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        if (btn && btn.getAttribute("data-confirming") === "true") {
          btn.removeAttribute("data-confirming");
          btn.innerHTML = "Reset Storage";
          btn.style.backgroundColor = "var(--danger-bg)";
          btn.style.color = "var(--danger)";
        }
      }, 4000);
      return;
    }

    // Second click: perform the reset operation
    if (this.resetTimer) clearTimeout(this.resetTimer);

    // Clear all keys
    localStorage.removeItem("academic_subjects");
    localStorage.removeItem("academic_requirements");
    localStorage.removeItem("academic_schedule");
    localStorage.removeItem("academic_notifications");
    localStorage.removeItem("student_name");
    localStorage.removeItem("student_semester");
    localStorage.removeItem("selected_subject_id");

    window.sharedController.showToast("Database Reset Complete!");
    
    // Post notice then redirect to home dashboard
    setTimeout(() => {
      location.href = "/index.html";
    }, 1000);
  }
}

window.settingsController = new SettingsPreferencesController();
export default window.settingsController;
