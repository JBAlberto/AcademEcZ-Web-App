import './shared.js';

class OverviewDashboardController {
  constructor() {
    this.subjects = JSON.parse(localStorage.getItem("academic_subjects")) || [];
    this.requirements = JSON.parse(localStorage.getItem("academic_requirements")) || [];

    // Weekly calendar schedule (fixed defaults + user overrides)
    this.weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    this.weekTimes = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

    this.defaultWeeklySchedule = this.loadDefaultWeeklySchedule();
    this.scheduleOverrides = JSON.parse(localStorage.getItem("academic_schedule_overrides")) || {};

    // weekOffset = 0 => current week. Can navigate weeks.
    this.weekOffset = 0;

    this.init();
  }

  loadDefaultWeeklySchedule() {
    // Fixed weekly schedule baseline.
    // User can override per (day,time).
    return JSON.parse(
      localStorage.getItem("academic_default_weekly_schedule") || "null"
    ) || {
      Monday: {
        "09:00": "Lecture",
        "10:00": "Lecture",
        "11:00": "Lab/Workshop",
        "13:00": "Study Block",
        "14:00": "Lecture",
        "15:00": "Review"
      },
      Tuesday: {
        "09:00": "Lecture",
        "10:00": "Tutorial/Recap",
        "11:00": "Lecture",
        "13:00": "Lab/Workshop",
        "14:00": "Study Block",
        "15:00": "Review"
      },
      Wednesday: {
        "09:00": "Lecture",
        "10:00": "Lecture",
        "11:00": "Problem Session",
        "13:00": "Study Block",
        "14:00": "Lab/Workshop",
        "15:00": "Review"
      },
      Thursday: {
        "09:00": "Lecture",
        "10:00": "Tutorial/Recap",
        "11:00": "Lecture",
        "13:00": "Lab/Workshop",
        "14:00": "Study Block",
        "15:00": "Review"
      },
      Friday: {
        "09:00": "Lecture",
        "10:00": "Problem Session",
        "11:00": "Lecture",
        "13:00": "Study Block",
        "14:00": "Review",
        "15:00": "No class"
      },
      Saturday: {
        "09:00": "Study Block",
        "10:00": "Lab/Workshop",
        "11:00": "Review",
        "13:00": "No class",
        "14:00": "Study Block",
        "15:00": "No class"
      }
    };
  }


