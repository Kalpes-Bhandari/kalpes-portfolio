// ---------------------------------------------------------------
// Projects — add your projects here and they appear on the page.
// Example:
// {
//   title: "Snowflake cost tracker",
//   description: "Pipeline that pulls warehouse usage into a daily dashboard.",
//   tags: ["Snowflake", "Python", "ADF"],
//   link: "https://github.com/Kalpes-Bhandari/your-repo",
// },
// ---------------------------------------------------------------
const PROJECTS = [];

const root = document.documentElement;

// ---------- Theme toggle ----------
const toggle = document.getElementById("themeToggle");

function setTheme(theme, save) {
  root.setAttribute("data-theme", theme);
  toggle.setAttribute("aria-checked", String(theme === "dark"));
  if (save) {
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  if (window.redrawAttractor) window.redrawAttractor();
}

setTheme(root.getAttribute("data-theme"), false);
toggle.addEventListener("click", () => {
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
});

const accent = () => getComputedStyle(root).getPropertyValue("--accent").trim();

// ---------- Active tab while scrolling ----------
const tabs = [...document.querySelectorAll(".tabs a")];
const sections = tabs.map((a) => document.querySelector(a.getAttribute("href")));
const tabObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      tabs.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => s && tabObserver.observe(s));

// ---------- Projects ----------
const list = document.getElementById("projectList");
if (PROJECTS.length === 0) {
  list.innerHTML = `
    <div class="empty">
      <p class="mono">status: building…</p>
      <p>New projects are on the way. In the meantime, see what I'm working on at
      <a href="https://github.com/Kalpes-Bhandari" target="_blank" rel="noopener">github.com/Kalpes-Bhandari</a>.</p>
    </div>`;
} else {
  PROJECTS.forEach((p) => {
    const el = document.createElement(p.link ? "a" : "div");
    el.className = "project";
    if (p.link) { el.href = p.link; el.target = "_blank"; el.rel = "noopener"; }
    const h = document.createElement("h3"); h.textContent = p.title;
    const d = document.createElement("p"); d.textContent = p.description;
    const t = document.createElement("div"); t.className = "tags";
    (p.tags || []).forEach((tag) => { const s = document.createElement("span"); s.textContent = tag; t.appendChild(s); });
    el.append(h, d, t);
    list.appendChild(el);
  });
}

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Lorenz attractor (hero) ----------
(function lorenz() {
  const canvas = document.getElementById("attractor");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEPS = 9000;
  const pts = [];
  let x = 0.1, y = 0, z = 0;
  const s = 10, r = 28, b = 8 / 3, dt = 0.006;
  for (let i = 0; i < STEPS; i++) {
    const dx = s * (y - x), dy = x * (r - z) - y, dz = x * y - b * z;
    x += dx * dt; y += dy * dt; z += dz * dt;
    pts.push([x, z]);
  }

  let drawn = 0, raf = null;

  function size() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return rect;
  }

  function draw(upTo) {
    const rect = size();
    const sc = rect.width / 58;
    const cx = rect.width / 2, cy = rect.height * 0.95;
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = accent();
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let i = 0; i < upTo; i++) {
      const px = cx + pts[i][0] * sc, py = cy - pts[i][1] * sc;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    if (upTo > 0) {
      const [lx, lz] = pts[upTo - 1];
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent();
      ctx.beginPath();
      ctx.arc(cx + lx * sc, cy - lz * sc, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate() {
    drawn = Math.min(STEPS, drawn + 40);
    draw(drawn);
    if (drawn < STEPS) raf = requestAnimationFrame(animate);
  }

  window.redrawAttractor = () => draw(drawn);
  window.addEventListener("resize", () => draw(drawn));

  if (reduce) { drawn = STEPS; draw(drawn); } else { animate(); }
})();

// ---------- Journey map ----------
(function journeyMap() {
  if (!window.d3 || !window.topojson) return;

  const places = [
    { name: "Goldhap, Jhapa", sub: "NEPAL · born", coords: [87.73, 26.65], dx: 8, dy: 4, anchor: "start" },
    { name: "Des Moines", sub: "IOWA · 2009", coords: [-93.62, 41.59], dx: -8, dy: 14, anchor: "end" },
    { name: "Ames", sub: "IOWA STATE", coords: [-93.65, 42.03], dx: -8, dy: -12, anchor: "end" },
    { name: "Atlanta", sub: "GEORGIA TECH", coords: [-84.4, 33.78], dx: 8, dy: 14, anchor: "start" },
  ];
  const legs = [[0, 1], [1, 2], [2, 3]];

  const W = 960, H = 440;
  const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`);
  // Crop to the northern band where the story happens.
  const frame = { type: "MultiPoint", coordinates: [[-128, 8], [150, 8], [-128, 66], [150, 66], [10, 72]] };
  const projection = d3.geoNaturalEarth1().rotate([-8, 0]).fitExtent([[24, 24], [W - 24, H - 24]], frame);
  const path = d3.geoPath(projection);

  svg.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));
  const landG = svg.append("g");
  const routeG = svg.append("g");
  const dotG = svg.append("g");

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((world) => {
    landG.append("path")
      .attr("class", "land")
      .attr("d", path(topojson.feature(world, world.objects.countries)));

    // Flight-style arcs drawn in screen space, bowing upward.
    const routes = legs.map(([a, b]) => {
      const [x1, y1] = projection(places[a].coords);
      const [x2, y2] = projection(places[b].coords);
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const lift = Math.min(160, Math.max(28, dist * 0.32));
      const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - lift;
      return routeG.append("path").attr("class", "route").attr("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
    });

    const dots = places.map((p) => {
      const [px, py] = projection(p.coords);
      const g = dotG.append("g").attr("class", "place p" + places.indexOf(p)).attr("transform", `translate(${px},${py})`).style("opacity", 0);
      g.append("circle").attr("class", "pulse").attr("r", 4);
      g.append("circle").attr("class", "dot").attr("r", 4);
      g.append("text").attr("class", "label").attr("x", p.dx).attr("y", p.dy).attr("text-anchor", p.anchor).text(p.name);
      g.append("text").attr("class", "sub").attr("x", p.dx).attr("y", p.dy + 13).attr("text-anchor", p.anchor).text(p.sub);
      return g;
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function play() {
      routes.forEach((r) => {
        const len = r.node().getTotalLength();
        r.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", reduce ? 0 : len);
      });
      if (reduce) { dots.forEach((d) => d.style("opacity", 1)); return; }

      dots[0].transition().duration(400).style("opacity", 1);
      let delay = 500;
      legs.forEach(([, b], i) => {
        const dur = i === 0 ? 2200 : 900;
        routes[i].transition().delay(delay).duration(dur).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);
        dots[b].transition().delay(delay + dur - 100).duration(400).style("opacity", 1);
        delay += dur + 150;
      });

      // Gentle pulse on the current location.
      const pulse = dots[3].select(".pulse");
      (function loop() {
        pulse.attr("r", 4).style("opacity", 0.9)
          .transition().delay(delay).duration(1600).attr("r", 16).style("opacity", 0)
          .on("end", () => { delay = 0; loop(); });
      })();
    }

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { play(); obs.disconnect(); }
    }, { threshold: 0.35 });
    obs.observe(document.getElementById("map"));
  }).catch(() => {
    document.querySelector(".map-wrap").style.display = "none";
  });
})();
