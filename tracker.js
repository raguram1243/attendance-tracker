// ===============================
// Load Setup
// ===============================
const setupData = JSON.parse(localStorage.getItem("attendanceSetup"));
if (!setupData) {
  showToast("No setup found. Redirecting.");
  window.location.href = "setup.html";
}


if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "dark");
}
document.body.classList.toggle(
  "dark",
  localStorage.getItem("theme") !== "light"
);

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
function launchConfetti() {
  const confetti = document.getElementById("confetti");
  confetti.innerHTML = "";

  const colors = ["#22c55e", "#3b82f6", "#facc15", "#ec4899"];

  for (let i = 0; i < 28; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.3 + "s";

    confetti.appendChild(piece);
  }

  setTimeout(() => (confetti.innerHTML = ""), 1800);
}

function dangerFlash() {
  const modal = document.getElementById("skipResultModal");
  modal.classList.add("danger-flash");

  setTimeout(() => {
    modal.classList.remove("danger-flash");
  }, 600);
}


function openTodaySelector() {
  const list = document.getElementById("todaySubjects");
  list.innerHTML = "";

  setupData.subjects.forEach((s, i) => {
    // Theory
    list.innerHTML += `
      <div class="today-item" data-i="${i}" data-type="theory">
        <span class="label-text">${s.name} (Theory)</span>
        <span class="check-icon">✓</span>
        <input type="checkbox" hidden>
      </div>
    `;

    // Practical
    if (s.hasPractical) {
      list.innerHTML += `
        <div class="today-item" data-i="${i}" data-type="practical">
          <span class="label-text">${s.name} (Practical)</span>
          <span class="check-icon">✓</span>
          <input type="checkbox" hidden>
        </div>
      `;
    }
  });

  document.getElementById("skipModal").classList.remove("hidden");
}


function showSkipResult(type, message) {
  const gif = document.getElementById("resultGif");
  gif.style.display = "none";
  gif.src = "";

  const modal = document.getElementById("skipResultModal");
  const card = modal.querySelector(".modal-card");

  card.classList.remove("result-safe", "result-warn", "result-danger");
  void card.offsetWidth; // force reflow (restart animation)
  
  if (type === "safe") {
    card.classList.add("result-safe");
    launchConfetti();
  }
  
  if (type === "warn") {
    card.classList.add("result-warn");
  
    gif.src = "assets/risky.gif";   // ⚠️ your risky GIF
    gif.style.display = "block";
  }
  
  if (type === "danger") {
    card.classList.add("result-danger");
    dangerFlash();
  
    gif.src = "assets/danger.gif";  // ❌ your danger GIF
    gif.style.display = "block";
  }
  
  
  

  document.getElementById("skipResultTitle").textContent =
    type === "safe" ? "✅ Safe to Skip" :
    type === "warn" ? "⚠️ Risky to Skip" :
    "❌ Don’t Skip Today";

  document.getElementById("skipResultText").textContent = message;

  modal.classList.remove("hidden");
}

document.getElementById("closeSkipResult")
  ?.addEventListener("click", () => {
    const modal = document.getElementById("skipResultModal");
    modal.classList.add("hidden");
    modal.classList.remove("danger-flash");

    const confetti = document.getElementById("confetti");
    if (confetti) confetti.innerHTML = "";

    const gif = document.getElementById("resultGif");
    if (gif) {
      gif.src = "";
      gif.style.display = "none";
    }
  });



document.getElementById("skipResultModal")
  ?.addEventListener("click", e => {
    if (e.target.id === "skipResultModal") {
      e.currentTarget.classList.add("hidden");
    }
  });


function saveState() {
  const data = {
    subjects: [],
    clinical: {
      attended: document.getElementById("clinicalAttended")?.value || "",
      total: document.getElementById("clinicalTotal")?.value || ""
    }
  };

  document.querySelectorAll(".subject-card").forEach((card, i) => {
    const theoryAtt = card.querySelector('[data-t="theory-att"] input')?.value || "";
    const theoryTot = card.querySelector('[data-t="theory-tot"]')?.value || "";
    const pracAtt = card.querySelector('[data-t="p-att"] input')?.value || "";
    const pracTot = card.querySelector('[data-t="p-tot"]')?.value || "";

    data.subjects.push({
      theoryAtt,
      theoryTot,
      pracAtt,
      pracTot
    });
  });

  localStorage.setItem("attendanceData", JSON.stringify(data));
}

function restoreState() {
  const raw = localStorage.getItem("attendanceData");
  if (!raw) return;

  const data = JSON.parse(raw);

  document.querySelectorAll(".subject-card").forEach((card, i) => {
    const s = data.subjects[i];
    if (!s) return;

    const tAtt = card.querySelector('[data-t="theory-att"] input');
    const tTot = card.querySelector('[data-t="theory-tot"]');

    if (tAtt) tAtt.value = s.theoryAtt;
    if (tTot) tTot.value = s.theoryTot;

    const pAtt = card.querySelector('[data-t="p-att"] input');
    const pTot = card.querySelector('[data-t="p-tot"]');

    if (pAtt) pAtt.value = s.pracAtt;
    if (pTot) pTot.value = s.pracTot;
  });

  const cAtt = document.getElementById("clinicalAttended");
  const cTot = document.getElementById("clinicalTotal");

  if (cAtt) cAtt.value = data.clinical.attended;
  if (cTot) cTot.value = data.clinical.total;
}




