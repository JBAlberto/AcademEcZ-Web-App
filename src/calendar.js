import './shared.js';

class CalendarController {
  constructor() {
    // Weekly calendar schedule (fixed defaults + user overrides)
    this.weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    this.weekTimes = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

    this.defaultWeeklySchedule = this.loadDefaultWeeklySchedule();
    this.scheduleOverrides = JSON.parse(localStorage.getItem("academic_schedule_overrides")) || {};

    this.weekOffset = 0;
    this.calendarSelected = { day: null, time: null };

    this.init();
  }

  loadDefaultWeeklySchedule() {
    return JSON.parse(
      localStorage.getItem("academic_default_weekly_schedule") || "null"
    ) || {
      Monday: {
        "09:00": "Lecture",
        "10:00": "Lecture",
        "11:00": "Lab/Workshop",
        "13:00": "Study Block",
        "14:00": "Lecture",
        "15:00": "Review",
      },
      Tuesday: {
        "09:00": "Lecture",
        "10:00": "Tutorial/Recap",
        "11:00": "Lecture",
        "13:00": "Lab/Workshop",
        "14:00": "Study Block",
        "15:00": "Review",
      },
      Wednesday: {
        "09:00": "Lecture",
        "10:00": "Lecture",
        "11:00": "Problem Session",
        "13:00": "Study Block",
        "14:00": "Lab/Workshop",
        "15:00": "Review",
      },
      Thursday: {
        "09:00": "Lecture",
        "10:00": "Tutorial/Recap",
        "11:00": "Lecture",
        "13:00": "Lab/Workshop",
        "14:00": "Study Block",
        "15:00": "Review",
      },
      Friday: {
        "09:00": "Lecture",
        "10:00": "Problem Session",
        "11:00": "Lecture",
        "13:00": "Study Block",
        "14:00": "Review",
        "15:00": "No class",
      },
      Saturday: {
        "09:00": "Study Block",
        "10:00": "Lab/Workshop",
        "11:00": "Review",
        "13:00": "No class",
        "14:00": "Study Block",
        "15:00": "No class",
      },
    };
  }

  init() {
    this.saveData();
    this.renderCalendar();
    this.renderNextUp();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  saveData() {
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
    // All event handlers are wired inside renderCalendar
    // (so they work after re-render).
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
        subtitle.textContent = overridden !== undefined
          ? overridden === "No class"
            ? "No class"
            : "Override"
          : "";

        cell.appendChild(title);
        cell.appendChild(subtitle);

        cell.addEventListener("click", () => {
          this.calendarSelected = { day: d, time: t };

          if (formDay) formDay.value = d;
          if (formTime) formTime.value = t;

          if (formActivity) {
            if (overridden !== undefined) {
              formActivity.value = overridden === "No class" ? "" : overridden;
            } else {
              formActivity.value = "";
            }
          }

          if (clearOverrideBtn) {
            clearOverrideBtn.style.display = this.calendarSelected ? "inline-flex" : "none";
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
        this.renderNextUp();
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.weekOffset += 1;
        this.renderCalendar();
        this.renderNextUp();
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
      const selected = this.calendarSelected || {};
      const day = selected.day;
      const time = selected.time;
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
      noClassBtn.onclick = () => applySelectedOverride("No class");
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
      clearOverrideBtn.onclick = () => applySelectedOverride(null);
    }
  }

  getOverrideKey(day, time) {
    return `${day}|${time}`;
  }

  getWeekStartDate(weekOffset) {
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

    const dayToLabel = (dayIndex) => {
      const map = {
        1: "Monday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
        0: null,
      };
      return map[dayIndex] || "Monday";
    };

    const weekDays = this.weekDays.slice();
    const weekTimes = this.weekTimes.slice();

    let startDayIndex = now.getDay();
    let todayLabel = null;
    if (startDayIndex >= 1 && startDayIndex <= 6) {
      todayLabel = dayToLabel(startDayIndex);
    }

    const candidates = [];

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

        if (todayLabel && d === todayLabel) {
          const parts = String(t).split(":").map(Number);
          const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1], 0, 0);
          if (slotDate.getTime() < now.getTime()) continue;
        }

        candidates.push({ day: d, time: t, activity: val });
      }
    }

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
}

window.calendarController = new CalendarController();
export default window.calendarController;

