import './shared.js';

class OverviewDashboardController {
  constructor() {
    this.subjects = JSON.parse(localStorage.getItem("academic_subjects")) || [];
    this.requirements = JSON.parse(localStorage.getItem("academic_requirements")) || [];
    this.schedule = JSON.parse(localStorage.getItem("academic_schedule")) || [];

    this.init();
  }

  init() {
    this.saveData();

    // Render Stats & Sections
    this.renderMetrics();
    this.renderRecentCourses();
    this.renderUpcomingRequirements();
    this.renderSchedule();
    this.renderNotifications();

    // Event Bindings
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  saveData() {
    localStorage.setItem("academic_schedule", JSON.stringify(this.schedule));
  }

  bindEvents() {
    // Search filter across pages or general input
    const searchInput = document.getElementById("main-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        // Just filter local dashboard courses or requirements in real-time
        this.renderRecentCourses(query);
        this.renderUpcomingRequirements(query);
      });
    }

    // Handle schedule addition form
    const schForm = document.getElementById("dashboard-schedule-form");
    if (schForm) {
      schForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addScheduleItem();
      });
    }

    // Clear notifications logger
    const clearBtn = document.getElementById("clear-notifications-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        window.sharedController.notifications = [];
        localStorage.setItem("academic_notifications", JSON.stringify([]));
        this.renderNotifications();
        window.sharedController.showToast("Registry logs cleared");
      });
    }
  }

  renderMetrics() {
    // 1. Active Courses
    const coursesCount = document.getElementById("stats-courses-count");
    if (coursesCount) {
      coursesCount.textContent = this.subjects.length;
    }

    // 2. Syllabus Milestones completed
    const progressRatio = document.getElementById("stats-milestones-ratio");
    if (progressRatio) {
      let totalMilestones = 0;
      let completedMilestones = 0;
      this.subjects.forEach(sub => {
        if (sub.syllabus) {
          totalMilestones += sub.syllabus.length;
          completedMilestones += sub.syllabus.filter(m => m.completed).length;
        }
      });
      const ratio = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
      progressRatio.textContent = `${ratio}%`;
    }

    // 3. Pending requirements
    const reqsCount = document.getElementById("stats-requirements-count");
    if (reqsCount) {
      const pending = this.requirements.filter(r => !r.completed).length;
      reqsCount.textContent = pending;
    }

    // 4. Study sprint sessions total hours (each schedule item completed adds 45 mins)
    const hoursCount = document.getElementById("stats-sprint-hours");
    if (hoursCount) {
      const sessionsCount = this.schedule.length * 45;
      hoursCount.textContent = sessionsCount;
    }
  }

  renderRecentCourses(filterQuery = "") {
    const container = document.getElementById("dashboard-recent-courses");
    if (!container) return;

    if (this.subjects.length === 0) {
      container.innerHTML = `
        <div style="grid-column: span 2; background-color: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: 8px; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No registered subjects. Click Browse Board to add courses.
        </div>
      `;
      return;
    }

    const filtered = this.subjects.filter(sub => {
      return sub.title.toLowerCase().includes(filterQuery) || 
             sub.code.toLowerCase().includes(filterQuery) ||
             sub.category.toLowerCase().includes(filterQuery);
    });

    container.innerHTML = filtered.map(sub => {
      // Calculate syllabus progress
      let total = sub.syllabus ? sub.syllabus.length : 0;
      let done = sub.syllabus ? sub.syllabus.filter(item => item.completed).length : 0;
      let percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return `
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;" onclick="location.href='/subjects.html?id=${sub.id}'">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-family: var(--font-mono); font-size:0.7rem; background-color:rgba(99,102,241,0.08); color:var(--accent-color); padding:2px 6px; border-radius:4px; font-weight:600;">${sub.code}</span>
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:500;">${sub.category}</span>
            </div>
            <h4 style="font-size: 0.85rem; font-weight:700; margin-bottom:4px; color:var(--text-primary); line-height:1.3;">${sub.title}</h4>
            <p style="font-size: 0.75rem; color:var(--text-secondary); margin-bottom:12px;">Lead: ${sub.instructor}</p>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-bottom:4px;">
              <span>Milestones</span>
              <span>${percentage}%</span>
            </div>
            <div style="height:3px; background-color:var(--bg-surface); border-radius:10px; overflow:hidden;">
              <div style="width: ${percentage}%; height:100%; background:var(--accent-gradient);"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderUpcomingRequirements(filterQuery = "") {
    const container = document.getElementById("dashboard-upcoming-requirements");
    if (!container) return;

    if (this.requirements.length === 0) {
      container.innerHTML = `
        <div style="background-color: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: 8px; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No requirements mapped. Open Requirements Hub to register class tasks, laboratories, or quizzes.
        </div>
      `;
      return;
    }

    const filtered = this.requirements.filter(req => {
      const matchesQuery = req.title.toLowerCase().includes(filterQuery) || 
                           req.subjectCode.toLowerCase().includes(filterQuery);
      return matchesQuery;
    });

    const pending = filtered.filter(r => !r.completed);
    
    if (pending.length === 0) {
      container.innerHTML = `
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center; color: var(--success); font-size: 0.85rem; font-weight: 500;">
          🎉 Fantastic! All listed coursework and requirements are complete.
        </div>
      `;
      return;
    }

    container.innerHTML = pending.slice(0, 4).map(req => {
      const priorityClass = req.priority === "High" ? "priority-high" : req.priority === "Medium" ? "priority-medium" : "priority-low";
      return `
        <div class="task-item">
          <div class="task-item-left">
            <input type="checkbox" class="task-check" onclick="overviewController.toggleRequirement('${req.id}')" />
            <div class="task-details">
              <span class="task-title">${req.title}</span>
              <div class="task-meta">
                <span class="task-badge-subject">${req.subjectCode}</span>
                <span class="priority-badge ${priorityClass}">${req.priority}</span>
              </div>
            </div>
          </div>
          <div class="task-item-right">
            <span class="due-date">DUE: ${req.dueDate}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  toggleRequirement(id) {
    const req = this.requirements.find(r => r.id === id);
    if (req) {
      req.completed = true;
      localStorage.setItem("academic_requirements", JSON.stringify(this.requirements));
      
      this.renderMetrics();
      this.renderUpcomingRequirements();
      window.sharedController.showToast(`Completed Task: ${req.title}`);
      window.sharedController.addNotification("Requirement Cleared", `"${req.title}" under ${req.subjectCode} was toggled complete.`);
    }
  }

  renderSchedule() {
    const container = document.getElementById("dashboard-schedule-items");
    if (!container) return;

    if (this.schedule.length === 0) {
      container.innerHTML = `
        <div style="background-color: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: 8px; padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
          No class schedules or study sprints mapped yet.
        </div>
      `;
      return;
    }

    container.innerHTML = this.schedule.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; background-color: var(--bg-surface); padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 6px;">
        <div style="display:flex; flex-direction:column;">
          <span style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">${item.activity}</span>
          <span style="font-size:0.7rem; color:var(--text-muted); font-weight:500;">${item.day} &bull; ${item.time}</span>
        </div>
        <button onclick="overviewController.deleteScheduleItem(${item.id})" style="background:none; border:none; color:var(--text-muted); cursor:pointer;" title="Delete schedule">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    `).join("");
  }

  addScheduleItem() {
    const actInput = document.getElementById("sch-activity");
    const daySelect = document.getElementById("sch-day");
    const timeInput = document.getElementById("sch-time");

    if (!actInput || !daySelect || !timeInput) return;

    const activity = actInput.value.trim();
    const day = daySelect.value;
    const time = timeInput.value;

    if (!activity || !time) return;

    const newItem = {
      id: Date.now(),
      activity,
      day,
      time
    };

    this.schedule.push(newItem);
    this.saveData();
    this.renderSchedule();
    this.renderMetrics();

    actInput.value = "";
    timeInput.value = "";

    window.sharedController.showToast("Lecture schedule registered");
    window.sharedController.addNotification("Class/Sprint Synced", `"${activity}" scheduled for ${day} at ${time}.`);
  }

  deleteScheduleItem(id) {
    const item = this.schedule.find(s => s.id === id);
    this.schedule = this.schedule.filter(s => s.id !== id);
    this.saveData();
    this.renderSchedule();
    this.renderMetrics();
    
    if (item) {
      window.sharedController.showToast(`Deleted: ${item.activity}`);
    }
  }

  renderNotifications() {
    const container = document.getElementById("dashboard-notifications-log");
    if (!container) return;

    const logs = window.sharedController.notifications;

    if (logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 12px 0;">
          No recent system actions registered.
        </div>
      `;
      return;
    }

    container.innerHTML = logs.slice(0, 5).map(log => `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; last-child: border-bottom: none;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-primary);">${log.title}</span>
          <span style="font-family:var(--font-mono); font-size:0.65rem; color:var(--text-muted);">${log.date}</span>
        </div>
        <p style="font-size:0.7rem; color:var(--text-secondary); line-height:1.4;">${log.text}</p>
      </div>
    `).join("");
  }
}

window.overviewController = new OverviewDashboardController();
export default window.overviewController;
