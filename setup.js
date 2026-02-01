// ===============================
// Setup Page Logic (Refactored)
// ===============================
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "dark");
}

// Elements
const subjectsContainer = document.getElementById("subjectsContainer");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const saveSetupBtn = document.getElementById("saveSetupBtn");

// ===============================
// Dark Mode Toggle
// ===============================
const toggleBtn = document.getElementById("themeToggle");

document.body.classList.toggle(
  "dark",
  localStorage.getItem("theme") !== "light"
);
toggleBtn && (toggleBtn.textContent =
  document.body.classList.contains("dark") ? "☀️" : "🌙"
);

toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
});


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
function saveSetupDraft() {
  const draft = {
    courseName: document.getElementById("courseName")?.value || "",
    startDate: document.getElementById("startDate")?.value || "",
    clinical: {
      days: document.getElementById("clinicalDays")?.value || "",
      hours: document.getElementById("clinicalHours")?.value || "",
      minPercent: document.getElementById("clinicalMinPercent")?.value || ""
    },
    subjects: []
  };

  document.querySelectorAll(".subject-card").forEach(card => {
    draft.subjects.push({
      name: card.querySelector(".subject-name")?.value || "",
      theory: card.querySelector(".theory-per-week")?.value || "",
      practical: card.querySelector(".practical-per-week")?.value || "",
      hasPractical: card.querySelector(".has-practical")?.checked || false,
      minPercent: card.querySelector(".min-percent")?.value || ""
    });
  });

  localStorage.setItem("setupDraft", JSON.stringify(draft));
}

function restoreSetupDraft() {
  const raw = localStorage.getItem("setupDraft");
  if (!raw) return;

  const data = JSON.parse(raw);

  document.getElementById("courseName").value = data.courseName || "";
  document.getElementById("startDate").value = data.startDate || "";

  document.getElementById("clinicalDays").value = data.clinical.days || "";
  document.getElementById("clinicalHours").value = data.clinical.hours || "";
  document.getElementById("clinicalMinPercent").value = data.clinical.minPercent || "";

  subjectsContainer.innerHTML = "";

  if (data.subjects.length === 0) {
    subjectsContainer.appendChild(createSubjectCard());
    return;
  }

  data.subjects.forEach(s => {
    const card = createSubjectCard();
    card.querySelector(".subject-name").value = s.name;
    card.querySelector(".theory-per-week").value = s.theory;
    card.querySelector(".practical-per-week").value = s.practical;
    card.querySelector(".has-practical").checked = s.hasPractical;
    card.querySelector(".min-percent").value = s.minPercent;

    card.querySelector(".practical-wrapper")
      .classList.toggle("open", s.hasPractical);

    card.querySelector(".no-practical-badge")
      .classList.toggle("hidden", s.hasPractical);

    subjectsContainer.appendChild(card);
  });
}


function createSubjectCard() {
  const card = document.createElement("div");
  card.className = "subject-card";
  const uid = crypto.randomUUID();
  const defaultMin = getDefaultMinPercent();

  card.innerHTML = `
    <label>Subject Name</label>
    <input type="text" class="subject-name" placeholder="e.g. Pathology">

    <div class="checkbox-row">
    <span class="no-practical-badge hidden">No practicals</span>
    <input type="checkbox" class="has-practical" checked id="hasPractical-${uid}">
    <label for="hasPractical-${uid}">This subject has practicals</label>
    </div>



    <div class="inputs">
      <input type="number" class="theory-per-week" placeholder="Theory / week">
      <div class="practical-wrapper open">
        <input type="number"
         class="practical-per-week"
         placeholder="Practical / week">
</div>

    </div>

    <label>Minimum Attendance %</label>
    <input type="number" class="min-percent" value="${defaultMin}">

    <button class="danger-btn">Remove Subject</button>
  `;

  const practicalCheckbox = card.querySelector(".has-practical");
  const practicalWrapper = card.querySelector(".practical-wrapper");

  const badge = card.querySelector(".no-practical-badge");

  practicalCheckbox.addEventListener("change", () => {
    practicalWrapper.classList.toggle("open", practicalCheckbox.checked);
    badge.classList.toggle("hidden", practicalCheckbox.checked);
  
    if (!practicalCheckbox.checked) {
      practicalWrapper.querySelector("input").value = "";
    }
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
  localStorage.removeItem("setupDraft");

  localStorage.setItem("attendanceSetup", JSON.stringify(setupData));
  window.location.href = "tracker.html";
});

// -------------------------------
// Init
// -------------------------------
document.addEventListener("input", e => {
  if (
    e.target.closest(".subject-card") ||
    e.target.closest(".card")
  ) {
    saveSetupDraft();
  }
});

restoreSetupDraft();

if (subjectsContainer.children.length === 0) {
  subjectsContainer.appendChild(createSubjectCard());
}

