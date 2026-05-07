const checkbox = document.getElementById("theme-checkbox");
const iconSun = document.getElementById("icon-sun");
const iconMoon = document.getElementById("icon-moon");
const slider = document.getElementById("step-slider");
const labels = document.querySelectorAll(".slider-labels span");
const sliderTrack = document.querySelector(".theme-switch .slider");


const sunColor = "#facc15";
const moonColor = "#3b82f6"; 
const sliderSun = "#facc15";
const sliderMoon = "#003dca";

const stepValues = [0, 100, 200, 300];

const currentTheme = localStorage.getItem("theme");
if (currentTheme === "dark") {
  checkbox.checked = true;
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  checkbox.checked = false;
  document.documentElement.removeAttribute("data-theme");
}

function updateThemeUI() {
  const isDark = checkbox.checked;
  const theme = isDark ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  sliderTrack.style.backgroundColor = isDark ? sliderMoon : sliderSun;

  const sunActive = "#facc15";
  const sunInactive = "#718096";
  const moonActive = "#3b82f6";
  const moonInactive = "#94a3b8";

  const sunPaths = iconSun.querySelectorAll("path");
  sunPaths.forEach((path) => {
    path.setAttribute("stroke", isDark ? sunInactive : sunActive);
  });


  const moonPaths = iconMoon.querySelectorAll("path");
  moonPaths.forEach((path) => {
    path.setAttribute("fill", isDark ? moonActive : moonInactive);
  });

  highlightLevel(slider.value, isDark ? moonColor : sunColor);
}

function highlightLevel(value, color) {
  // Find nearest step
  let nearestStep = stepValues.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  const index = stepValues.indexOf(nearestStep);

  labels.forEach((label, i) => {
    if (i === index) {
      label.classList.add("active");
      label.style.color = color;
    } else {
      label.classList.remove("active");
      label.style.color = "";
    }
  });
}

checkbox.addEventListener("change", updateThemeUI);


slider.addEventListener("input", () => {
  const color = checkbox.checked ? moonColor : sunColor;
  highlightLevel(slider.value, color);
});

slider.addEventListener("change", () => {
  let nearestStep = stepValues.reduce((prev, curr) =>
    Math.abs(curr - slider.value) < Math.abs(prev - slider.value) ? curr : prev
  );
  slider.value = nearestStep;
  const color = checkbox.checked ? moonColor : sunColor;
  highlightLevel(slider.value, color);
});

updateThemeUI();
highlightLevel(slider.value, checkbox.checked ? moonColor : sunColor);
