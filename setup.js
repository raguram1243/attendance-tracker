// ===============================
// Setup Page Logic (Refactored)
// ===============================

// Elements
const subjectsContainer = document.getElementById("subjectsContainer");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const saveSetupBtn = document.getElementById("saveSetupBtn");

// -------------------------------
// Helpers
// -------------------------------
function getDefaultMinPercent() {
  const input = document.querySelector(".card .min-percent");
  return input ? Number(input.value) || 75 : 75;
}

// -------------------------------
// Subject Card
// -------------------------------
function createSubjectCard() {
  const card = document.createElement("div");
  card.className = "subject-card";

  const defaultMin = getDefaultMinPercent();

  card.innerHTML = `
    <label>Subject Name</label>
    <input type="text" class="subject-name" placeholder="e.g. Pathology">

    <label>
      <input type="checkbox" class="has-practical" checked>
      This subject has practicals
    </label>

    <div class="inputs">
      <input type="number" class="theory-per-week" placeholder="Theory / week">
      <input type="number" class="practical-per-week practical-input"
             placeholder="Practical / week">
    </div>

    <label>Minimum Attendance %</label>
    <input type="number" class="min-percent" value="${defaultMin}">

    <button class="danger-btn">Remove Subject</button>
  `;

  const practicalCheckbox = card.querySelector(".has-practical");
  const practicalInput = card.querySelector(".practical-input");

  practicalCheckbox.addEventListener("change", () => {
    practicalInput.style.display = practicalCheckbox.checked ? "block" : "none";
    if (!practicalCheckbox.checked) practicalInput.value = "";
  });

  card.querySelector(".danger-btn").addEventListener("click", () => {
    if (subjectsContainer.children.length > 1) {
      card.remove();
    } else {
      alert("At least one subject is required.");
    }
  });

  return card;
}

// -------------------------------
// Add Subject
// -------------------------------
addSubjectBtn.addEventListener("click", () => {
  subjectsContainer.appendChild(createSubjectCard());
});

// -------------------------------
// Save Setup
// -------------------------------
saveSetupBtn.addEventListener("click", () => {
  const courseName = document.getElementById("courseName").value.trim();
  const startDate = document.getElementById("startDate").value;

  const clinicalDays = document.getElementById("clinicalDays").value;
  const clinicalHours = document.getElementById("clinicalHours").value;
  const clinicalMinPercent = document.getElementById("clinicalMinPercent").value;

  if (!courseName || !startDate) {
    alert("Please fill Academic Details.");
    return;
  }

  if (
    clinicalDays === "" ||
    clinicalHours === "" ||
    clinicalMinPercent === ""
  ) {
    alert("Please fill Clinical Postings details.");
    return;
  }

  const subjects = [];

  document.querySelectorAll(".subject-card").forEach(card => {
    const name = card.querySelector(".subject-name").value.trim();
    const theory = card.querySelector(".theory-per-week").value;
    const practical = card.querySelector(".practical-per-week").value;
    const minPercent = card.querySelector(".min-percent").value;
    const hasPractical = card.querySelector(".has-practical").checked;

    if (!name || theory === "" || minPercent === "") {
      alert("Please complete all subject fields.");
      throw new Error("Invalid subject");
    }

    if (hasPractical && practical === "") {
      alert("Please enter practical classes per week.");
      throw new Error("Invalid practical");
    }

    subjects.push({
      name,
      theoryPerWeek: Number(theory),
      practicalPerWeek: hasPractical ? Number(practical) : 0,
      hasPractical,
      minPercent: Number(minPercent)
    });
  });

  const setupData = {
    courseName,
    startDate,
    subjects,
    clinical: {
      daysPerWeek: Number(clinicalDays),
      hoursPerDay: Number(clinicalHours),
      minPercent: Number(clinicalMinPercent)
    }
  };

  localStorage.setItem("attendanceSetup", JSON.stringify(setupData));
  window.location.href = "tracker.html";
});

// -------------------------------
// Init
// -------------------------------
if (subjectsContainer.children.length === 0) {
  subjectsContainer.appendChild(createSubjectCard());
}