const $ = q => document.querySelector(q);
function triggerGlow(bar) {
  bar.classList.remove("progress-glow");
  void bar.offsetWidth; // force reflow
  bar.classList.add("progress-glow");
}

function bindSteppers() {
  document.querySelectorAll(".stepper input").forEach(input => {
    if (!input.dataset.swipeBound) {
      addSwipeStepper(input);
      input.dataset.swipeBound = "true";
    }
  });
}


function safePercent(att, tot) {
  if (att === null || tot === null || tot === 0) return null;
  return Math.min((att / tot) * 100, 100);
}
function addSwipeStepper(input, min = 0, max = 999) {
  let startX = null;
  let lastValue = parseInt(input.value || 0);

  input.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    lastValue = parseInt(input.value || 0);
  }, { passive: true });

  input.addEventListener("touchmove", e => {
    if (startX === null) return;

    const deltaX = e.touches[0].clientX - startX;

    // threshold to avoid accidental changes
    if (Math.abs(deltaX) < 20) return;

    let newValue = lastValue + (deltaX > 0 ? 1 : -1);
    newValue = Math.max(min, Math.min(max, newValue));

    input.value = newValue;
    input.dispatchEvent(new Event("input"));

    if (navigator.vibrate) navigator.vibrate([4, 8]);

    startX = e.touches[0].clientX;
    lastValue = newValue;
  }, { passive: true });

  input.addEventListener("touchend", () => {
    startX = null;
  });
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
  bindSteppers();
}

// ===============================
// Calculate
// ===============================
function calculate() {
  let subjectAvgs = [];
  let overallAvgs = [];

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

    const tPct = safePercent(tAtt, tTot)

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

      const pPct = safePercent(pAtt, pTot)

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
  saveState();
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


  }
}


document.addEventListener("click", e => {
  if (!e.target.classList.contains("edit-btn")) return;

  haptic("medium");

  const input = e.target.previousElementSibling;
  if (!input) return;

  // mark clinical total edited
  if (input.id === "clinicalTotal") {
    localStorage.setItem("clinicalTotalEdited", "true");
  }

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

const skipBtn = document.getElementById("skipBtn");
skipBtn.addEventListener("click", () => {
  haptic("medium");
  openTodaySelector();
});

// Toggle selection for today's class cards
document.addEventListener("click", e => {
  const item = e.target.closest(".today-item");
  if (!item) return;

  const checkbox = item.querySelector("input");
  checkbox.checked = !checkbox.checked;

  item.classList.toggle("selected", checkbox.checked);
});


document.getElementById("confirmSkip")
  ?.addEventListener("click", () => {
    haptic("medium");

    let reasons = [];

    document
      .querySelectorAll('#todaySubjects .today-item.selected')
      .forEach(item => {
        const i = item.dataset.i;
        const type = item.dataset.type;
        const subject = setupData.subjects[i];

        const attInput = document.querySelector(
          `.stepper[data-i="${i}"][data-t="${type === "theory" ? "theory-att" : "p-att"}"] input`
        );

        const totInput = document.querySelector(
          `[data-i="${i}"][data-t="${type === "theory" ? "theory-tot" : "p-tot"}"]`
        );

        const att = attInput?.value === "" ? null : Number(attInput.value);
        const tot = Number(totInput?.value || 0);

        if (willSkippingTodayBeDanger(att, tot, subject.minPercent)) {
          reasons.push(`${subject.name} (${type})`);
        }
      });

    // Clinical
    if (document.getElementById("todayClinical")?.checked) {
      const cAtt = clinicalAtt.value === "" ? null : Number(clinicalAtt.value);
      const cTot = Number(clinicalTot.value || 0);

      if (willSkippingTodayBeDanger(cAtt, cTot, setupData.clinical.minPercent)) {
        reasons.push("Clinical Posting");
      }
    }

    document.getElementById("skipModal").classList.add("hidden");

    if (!reasons.length) {
      showSkipResult(
        "safe",
        "No problem cut Adikalam."
      );
    } else if (reasons.length <= 2) {
      showSkipResult(
        "warn",
        "Skipping today may affect:\n" + reasons.join(", ")
      );
    } else {
      showSkipResult(
        "danger",
        "Attendance will fall below the minimum requirement.\n Dai Paramaa poi padi daa !!"
      );
    }
    
  });




// ===============================
// Init
// ===============================
const weeks = weeksBetween(new Date(setupData.startDate), new Date());

renderSubjects();
requestAnimationFrame(() => {
  restoreState(); 
  calculate();
});


const clinicalEdited = localStorage.getItem("clinicalTotalEdited") === "true";

if (
  !clinicalEdited &&
  (
    clinicalTot.value === "" ||
    Number(clinicalTot.value) === 0
  )
) {
  clinicalTot.value = weeks * setupData.clinical.daysPerWeek;
}
showDailyReminderIfNeeded();