  init() {
    // Persist schedule config if needed
    this.saveData();

    // Render Stats & Sections
    this.renderMetrics();
    this.renderRecentCourses();
    this.renderUpcomingRequirements();

    this.renderNotifications();
    this.renderCalendar();
    this.renderNextUp();


    // Event Bindings


    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  saveData() {
    // Keep default weekly schedule and overrides persisted.
    localStorage.setItem(
      "academic_default_weekly_schedule",
      JSON.stringify(this.defaultWeeklySchedule)
    );
    localStorage.setItem(
      "academic_schedule_overrides",
      JSON.stringify(this.scheduleOverrides)
    );
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



  renderCalendar() {
    const cal = document.getElementById("weekly-calendar");
    const weekTitle = document.getElementById("calendar-week-title");
    const rangeSubtitle = document.getElementById("calendar-range-subtitle");

    const prevBtn = document.getElementById("calendar-prev-btn");
    const nextBtn = document.getElementById("calendar-next-btn");
    const resetBtn = document.getElementById("calendar-reset-btn");

    const formDay = document.getElementById("cal-day");
    const formTime = document.getElementById("cal-time");
    const formActivity = document.getElementById("cal-activity");

    const noClassBtn = document.getElementById("cal-no-class-btn");
    const saveForm = document.getElementById("calendar-editor-form");
    const clearOverrideBtn = document.getElementById("cal-clear-override-btn");

    if (!cal) return;

    const weekStart = this.getWeekStartDate(this.weekOffset);


    const fmt = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    if (weekTitle) weekTitle.textContent = `Week of ${fmt(weekStart)}`;
    if (rangeSubtitle)
      rangeSubtitle.textContent = `${this.weekDays[0].slice(0, 3)} - ${this.weekDays[this.weekDays.length - 1].slice(0, 3)}`;

    // Selected cell state
    if (!this.calendarSelected) this.calendarSelected = { day: null, time: null };

    // Build header + time rows
    cal.innerHTML = "";

    // Header row (day labels)
    const timeHead = document.createElement("div");
    timeHead.className = "cal-head";
    timeHead.style.gridColumn = "1";
    timeHead.textContent = "Time";
    cal.appendChild(timeHead);

    this.weekDays.forEach((d) => {
      const h = document.createElement("div");
      h.className = "cal-head";
      h.textContent = d.slice(0, 3);
      cal.appendChild(h);
    });

    // Cells
    this.weekTimes.forEach((t) => {
      const timeCell = document.createElement("div");
      timeCell.className = "cal-slot-time";
      timeCell.style.display = "flex";
      timeCell.style.alignItems = "center";
      timeCell.style.justifyContent = "center";
      timeCell.style.height = "42px";
      timeCell.style.border = "1px solid var(--border-color)";
      timeCell.style.borderRadius = "10px";
      timeCell.style.backgroundColor = "var(--bg-secondary)";
      timeCell.style.width = "86px";
      timeCell.style.marginTop = "8px";
      timeCell.textContent = t;
      cal.appendChild(timeCell);

      this.weekDays.forEach((d) => {
        const overrideKey = this.getOverrideKey(d, t);
        const overridden = this.scheduleOverrides[overrideKey];


        // Make calendar empty by default: only show content for explicit overrides.
        const defaultVal = this.defaultWeeklySchedule?.[d]?.[t] || "No class";
        const val = overridden !== undefined ? overridden : "";

        const cell = document.createElement("div");
        cell.className = "cal-cell";
        if (overridden !== undefined) cell.classList.add("override");
        if (overridden !== undefined && overridden === "No class") cell.classList.add("no-class");

        const title = document.createElement("div");
        title.className = "cal-slot-title";
        title.textContent = val || "";

        const subtitle = document.createElement("div");
        subtitle.className = "cal-slot-subtitle";
        subtitle.textContent = overridden !== undefined ? (overridden === "No class" ? "No class" : "Override") : "";


        cell.appendChild(title);
        cell.appendChild(subtitle);

        cell.addEventListener("click", () => {
          this.calendarSelected = { day: d, time: t };
          if (formDay) formDay.value = d;
          if (formTime) formTime.value = t;
          if (formActivity) {
            // Only prefill editor if an override exists; otherwise start blank.
            // This keeps the editor from showing implicit default values.
            if (overridden !== undefined) {
              formActivity.value = overridden === "No class" ? "" : overridden;
            } else {
              formActivity.value = "";
            }
          }


          // Save mode badge
          const clearOverrideExists = !!this.calendarSelected;
          if (clearOverrideBtn) {
            clearOverrideBtn.style.display = clearOverrideExists ? "inline-flex" : "none";
          }
        });

        cal.appendChild(cell);
      });
    });

    // Navigation
    if (prevBtn) {
      prevBtn.onclick = () => {
        this.weekOffset -= 1;
        this.renderCalendar();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.weekOffset += 1;
        this.renderCalendar();
      };
    }
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.scheduleOverrides = {};
        this.saveData();
        this.renderCalendar();
        this.renderNextUp();
        window.sharedController.showToast("Calendar overrides reset");
      };
    }

    const applySelectedOverride = (valueOrNull) => {

      // Allow editing day/time in the form inputs.
      const formDayValue = (document.getElementById("cal-day")?.value || "").trim();
      const formTimeValue = (document.getElementById("cal-time")?.value || "").trim();

      const selected = this.calendarSelected || {};
      const day = formDayValue || selected.day;
      const time = formTimeValue || selected.time;
      if (!day || !time) return;

      const overrideKey = this.getOverrideKey(day, time);



      if (valueOrNull === null) {
        delete this.scheduleOverrides[overrideKey];
      } else {
        this.scheduleOverrides[overrideKey] = valueOrNull;
      }

      this.saveData();
      this.renderCalendar();
      this.renderNextUp();
      window.sharedController.showToast("Schedule updated");
    };

    if (noClassBtn) {
      noClassBtn.onclick = () => {
        applySelectedOverride("No class");
      };
    }

    if (saveForm) {
      saveForm.onsubmit = (e) => {
        e.preventDefault();
        const activity = (formActivity?.value || "").trim();
        if (!activity) {
          window.sharedController.showToast("Enter an activity name or use “No class”.");
          return;
        }
        applySelectedOverride(activity);
      };
    }

    if (clearOverrideBtn) {
      clearOverrideBtn.onclick = () => {
        applySelectedOverride(null);
      };
    }
  }

