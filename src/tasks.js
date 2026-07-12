import './shared.js';

class CourseworkTasksController {
  constructor() {
    this.subjects = JSON.parse(localStorage.getItem("academic_subjects")) || [];
    this.requirements = JSON.parse(localStorage.getItem("academic_requirements")) || [];

    this.activeFilterStatus = "All";
    this.searchQuery = "";

    this.init();
  }

  // dueDate is stored from <input type="date"> => "YYYY-MM-DD"
  // We treat the deadline as the end of that day (23:59:59.999).
  getDueDateEndTimestamp(dueDateStr) {
    if (!dueDateStr) return null;
    const parts = String(dueDateStr).split("-").map(n => Number(n));
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

    const [yyyy, mm, dd] = parts;
    // Local time end-of-day
    return new Date(yyyy, mm - 1, dd, 23, 59, 59, 999).getTime();
  }

  msToLateLabel(lateMs) {
    if (lateMs <= 0) return "";

    const minute = 60 * 1000;
    const hour = 60 * 60 * 1000;
    const day = 24 * 60 * 60 * 1000;

    const abs = lateMs;
    if (abs >= day) {
      const days = Math.floor(abs / day);
      return `${days} day${days === 1 ? "" : "s"} late`;
    }
    if (abs >= hour) {
      const hours = Math.floor(abs / hour);
      return `${hours} hour${hours === 1 ? "" : "s"} late`;
    }

    const minutes = Math.max(1, Math.floor(abs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} late`;
  }

  isOverdue(req) {
    if (!req || req.completed) return false;
    const dueEnd = this.getDueDateEndTimestamp(req.dueDate);
    if (dueEnd == null) return false;
    return Date.now() > dueEnd;
  }

  init() {
    this.saveData();

    // Renders
    this.renderSubjectDropdown();
    this.renderRequirementsList();

    // Event hooks
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  saveData() {
    localStorage.setItem("academic_requirements", JSON.stringify(this.requirements));
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById("tasks-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderRequirementsList();
      });
    }

    // Filter pill buttons
    const statusBtns = document.querySelectorAll("#task-status-filters .pill-btn");
    statusBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        statusBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.activeFilterStatus = e.currentTarget.getAttribute("data-status");
        this.renderRequirementsList();
      });
    });

    // Register requirement form submit
    const regForm = document.getElementById("register-task-form");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleAddTask();
      });
    }
  }

  renderSubjectDropdown() {
    const dropdown = document.getElementById("task-subject");
    if (!dropdown) return;

    if (this.subjects.length === 0) {
      dropdown.innerHTML = `<option value="" disabled selected>No active courses - register one first!</option>`;
      return;
    }

    dropdown.innerHTML = this.subjects.map(sub => `
      <option value="${sub.code}">${sub.code} - ${sub.title}</option>
    `).join("");
  }

  getFilteredRequirements() {
    return this.requirements.filter(req => {
      // Search matches title or subject code
      const matchesSearch = req.title.toLowerCase().includes(this.searchQuery) || 
                            req.subjectCode.toLowerCase().includes(this.searchQuery);

      // Filter matches All, Pending or Completed
      let matchesFilter = true;
      if (this.activeFilterStatus === "Pending") {
        matchesFilter = !req.completed;
      } else if (this.activeFilterStatus === "Completed") {
        matchesFilter = req.completed;
      }

      return matchesSearch && matchesFilter;
    });
  }

  renderRequirementsList() {
    const container = document.getElementById("requirements-tasks-list");
    const countBadge = document.getElementById("tasks-count-badge");
    if (!container) return;

    const filtered = this.getFilteredRequirements();

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Task${filtered.length === 1 ? '' : 's'} Filtered`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-muted);">
          No academic requirements or milestones found matching current selection.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(req => {
      const priorityClass = req.priority === "High" ? "priority-high" : req.priority === "Medium" ? "priority-medium" : "priority-low";
      const completedClass = req.completed ? "completed" : "";
      const overdueClass = this.isOverdue(req) ? "overdue" : "";

      let completionLateLabel = "";
      if (req.completed && typeof req.completedLateMs === "number" && req.completedLateMs > 0) {
        completionLateLabel = this.msToLateLabel(req.completedLateMs);
      }

      return `
        <div class="task-item ${completedClass} ${overdueClass}">
          <div class="task-item-left">
            <input type="checkbox" class="task-check" ${req.completed ? 'checked' : ''} onclick="tasksController.toggleRequirement('${req.id}')" />
            <div class="task-details">
              <span class="task-title">${req.title}</span>
              <div class="task-meta">
                <span class="task-badge-subject">${req.subjectCode}</span>
                <span class="priority-badge ${priorityClass}">${req.priority}</span>
              </div>
            </div>
          </div>
          <div class="task-item-right">
            <span class="due-date">
              ${req.completed
                ? (completionLateLabel ? `COMPLETED ${completionLateLabel}` : 'COMPLETED')
                : `SUBMIT BY: ${req.dueDate}`}
            </span>
            <button class="task-delete-btn" onclick="tasksController.deleteRequirement('${req.id}')" title="Remove requirement">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  toggleRequirement(id) {
    const req = this.requirements.find(r => r.id === id);
    if (!req) return;

    const nextCompleted = !req.completed;

    req.completed = nextCompleted;

    if (req.completed) {
      req.completedAt = Date.now();
      const dueEnd = this.getDueDateEndTimestamp(req.dueDate);
      req.completedLateMs = dueEnd == null
        ? 0
        : Math.max(0, req.completedAt - dueEnd);
    } else {
      // reset completion lateness metadata
      req.completedAt = undefined;
      req.completedLateMs = undefined;
    }

    this.saveData();
    this.renderRequirementsList();

    window.sharedController.showToast(req.completed ? "Requirement cleared!" : "Requirement set to pending");
    window.sharedController.addNotification(
      "Requirement Updated",
      `"${req.title}" was marked as ${req.completed ? "Completed" : "Incomplete"}.`
    );
  }

  handleAddTask() {
    const titleInput = document.getElementById("task-title");
    const subjectSelect = document.getElementById("task-subject");
    const prioritySelect = document.getElementById("task-priority");
    const dateInput = document.getElementById("task-duedate");

    if (!titleInput || !subjectSelect || !dateInput) return;

    const title = titleInput.value.trim();
    const subjectCode = subjectSelect.value;
    const priority = prioritySelect.value;
    const dueDate = dateInput.value;

    if (!title || !subjectCode || !dueDate) {
      window.sharedController.showToast("Please supply all task registration metrics.");
      return;
    }

    const newId = `req-${Date.now()}`;

    const newReq = {
      id: newId,
      title,
      subjectCode,
      priority,
      dueDate,
      completed: false
    };

    this.requirements.unshift(newReq);
    this.saveData();

    // Renders
    this.renderRequirementsList();

    // Reset Inputs
    titleInput.value = "";
    dateInput.value = "";

    window.sharedController.showToast(`Task Registered: ${title}`);
    window.sharedController.addNotification("Course Requirement Added", `Task "${title}" logged under subject ${subjectCode} (Priority: ${priority}).`);
  }

  deleteRequirement(id) {
    const req = this.requirements.find(r => r.id === id);
    if (!req) return;

    this.requirements = this.requirements.filter(r => r.id !== id);
    this.saveData();
    this.renderRequirementsList();

    window.sharedController.showToast("Requirement removed from stack");
    window.sharedController.addNotification("Requirement Removed", `"${req.title}" under ${req.subjectCode} was deleted.`);
  }
}

window.tasksController = new CourseworkTasksController();
export default window.tasksController;
