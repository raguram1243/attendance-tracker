// ===============================
// Load Setup
// ===============================
const setupData = JSON.parse(localStorage.getItem("attendanceSetup"));
if (!setupData) {
  alert("No setup found. Redirecting.");
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

function weeksBetween(start, end) {
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24 * 7)));
}

function percent(att, tot) {
  if (att === null || tot === 0) return null;
  return Math.min((att / tot) * 100, 100);
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
        <input type="number" data-i="${i}" data-t="theory-att">
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
      <div class="progress" id="tBar-${i}"><div></div></div>

      ${
        s.hasPractical
          ? `
        <small>Practical</small>
        <div class="inputs">
          <input type="number" data-i="${i}" data-t="p-att">
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

  setupData.subjects.forEach((s, i) => {
    let parts = [];

    // THEORY
    const tAttInput = $(`[data-i="${i}"][data-t="theory-att"]`);
    const tTotInput = $(`[data-i="${i}"][data-t="theory-tot"]`);

    const tAtt = tAttInput.value === "" ? null : Number(tAttInput.value);
    let tTot = Number(tTotInput.value);

    tTot = clampTotal(tAtt, tTot);
    tTotInput.value = tTot;

    const tPct = percent(tAtt === "" ? null : Number(tAtt), tTot);

    updateBlock(`t`, i, tPct, tAtt, tTot, s.minPercent);
    if (tPct !== null) parts.push(tPct);

    // PRACTICAL
    if (s.hasPractical) {
      const pAttInput = $(`[data-i="${i}"][data-t="p-att"]`);
      const pTotInput = $(`[data-i="${i}"][data-t="p-tot"]`);

      const pAtt = pAttInput.value === "" ? null : Number(pAttInput.value);
      let pTot = Number(pTotInput.value);

      pTot = clampTotal(pAtt, pTot);
      pTotInput.value = pTot;

      const pPct = percent(pAtt === "" ? null : Number(pAtt), pTot);

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

  const cPct = percent(cAtt, cTot);

  if (cPct !== null) overallAvgs.push(cPct);
  updateClinical(cPct, cAtt, cTot);

  updateOverall(subjectAvgs, overallAvgs);
}

// ===============================
// UI Helpers
// ===============================
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

  pctEl.textContent = pct.toFixed(1) + "%";
  pctEl.className = "percent " + color(pct);
  bar.className = "progress " + color(pct);
  bar.firstChild.style.width = pct + "%";

  const need = classesNeeded(Number(att), tot, min);
  if (need === 0) {
    needEl.textContent = "Safe ✔";
    needEl.className = "need safe";
  } else {
    needEl.textContent = `Need ${need} classes`;
    needEl.className = "need";
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

  clinicalPctEl.textContent = pct.toFixed(1) + "%";
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
}



function updateOverall(subjects, overall) {
  if (!overall.length) {
    overallPercentEl.textContent = "—";
    overallStatusEl.textContent = "Enter attendance";
    return;
  }

  const o = overall.reduce((a, b) => a + b, 0) / overall.length;
  overallPercentEl.textContent = o.toFixed(1) + "%";
  overallPercentEl.className = color(o);

  overallStatusEl.textContent =
    o >= 75 ? "Eligible for University Exam ✅" : "Attendance Shortage ⚠️";

  overallBar.className = "progress " + color(o);
  overallBar.firstChild.style.width = o + "%";

  if (subjects.length) {
    const s = subjects.reduce((a, b) => a + b, 0) / subjects.length;
    subjectsPercentEl.textContent = s.toFixed(1) + "%";
    subjectsBar.className = "progress " + color(s);
    subjectsBar.firstChild.style.width = s + "%";
  }
}


document.addEventListener("click", e => {
  if (!e.target.classList.contains("edit-btn")) return;

  const input = e.target.previousElementSibling;
  input.removeAttribute("readonly");
  input.focus();

  input.addEventListener(
    "blur",
    () => input.setAttribute("readonly", true),
    { once: true }
  );
});

// ===============================
// Init
// ===============================
const weeks = weeksBetween(new Date(setupData.startDate), new Date());
clinicalTot.value = weeks * setupData.clinical.daysPerWeek;

renderSubjects();
document.addEventListener("input", calculate);
calculate();