  getOverrideKey(day, time) {
    // Fixed schedule: same edits apply every week.
    return `${day}|${time}`;
  }


  getWeekStartDate(weekOffset) {
    // Monday-based week start.
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = d.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }









  renderNextUp() {
    const container = document.getElementById("dashboard-next-up");
    if (!container) return;

    const now = new Date();
    // Convert JS day (0=Sun..6=Sat) to our labels
    const dayToLabel = (dayIndex) => {
      const map = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
        0: null
      };
      return map[dayIndex] || "Monday";
    };

    // Build a candidate list from the current week baseline (Mon..Sat)
    const weekDays = this.weekDays.slice();
    const weekTimes = this.weekTimes.slice();

    // Determine starting point: today (if within Mon..Sat) else next Monday
    let startDayIndex = now.getDay(); // 0=Sun
    let startLabel = null;
    if (startDayIndex >= 1 && startDayIndex <= 6) {
      startLabel = dayToLabel(startDayIndex);
    }

    // Helper to compare times within a day



    const todayLabel = startLabel;
    const candidates = [];

    // Iterate all week days in order, and all times in order
    // If we are before the first day (Sunday), treat as starting at Monday.
    let started = todayLabel ? false : true;

    for (const d of weekDays) {
      if (!started) {
        if (d === todayLabel) started = true;
        else continue;
      }

      for (const t of weekTimes) {
        const overrideKey = this.getOverrideKey(d, t);
        const overridden = this.scheduleOverrides[overrideKey];

        const val = overridden !== undefined ? overridden : (this.defaultWeeklySchedule?.[d]?.[t] ?? "");
        if (!val) continue;

        // If it's today, skip past slots
        if (todayLabel && d === todayLabel) {
          const [h, m] = String(t).split(":").map(Number);


          const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
          if (slotDate.getTime() < now.getTime()) continue;
        }

        candidates.push({ day: d, time: t, activity: val });
      }
    }

    // If nothing remains, wrap to next week first candidate
    let next = candidates[0] || null;

    if (!next) {
      for (const d of weekDays) {
        for (const t of weekTimes) {
          const overrideKey = this.getOverrideKey(d, t);
          const overridden = this.scheduleOverrides[overrideKey];
          const val = overridden !== undefined ? overridden : (this.defaultWeeklySchedule?.[d]?.[t] ?? "");
          if (val) {
            next = { day: d, time: t, activity: val };
            break;
          }
        }
        if (next) break;
      }
    }

    if (!next) {
      container.innerHTML = `
        <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; color: var(--text-muted); font-size: 0.85rem; text-align:center;">
          No schedule found. Update your Weekly Schedule.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap: 10px;">
        <div style="display:flex; justify-content:space-between; gap: 12px; align-items:center;">
          <div style="font-weight:800;">Next up</div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${next.day} • ${next.time}</div>
        </div>
        <div style="background-color: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
          <div style="font-size: 0.9rem; font-weight: 700;">${next.activity}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px;">This is your weekly schedule (fixed via overrides).</div>
        </div>
      </div>
    `;
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
