

import './shared.js';

class AcademicSubjectsController {
  constructor() {
    this.subjects = JSON.parse(localStorage.getItem("academic_subjects")) || [];
    
    // Check if query parameter 'id' is supplied to select the course
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    
    if (urlId && this.subjects.some(s => s.id === urlId)) {
      this.selectedSubjectId = urlId;
    } else {
      this.selectedSubjectId = localStorage.getItem("selected_subject_id") || (this.subjects.length > 0 ? this.subjects[0].id : null);
    }
    
    // Filters State
    this.searchQuery = "";
    this.selectedCategory = "All";

    this.init();
  }

  init() {
    this.saveSubjects();

    // Initial Renders
    this.renderCardsList();
    this.renderDetailPane();
    this.updateStatsLabel();

    // Attach event listeners once DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Search input inside top header
    const searchInput = document.getElementById("subjects-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCardsList();
      });
    }

    // Category filter button pills
    const categoryBtns = document.querySelectorAll("#subject-category-filters .pill-btn");
    categoryBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        categoryBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.selectedCategory = e.currentTarget.getAttribute("data-category");
        this.renderCardsList();
      });
    });

    // Toggle registration panel drawer
    const toggleRegBtn = document.getElementById("toggle-register-panel-btn");
    const closeRegBtn = document.getElementById("close-register-panel-btn");
    const regPanel = document.getElementById("register-subject-panel");

    if (toggleRegBtn && regPanel) {
      toggleRegBtn.addEventListener("click", () => {
        regPanel.classList.toggle("active");
        if (regPanel.classList.contains("active")) {
          document.getElementById("reg-title").focus();
        }
      });
    }

    if (closeRegBtn && regPanel) {
      closeRegBtn.addEventListener("click", () => {
        regPanel.classList.remove("active");
      });
    }

    // Handle new course registration form submission
    const regForm = document.getElementById("register-subject-form");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegisterSubject();
      });
    }
  }

  saveSubjects() {
    localStorage.setItem("academic_subjects", JSON.stringify(this.subjects));
    if (this.selectedSubjectId) {
      localStorage.setItem("selected_subject_id", this.selectedSubjectId);
    } else {
      localStorage.removeItem("selected_subject_id");
    }
  }

  getFilteredSubjects() {
    return this.subjects.filter(sub => {
      const matchesSearch = sub.title.toLowerCase().includes(this.searchQuery) ||
                            sub.code.toLowerCase().includes(this.searchQuery) ||
                            sub.instructor.toLowerCase().includes(this.searchQuery) ||
                            sub.description.toLowerCase().includes(this.searchQuery);
                            
      const matchesCategory = this.selectedCategory === "All" || sub.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  calculateProgress(sub) {
    if (!sub.syllabus || sub.syllabus.length === 0) return 0;
    const completedCount = sub.syllabus.filter(item => item.completed).length;
    return Math.round((completedCount / sub.syllabus.length) * 100);
  }

  updateStatsLabel() {
    const statsEl = document.getElementById("subjects-stats-count");
    if (statsEl) {
      statsEl.textContent = `${this.subjects.length} Course${this.subjects.length === 1 ? '' : 's'} Enrolled`;
    }
  }

  renderCardsList() {
    const container = document.getElementById("subjects-cards-list");
    if (!container) return;

    const filtered = this.getFilteredSubjects();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 36px; text-align: center; color: var(--text-muted);">
          No subjects found matching your query or active category filters.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(sub => {
      const isSelected = sub.id === this.selectedSubjectId;
      const progress = this.calculateProgress(sub);
      const difficultyClass = sub.difficulty === "Advanced" ? "style='color: var(--danger)'" : sub.difficulty === "Intermediate" ? "style='color: var(--warning)'" : "style='color: var(--success)'";

      return `
        <div class="subject-card ${isSelected ? 'selected' : ''}" onclick="academicController.selectSubject('${sub.id}')">
          <div class="subject-card-meta">
            <span class="subject-badge">${sub.code}</span>
            <span ${difficultyClass} font-size="0.75rem" font-weight="600">${sub.difficulty}</span>
          </div>
          <h3 class="subject-title">${sub.title}</h3>
          <div class="subject-instructor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>${sub.instructor}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-secondary); margin-top:12px;">
            <span>Syllabus Completion</span>
            <span style="font-family:var(--font-mono); font-weight:600;">${progress}%</span>
          </div>
          <div class="subject-card-progress-bar">
            <div class="subject-card-progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderDetailPane() {
    const container = document.getElementById("subject-details-container");
    if (!container) return;

    const sub = this.subjects.find(s => s.id === this.selectedSubjectId);

    if (!sub) {
      container.innerHTML = `
        <div class="empty-details-state">
          <div class="empty-details-icon">📚</div>
          <h3 style="font-weight: 700; color: var(--text-primary);">No Subject Selected</h3>
          <p style="font-size: 0.9rem; max-width: 320px;">Choose a subject from the academic board to manage syllabus completion, log study notes, and track your overall milestone progress.</p>
        </div>
      `;
      return;
    }

    const progress = this.calculateProgress(sub);

    // Radial SVG Math
    const r = 40;
    const circ = 2 * Math.PI * r;
    const strokeDashoffset = circ - (progress / 100) * circ;

    container.innerHTML = `
      <!-- Subject Header details -->
      <div class="detail-header">
        <div class="detail-title-section">
          <div style="font-size: 0.8rem; font-family:var(--font-mono); font-weight:600; color:var(--accent-color); margin-bottom:6px; text-transform: uppercase;">
            ${sub.category} &bull; ${sub.code}
          </div>
          <h1 class="detail-title">${sub.title}</h1>
          <div class="subject-instructor" style="font-size: 0.95rem; margin-bottom: 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style="font-weight: 500; color: var(--text-primary);">${sub.instructor}</span>
            <span style="color:var(--text-muted); margin-left: 6px;">(Course Lead)</span>
          </div>
        </div>
        
        <button class="btn" onclick="academicController.handleDropSubject('${sub.id}')" style="background-color: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger); padding: 8px 14px; font-size: 0.85rem; font-weight:600; border-radius: 6px;" title="Drop subject enrollment">
          Drop Subject
        </button>
      </div>

      <!-- Description and Radial Progress Row -->
      <div class="progress-radial-wrapper">
        <div style="flex-grow: 1;">
          <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:6px; color:var(--text-primary);">Course Scope</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">${sub.description}</p>
        </div>
        
        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <svg class="radial-svg" width="96" height="96" viewBox="0 0 100 100">
            <circle class="radial-bg" cx="50" cy="50" r="${r}" fill="transparent" stroke-width="8" />
            <circle class="radial-fill" cx="50" cy="50" r="${r}" fill="transparent" stroke-width="8" 
                    stroke-dasharray="${circ}" stroke-dashoffset="${strokeDashoffset}" />
          </svg>
          <div>
            <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">${progress}%</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing:0.025em;">Syllabus Done</div>
          </div>
        </div>
      </div>

      <!-- Interactive Syllabus Milestone Checklists -->
      <div>
        <h3 style="font-weight: 700; font-size:1.1rem; margin-bottom:12px; color:var(--text-primary);">Syllabus Milestones</h3>
        <div class="syllabus-checklist">
          ${sub.syllabus.map((item, idx) => `
            <div class="syllabus-item ${item.completed ? 'completed' : ''}" onclick="academicController.toggleSyllabusItem(${idx})">
              <input type="checkbox" ${item.completed ? 'checked' : ''} onclick="event.stopPropagation(); academicController.toggleSyllabusItem(${idx})" />
              <label class="syllabus-label">${item.name}</label>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">M-${idx+1}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Live-saving Study Notebook -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-weight: 700; font-size:1.1rem; color:var(--text-primary);">Personal Study Notes</h3>
          <span style="font-size: 0.75rem; color: var(--success); font-family: var(--font-mono); display:none;" id="notes-saving-badge">✓ AUTOSAVED</span>
        </div>
        <textarea class="notes-textarea" id="subject-notes-pad" placeholder="Draft key concepts, definitions, study plans, or outstanding questions for this subject. Notes are saved instantly..." oninput="academicController.handleNotesAutosave(this.value)">${sub.notes || ""}</textarea>
      </div>
    `;
  }

  selectSubject(id) {
    this.selectedSubjectId = id;
    this.saveSubjects();
    this.renderCardsList();
    this.renderDetailPane();
  }

  toggleSyllabusItem(idx) {
    const sub = this.subjects.find(s => s.id === this.selectedSubjectId);
    if (sub && sub.syllabus && sub.syllabus[idx]) {
      const item = sub.syllabus[idx];
      item.completed = !item.completed;
      this.saveSubjects();
      
      // Dynamic rendering refreshes
      this.renderCardsList();
      this.renderDetailPane();
      
      // Toast notification and sound effect
      window.sharedController.showToast(item.completed ? `Completed: ${item.name}` : `Milestone incomplete: ${item.name}`);
    }
  }

  handleNotesAutosave(val) {
    const sub = this.subjects.find(s => s.id === this.selectedSubjectId);
    if (sub) {
      sub.notes = val;
      localStorage.setItem("academic_subjects", JSON.stringify(this.subjects));
      
      // Briefly show the "AUTOSAVED" label
      const badge = document.getElementById("notes-saving-badge");
      if (badge) {
        badge.style.display = "inline";
        if (this.notesTimer) clearTimeout(this.notesTimer);
        this.notesTimer = setTimeout(() => {
          badge.style.display = "none";
        }, 1200);
      }
    }
  }

  handleRegisterSubject() {
    const titleInput = document.getElementById("reg-title");
    const codeInput = document.getElementById("reg-code");
    const instructorInput = document.getElementById("reg-instructor");
    const categorySelect = document.getElementById("reg-category");
    const difficultySelect = document.getElementById("reg-difficulty");
    const syllabusInput = document.getElementById("reg-syllabus");
    const descInput = document.getElementById("reg-desc");

    if (!titleInput || !codeInput || !instructorInput || !categorySelect || !difficultySelect || !syllabusInput || !descInput) return;

    const title = titleInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    const instructor = instructorInput.value.trim();
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    const syllabusRaw = syllabusInput.value.trim();
    const description = descInput.value.trim() || "No course description provided.";

    if (!title || !code || !instructor || !syllabusRaw) {
      window.sharedController.showToast("All registration fields must be provided.");
      return;
    }

    // Convert comma separated list into milestone objects
    const syllabus = syllabusRaw.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(name => ({ name, completed: false }));

    if (syllabus.length === 0) {
      window.sharedController.showToast("Please provide at least one syllabus milestone.");
      return;
    }

    const newId = `sub-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

    const newSubject = {
      id: newId,
      title,
      code,
      category,
      instructor,
      difficulty,
      description,
      syllabus,
      notes: ""
    };

    this.subjects.push(newSubject);
    this.selectedSubjectId = newId;

    this.saveSubjects();
    
    // Refresh page structures
    this.renderCardsList();
    this.renderDetailPane();
    this.updateStatsLabel();

    // Close the panel & reset the form
    document.getElementById("register-subject-panel").classList.remove("active");
    document.getElementById("register-subject-form").reset();

    // Push notification system
    window.sharedController.showToast(`Enrolled: ${title}`);
    window.sharedController.addNotification("Subject Enrolled", `"${title}" (${code}) was added to your courses stack under ${category}.`);
  }

  handleDropSubject(id) {
    const sub = this.subjects.find(s => s.id === id);
    if (!sub) return;

    const btn = document.querySelector("#subject-details-container .detail-header button");
    if (!btn) return;

    if (btn.getAttribute("data-confirming") !== "true") {
      // First click: transition to confirmation state
      btn.setAttribute("data-confirming", "true");
      btn.innerHTML = "⚠️ Confirm Drop?";
      btn.style.backgroundColor = "var(--danger)";
      btn.style.color = "#ffffff";
      
      // Auto-revert after 4 seconds if not clicked again
      if (this.dropTimer) clearTimeout(this.dropTimer);
      this.dropTimer = setTimeout(() => {
        if (btn && btn.getAttribute("data-confirming") === "true") {
          btn.removeAttribute("data-confirming");
          btn.innerHTML = "Drop Subject";
          btn.style.backgroundColor = "var(--danger-bg)";
          btn.style.color = "var(--danger)";
        }
      }, 4000);
      return;
    }

    // Second click: perform the drop operation
    if (this.dropTimer) clearTimeout(this.dropTimer);

    this.subjects = this.subjects.filter(s => s.id !== id);
    
    // If the dropped subject was selected, auto-select the next one
    if (this.selectedSubjectId === id) {
      this.selectedSubjectId = this.subjects.length > 0 ? this.subjects[0].id : null;
    }

    this.saveSubjects();

    // Refresh display
    this.renderCardsList();
    this.renderDetailPane();
    this.updateStatsLabel();

    window.sharedController.showToast(`Dropped: ${sub.title}`);
    window.sharedController.addNotification("Subject Dropped", `"${sub.title}" was successfully removed from your courses panel.`);
  }
}

window.academicController = new AcademicSubjectsController();
