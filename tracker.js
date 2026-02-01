// ===============================
// Load Setup
// ===============================
const setupData = JSON.parse(localStorage.getItem("attendanceSetup"));
if (!setupData) {
  showToast("No setup found. Redirecting.");
  window.location.href = "setup.html";
}



// ===============================
// Dark Mode Toggle
// ===============================
const toggleBtn = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleBtn && (toggleBtn.textContent = "☀️");
}

toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
});

// ===============================
// Helpers
// ===============================
const $ = q => document.querySelector(q);
function triggerGlow(bar) {
  bar.classList.remove("progress-glow");
  void bar.offsetWidth; // force reflow
  bar.classList.add("progress-glow");
}
function safePercent(att, tot) {
  if (att === null || tot === null || tot === 0) return null;
  return Math.min((att / tot) * 100, 100);
}


function weeksBetween(start, end) {
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24 * 7)));
}

function color(p) {
  if (p === null) return "";
  if (p >= 85) return "green";
  if (p >= 75) return "yellow";
  return "red";
}

function classesNeeded(att, tot, min) {
  if (att === null || tot === 0) return null;
  const t = min / 100;
  const need = Math.ceil((t * tot - att) / (1 - t));
  return need > 0 ? need : 0;
}

function clampTotal(att, tot) {
  if (tot === null) return tot;
  if (att !== null && tot < att) return att;
  return tot;
}

function maxMissable(att, tot, min) {
  if (att === null || tot === 0) return 0;
  const m = min / 100;
  const miss = Math.floor((att - m * tot) / m);
  return miss > 0 ? miss : 0;
}

function willSkippingTodayBeDanger(att, tot, min) {
  if (att === null || tot === 0) return false;
  const pctIfSkipped = (att / (tot + 1)) * 100;
  return pctIfSkipped < min;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(() => t.classList.remove("show"), 2200);
}


// ===============================
// Elements
// ===============================
const subjectsTracker = $("#subjectsTracker");
const overallPercentEl = $("#overallPercent");
const overallStatusEl = $("#overallStatus");
const subjectsPercentEl = $("#subjectsPercent");
const overallBar = $("#overallBar");
const subjectsBar = $("#subjectsBar");
const clinicalBar = $("#clinicalBar");
const clinicalNeedEl = $("#clinicalNeed");
const clinicalAtt = $("#clinicalAttended");
const clinicalTot = $("#clinicalTotal");
const clinicalPctEl = $("#clinicalPercent");



$("#editSetupBtn")?.addEventListener("click", () => {
  window.location.href = "setup.html";
});

document.querySelectorAll('input[name="reminderTime"]').forEach(radio => {
  if (radio.value === localStorage.getItem("reminderTime")) {
    radio.checked = true;
  }

  radio.addEventListener("change", () => {
    localStorage.setItem("reminderTime", radio.value);
  });
});

// ===============================
// Render Subjects
// ===============================
function renderSubjects() {
  subjectsTracker.innerHTML = "";

  const weeks = weeksBetween(
    new Date(setupData.startDate),
    new Date()
  );

  setupData.subjects.forEach((s, i) => {
    const theoryTotal = weeks * s.theoryPerWeek;
    const practicalTotal = s.hasPractical ? weeks * s.practicalPerWeek : 0;

    const div = document.createElement("div");
    div.className = "subject-card";

    div.innerHTML = `
      <strong>${s.name}</strong>

      <small>Theory</small>
      <div class="inputs">
        <div class="stepper" data-i="${i}"data-t="theory-att">
        <button class="minus">−</button>
        <input type="number">
        <button class="plus">+</button>
        </div>

        <div class="total-box">
  <input type="number"
         class="total-input"
         data-i="${i}"
         data-t="theory-tot"
         value="${theoryTotal}"
         readonly>

  <button class="edit-btn" type="button">✏️</button>
</div>



      </div>
      <div class="percent" id="tPct-${i}"></div>
      <div class="need" id="tNeed-${i}"></div>
      <div class="can-miss" id="tMiss-${i}"></div>
      <div class="progress" id="tBar-${i}"><div></div></div>

      ${
        s.hasPractical
          ? `
        <small>Practical</small>
        <div class="inputs">
        <div class="stepper" data-i="${i}" data-t="p-att">
        <button class="minus">−</button>
        <input type="number">
        <button class="plus">+</button>
      </div>
      <div class="total-box">
  <input type="number"
         class="total-input"
         data-i="${i}"
         data-t="p-tot"
         value="${practicalTotal}"
         readonly>

  <button class="edit-btn" type="button">✏️</button>
</div>


          </div>
        <div class="percent" id="pPct-${i}"></div>
        <div class="need" id="pNeed-${i}"></div>
        <div class="can-miss" id="pMiss-${i}"></div>
        <div class="progress" id="pBar-${i}"><div></div></div>
      `
          : ""
      }
    `;

    subjectsTracker.appendChild(div);
  });
}

