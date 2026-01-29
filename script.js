const inputs = document.querySelectorAll("input");
const skipBtn = document.getElementById("skipBtn");

inputs.forEach(input => {
  input.addEventListener("input", calculate);
});

skipBtn.addEventListener("click", canISkip);

function getColorClass(p) {
  if (p >= 75) return "green";
  if (p >= 70) return "yellow";
  return "red";
}

function calculateSubject(att, tot, label) {
  if (!att || !tot || tot === 0) {
    label.textContent = "";
    return null;
  }
  const pct = (att / tot) * 100;
  label.textContent = pct.toFixed(1) + "%";
  label.className = "percent " + getColorClass(pct);
  return pct;
}

function calculate() {
  const p = calculateSubject(p_att.value, p_tot.value, p_pct);
  const ph = calculateSubject(ph_att.value, ph_tot.value, ph_pct);
  const m = calculateSubject(m_att.value, m_tot.value, m_pct);

  const valid = [p, ph, m].filter(v => v !== null);
  if (valid.length === 0) return;

  const avg = valid.reduce((a,b)=>a+b,0)/valid.length;

  overallPercent.textContent = avg.toFixed(1) + "%";
  overallPercent.className = getColorClass(avg);

  overallStatus.textContent =
    avg >= 75 ? "Safe 😌" :
    avg >= 70 ? "Warning 😬" :
    "Danger 🚨";
}

function canISkip() {
  const today = Number(todayClasses.value || 0);

  const subjects = [
    [p_att.value, p_tot.value],
    [ph_att.value, ph_tot.value],
    [m_att.value, m_tot.value]
  ];

  for (let [a, t] of subjects) {
    if (!a || !t) continue;
    const newPct = a / (Number(t) + today) * 100;
    if (newPct < 75) {
      alert("❌ You MUST attend today!");
      return;
    }
  }
  alert("✅ You can skip today 😎");
}
