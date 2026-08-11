/* UDP — Unified Data Pipeline
   Vanilla JS interactions: navigation, pipeline inspector,
   scroll reveals, tilt cards and the animated node network. */

const nav = document.getElementById("navLinks");
const menuToggle = document.getElementById("menuToggle");

menuToggle?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll("#navLinks a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

/* ------------------------------------------------------------
   Pipeline inspector
   The text below is based on the supplied UDP notebooks and
   architecture: S3 -> Lakeflow Jobs -> Bronze -> Silver ->
   Gold -> Dashboards / Genie.
------------------------------------------------------------ */
const stages = {
  source: {
    index: "01 / 06",
    title: "S3 Raw Data",
    text: "Raw source files land in S3. The orders flow uses landing and processed paths; after ingestion, consumed files can be moved to the processed location. Customers, products and gross_price are also read from S3 CSV sources.",
    tags: ["S3", "CSV", "Landing", "Processed"]
  },
  lakeflow: {
    index: "02 / 06",
    title: "Lakeflow Jobs",
    text: "The orchestration layer coordinates the notebook-based processing flow. The project is organized around setup, dimension processing and fact processing so the data path can be executed as a repeatable workflow.",
    tags: ["Lakeflow Jobs", "Databricks", "Notebooks", "Workflow"]
  },
  bronze: {
    index: "03 / 06",
    title: "Bronze — Raw Delta",
    text: "Source data is ingested with Spark and written as Delta tables. Metadata such as read_timestamp, file_name and file_size is retained. Delta Change Data Feed is enabled on the relevant tables.",
    tags: ["PySpark", "Delta", "CDF", "Metadata"]
  },
  silver: {
    index: "04 / 06",
    title: "Silver — Trusted Data",
    text: "Silver is where the project handles dirty source data: duplicates, whitespace, casing, city typos, invalid IDs, inconsistent date formats, invalid prices and product enrichment are addressed before downstream analytics.",
    tags: ["Data Quality", "PySpark", "Standardization", "Joins"]
  },
  gold: {
    index: "05 / 06",
    title: "Gold — Analytics",
    text: "Gold contains business-ready data. Orders are converted from daily grain to monthly grain and combined with product and customer attributes. The project also creates a monthly date dimension and prepares child Gold data for parent-company integration.",
    tags: ["Fact", "Dimensions", "Monthly Grain", "Delta"]
  },
  serve: {
    index: "06 / 06",
    title: "Serving — Dashboards + Genie",
    text: "The final Gold analytics layer is the consumption boundary shown in the supplied architecture: dashboards and Genie sit above the parent-company Gold analytics table, turning governed data into usable analytics.",
    tags: ["Dashboards", "Genie", "Gold Analytics", "Unity Catalog"]
  }
};

const detailIndex = document.getElementById("detailIndex");
const detailTitle = document.getElementById("detailTitle");
const detailText = document.getElementById("detailText");
const detailTags = document.getElementById("detailTags");

function updateStage(key) {
  const data = stages[key];
  if (!data) return;
  detailIndex.textContent = data.index;
  detailTitle.textContent = data.title;
  detailText.textContent = data.text;
  detailTags.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join("");
}

document.querySelectorAll(".node").forEach(node => {
  node.addEventListener("click", () => {
    document.querySelectorAll(".node").forEach(n => n.classList.remove("active"));
    node.classList.add("active");
    updateStage(node.dataset.stage);
  });
});

/* Layer chips highlight the architecture layer being discussed. */
document.querySelectorAll(".layer-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".layer-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const target = document.querySelector(`[data-stage="${chip.dataset.layer}"]`);
    if (target) target.click();
  });
});

/* Scroll reveal */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

/* Active navigation */
const navAnchors = [...document.querySelectorAll("#navLinks a")];
const sections = [...document.querySelectorAll("main section[id]")];

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navAnchors.forEach(a => a.classList.toggle(
      "active",
      a.getAttribute("href") === `#${entry.target.id}`
    ));
  });
}, { rootMargin: "-45% 0px -45% 0px" });

sections.forEach(section => sectionObserver.observe(section));

/* Navbar intensity on scroll */
window.addEventListener("scroll", () => {
  document.getElementById("navbar").style.background =
    window.scrollY > 30 ? "rgba(8,8,8,.92)" : "rgba(8,8,8,.76)";
}, { passive: true });

/* ------------------------------------------------------------
   Animated particle / node background
------------------------------------------------------------ */
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
let raf;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = innerWidth < 700 ? 28 : 58;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .18,
    vy: (Math.random() - .5) * .18,
    r: Math.random() * 1.3 + .35
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
    if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
  }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy);

      if (d < 135) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(255,91,69,${(1 - d / 135) * .11})`;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,125,105,.5)";
    ctx.fill();
  }

  raf = requestAnimationFrame(drawNetwork);
}

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  resizeCanvas();
  drawNetwork();
  addEventListener("resize", resizeCanvas);
} else {
  canvas.style.display = "none";
}