// ===============================
// Calculate
// ===============================
function calculate() {
  let subjectAvgs = [];
  let overallAvgs = [];
  haptic("light");

  setupData.subjects.forEach((s, i) => {
    let parts = [];

    // THEORY
   const tTotInput = $(`[data-i="${i}"][data-t="theory-tot"]`);

    const tAttInput = document.querySelector(
      `.stepper[data-i="${i}"][data-t="theory-att"] input`
    );
    
    const tAtt =
      !tAttInput || tAttInput.value === ""
        ? null
        : Number(tAttInput.value);
    
    let tTot = Number(tTotInput.value);

    tTot = clampTotal(tAtt, tTot);
    tTotInput.value = tTot;

    const tPct = safePercent(tAtt === "" ? null : Number(tAtt), tTot);

    updateBlock(`t`, i, tPct, tAtt, tTot, s.minPercent);
    if (tPct !== null) parts.push(tPct);

    // PRACTICAL
    if (s.hasPractical) {
      const pAttInput = document.querySelector(
        `.stepper[data-i="${i}"][data-t="p-att"] input`
      );
      
      const pTotInput = $(`[data-i="${i}"][data-t="p-tot"]`);

      const pAtt = pAttInput.value === "" ? null : Number(pAttInput.value);
      let pTot = Number(pTotInput.value);

      pTot = clampTotal(pAtt, pTot);
      pTotInput.value = pTot;

      const pPct = safePercent(pAtt === "" ? null : Number(pAtt), pTot);

      updateBlock(`p`, i, pPct, pAtt, pTot, s.minPercent);
      if (pPct !== null) parts.push(pPct);
    }

    if (parts.length) {
      const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
      subjectAvgs.push(avg);
      overallAvgs.push(avg);
    }
  });

  // CLINICAL
  const cAtt = clinicalAtt.value === "" ? null : Number(clinicalAtt.value);
  let cTot = Number(clinicalTot.value);

    cTot = clampTotal(cAtt, cTot);
    clinicalTot.value = cTot;

  const cPct = safePercent(cAtt, cTot);

  if (cPct !== null) overallAvgs.push(cPct);
  updateClinical(cPct, cAtt, cTot);

  updateOverall(subjectAvgs, overallAvgs);
}

// ===============================
// UI Helpers
// ===============================
function animateNumber(el, from, to, duration = 400) {
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = from + (to - from) * progress;
    el.textContent = value.toFixed(1) + "%";

    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}


function updateBlock(prefix, i, pct, att, tot, min) {
  const pctEl = $(`#${prefix}Pct-${i}`);
  const bar = $(`#${prefix}Bar-${i}`);
  const needEl = $(`#${prefix}Need-${i}`);

  if (pct === null) {
    pctEl.textContent = "";
    bar.className = "progress";
    bar.firstChild.style.width = "0%";
    needEl.textContent = "";
    return;
  }
  if (att === null || tot === 0) {
    pctEl.textContent = "";
    bar.className = "progress";
    bar.firstChild.style.width = "0%";
    needEl.textContent = "Enter attendance";
    needEl.className = "need";
    return;
  }
  
  const prevVal = parseFloat(pctEl.textContent) || 0;
  triggerGlow(bar);

  const prev = parseFloat(pctEl.textContent) || 0;
  animateNumber(pctEl, prev, pct);

  pctEl.classList.remove("pop");
  void pctEl.offsetWidth; // force reflow
  pctEl.classList.add("pop");

  pctEl.className = "percent " + color(pct);
  bar.classList.remove("green", "yellow", "red");
  bar.classList.add("progress", color(pct));

  bar.firstChild.style.width = pct + "%";

  const need = classesNeeded(Number(att), tot, min);
  if (need === 0) {
    needEl.textContent = "Safe ✔";
    needEl.className = "need safe";
  } else {
    needEl.textContent = `Need ${need} classes`;
    needEl.className = "need";
  }

  if (
    pct !== null &&
    classesNeeded(att, tot, min) === 0 &&
    willSkippingTodayBeDanger(att, tot, min)
  ) {
    needEl.textContent = "⚠️ Skipping today will make you unsafe";
    needEl.className = "need warn";
  }
  

  const missEl = document.getElementById(`${prefix}Miss-${i}`);
  const miss = maxMissable(att, tot, min);

  if (missEl) {
  if (miss > 0) {
    missEl.textContent = `You can miss ${miss} classes`;
  } else {
    missEl.textContent = "";
  }
  }

}

function updateClinical(pct, att, tot) {
  const fill = clinicalBar.querySelector("div");

  if (pct === null) {
    clinicalPctEl.textContent = "";
    clinicalNeedEl.textContent = "";
    clinicalBar.className = "progress";
    fill.style.width = "0%";
    return;
  }

  const prev = parseFloat(clinicalPctEl.textContent) || 0;
  animateNumber(clinicalPctEl, prev, pct);

  clinicalPctEl.classList.remove("pop");
  void clinicalPctEl.offsetWidth;
  clinicalPctEl.classList.add("pop");


  clinicalPctEl.className = "percent " + color(pct);

  clinicalBar.className = "progress " + color(pct);
  fill.style.width = pct + "%";

  const need = classesNeeded(att, tot, setupData.clinical.minPercent);
  if (need === 0) {
    clinicalNeedEl.textContent = "Safe ✔";
    clinicalNeedEl.className = "need safe";
  } else {
    clinicalNeedEl.textContent = `Need ${need} days`;
    clinicalNeedEl.className = "need warn";
  }

  triggerGlow(clinicalBar);
  if (
    pct !== null &&
    classesNeeded(att, tot, setupData.clinical.minPercent) === 0 &&
    willSkippingTodayBeDanger(
      att,
      tot,
      setupData.clinical.minPercent
    )
  ) {
    clinicalNeedEl.textContent = "⚠️ Skipping today is risky";
    clinicalNeedEl.className = "need warn";
  }

  
  const missEl = document.getElementById("clinicalMiss");
  const miss = maxMissable(att, tot, setupData.clinical.minPercent);

  if (missEl) {
  if (miss > 0) {
    missEl.textContent = `You can miss ${miss} days`;
  } else {
    missEl.textContent = "";
  }
  }

}



function updateOverall(subjects, overall) {
  if (!overall.length) {
    overallPercentEl.textContent = "—";
    overallStatusEl.textContent = "Enter attendance";
    return;
  }

  const o = overall.reduce((a, b) => a + b, 0) / overall.length;
  const prev = parseFloat(overallPercentEl.textContent) || 0;
  animateNumber(overallPercentEl, prev, o);

  overallPercentEl.classList.remove("pop");
  void overallPercentEl.offsetWidth;
  overallPercentEl.classList.add("pop");


  overallPercentEl.className = color(o);

  overallStatusEl.textContent =
    o >= 75 ? "Eligible for University Exam ✅" : "Attendance Shortage ⚠️";

    overallBar.classList.remove("green", "yellow", "red");
    overallBar.classList.add("progress", color(o));
    
  overallBar.firstChild.style.width = o + "%";
  triggerGlow(overallBar);
  if (subjects.length) {
    const s = subjects.reduce((a, b) => a + b, 0) / subjects.length;
    const prevSub = parseFloat(subjectsPercentEl.textContent) || 0;
    animateNumber(subjectsPercentEl, prevSub, s);

    subjectsPercentEl.classList.remove("pop");
    void subjectsPercentEl.offsetWidth;
    subjectsPercentEl.classList.add("pop");

    subjectsBar.classList.remove("green", "yellow", "red");
    subjectsBar.classList.add("progress", color(s));
    subjectsBar.firstChild.style.width = s + "%";
    triggerGlow(subjectsBar);

    if (Math.abs(prevSub - s) > 0.1) {
      subjectsBar.classList.remove("progress-glow");
      void subjectsBar.offsetWidth;
      subjectsBar.classList.add("progress-glow");
    }

  }
}


document.addEventListener("click", e => {
  if (!e.target.classList.contains("edit-btn")) return;
  haptic("medium");
  const input = e.target.previousElementSibling;
  input.removeAttribute("readonly");
  input.focus();

  input.addEventListener(
    "blur",
    () => input.setAttribute("readonly", true),
    { once: true }
  );
});


const reminderToggle = document.getElementById("dailyReminderToggle");

if (localStorage.getItem("dailyReminder") === "true") {
  reminderToggle.checked = true;
}

reminderToggle?.addEventListener("change", () => {
  haptic("light");
  if (reminderToggle.checked) {
    localStorage.setItem("dailyReminder", "true");
    showToast("Daily reminder enabled ✅\n(Shown when you open the app)");
  } else {
    localStorage.removeItem("dailyReminder");
  }
});


function showDailyReminderIfNeeded() {
  if (localStorage.getItem("dailyReminder") !== "true") return;

  const now = new Date();
  const hour = now.getHours();
  const today = now.toDateString();

  const lastShown = localStorage.getItem("lastReminderDate");
  if (lastShown === today) return;

  const pref = localStorage.getItem("reminderTime") || "morning";

  const isMorning = hour >= 6 && hour < 11;
  const isEvening = hour >= 18 && hour < 22;

  if (
    (pref === "morning" && isMorning) ||
    (pref === "evening" && isEvening)
  ) {
    showToast("🔔 Reminder: Don’t forget to update today’s attendance 📋");
    localStorage.setItem("lastReminderDate", today);
  }
}

document.addEventListener("click", e => {
  const stepper = e.target.closest(".stepper");
  if (!stepper) return;

  const input = stepper.querySelector("input");
  let val = Number(input.value || 0);

  if (e.target.classList.contains("plus")) val++;
  if (e.target.classList.contains("minus")) val = Math.max(0, val - 1);

  input.value = val;
  haptic("light");
  calculate();
});

function haptic(type = "light") {
  if (!("vibrate" in navigator)) return;
  if (!document.hasFocus()) return;

  navigator.vibrate(
    { light: 10, medium: 20, heavy: 30 }[type] || 10
  );
}


// ===============================
// Init
// ===============================
const weeks = weeksBetween(new Date(setupData.startDate), new Date());
clinicalTot.value = weeks * setupData.clinical.daysPerWeek;

renderSubjects();
document.addEventListener("input", calculate);
calculate();
showDailyReminderIfNeeded();
