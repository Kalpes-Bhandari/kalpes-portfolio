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

// ---------------------------------------------------------------
// Contact form — messages are delivered by Web3Forms (free).
// Get a key at https://web3forms.com by entering the email you want
// messages sent to, then paste it here. The key is safe to publish:
// it can only send mail to that one address.
// ---------------------------------------------------------------
const WEB3FORMS_KEY = "";

const root = document.documentElement;

// ---------- Theme toggle ----------
const toggle = document.getElementById("themeToggle");

function setTheme(theme, save) {
  root.setAttribute("data-theme", theme);
  toggle.setAttribute("aria-checked", String(theme === "dark"));
  if (save) {
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  if (window.redrawHero) window.redrawHero();
}

setTheme(root.getAttribute("data-theme"), false);
toggle.addEventListener("click", () => {
  setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
});

const accent = () => getComputedStyle(root).getPropertyValue("--accent").trim();

// ---------- Professional / Personal views ----------
// Each view is its own area: only one is shown, so you can't scroll from one into the other.
const viewEls = [...document.querySelectorAll(".view")];
const viewLinks = [...document.querySelectorAll("[data-view-link]")];

function viewFor(id) {
  if (!id) return null;
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.classList.contains("view")) return el.dataset.view;
  const parent = el.closest(".view");
  return parent ? parent.dataset.view : null;
}

function showView(view) {
  document.body.dataset.view = view;
  viewLinks.forEach((a) => a.setAttribute("aria-selected", String(a.dataset.viewLink === view)));
}

function route(scroll) {
  const id = location.hash.slice(1);
  const view = viewFor(id);
  showView(view || "professional");
  if (!scroll || !view) return;
  const target = document.getElementById(id);
  // Wait a frame so the newly shown view has layout before scrolling to it.
  requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  if (id === "top") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  if (!viewFor(id)) return;
  e.preventDefault();
  history.pushState(null, "", "#" + id);
  route(true);
});
window.addEventListener("popstate", () => route(true));
route(location.hash.length > 1);

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

// ---------- Contact form ----------
(function contactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const button = form.querySelector("button");

  function show(msg, kind) {
    status.textContent = msg;
    status.className = "form-status mono " + (kind || "");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return;
    if (!data.name.trim() || !data.message.trim() || !form.email.checkValidity() || !data.email.trim()) {
      show("Please fill in your name, a valid email, and a message.", "err");
      return;
    }
    if (!WEB3FORMS_KEY) {
      show("The form isn't connected yet — please reach out on LinkedIn.", "err");
      return;
    }

    button.disabled = true;
    show("sending…");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio message from ${data.name}`,
          from_name: "Portfolio contact form",
          name: data.name,
          email: data.email,
          replyto: data.email,
          message: data.message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || res.statusText);
      form.reset();
      show("Message sent — thanks! I'll get back to you soon.", "ok");
    } catch (err) {
      show("Something went wrong sending that. Please try again or reach out on LinkedIn.", "err");
    } finally {
      button.disabled = false;
    }
  });
})();

// ---------- Atom (hero) ----------
// A 3D nucleus of protons and neutrons with electrons on tilted orbits.
(function atom() {
  const canvas = document.getElementById("atom");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // Nucleons spread on a few nested shells (Fibonacci sphere), alternating protons and neutrons.
  const nucleons = [];
  [[1, 0], [6, 0.55], [14, 1]].forEach(([n, r]) => {
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n;
      const ring = Math.sqrt(1 - y * y), a = i * 2.39996;
      nucleons.push({ p: [Math.cos(a) * ring * r, y * r, Math.sin(a) * ring * r], proton: nucleons.length % 2 === 0 });
    }
  });

  // Three orbits, each tilted differently; electrons spaced around them.
  const orbits = [
    { tiltX: 1.15, tiltZ: 0.0, speed: 0.9, electrons: 2 },
    { tiltX: 1.15, tiltZ: 2.09, speed: 0.75, electrons: 2 },
    { tiltX: 1.15, tiltZ: 4.19, speed: 1.05, electrons: 2 },
  ];

  const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
  const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
  const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];

  let W = 0, H = 0;
  function size() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(p, R) {
    const f = 4; // camera distance in orbit radii; mild perspective
    const s = f / (f + p[2]);
    return [W / 2 + p[0] * R * s, H / 2 + p[1] * R * s, s];
  }

  function orbitPoint(o, t, spin) {
    let p = [Math.cos(t), Math.sin(t), 0];
    p = rotX(p, o.tiltX);
    p = rotZ(p, o.tiltZ);
    return rotY(p, spin);
  }

  function draw(time) {
    const accent = css("--accent"), muted = css("--muted"), bg = css("--bg");
    const R = Math.min(W, H) * 0.42;
    const spin = time * 0.00012;
    ctx.clearRect(0, 0, W, H);

    // Orbit paths, split into back (behind nucleus) and front segments.
    const segs = { back: [], front: [] };
    orbits.forEach((o) => {
      const N = 140;
      for (let i = 0; i < N; i++) {
        const a = orbitPoint(o, (i / N) * Math.PI * 2, spin), b = orbitPoint(o, ((i + 1) / N) * Math.PI * 2, spin);
        ((a[2] + b[2]) / 2 > 0 ? segs.back : segs.front).push([project(a, R), project(b, R)]);
      }
    });
    function strokeSegs(list, alpha) {
      ctx.strokeStyle = accent; ctx.globalAlpha = alpha; ctx.lineWidth = 1.1;
      ctx.beginPath();
      list.forEach(([a, b]) => { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
      ctx.stroke();
    }

    // Electrons, sorted with the nucleus by depth.
    const electrons = [];
    orbits.forEach((o, oi) => {
      for (let e = 0; e < o.electrons; e++) {
        const t = time * 0.001 * o.speed + (e / o.electrons) * Math.PI * 2 + oi;
        electrons.push(orbitPoint(o, t, spin));
      }
    });
    function drawElectron(p) {
      const [x, y, s] = project(p, R);
      ctx.globalAlpha = 1;
      ctx.shadowColor = accent; ctx.shadowBlur = 14;
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(x, y, 3.6 * s, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Faint probability-cloud halo.
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R * 1.1);
    halo.addColorStop(0, accent + "22"); halo.addColorStop(1, accent + "00");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    strokeSegs(segs.back, 0.22);
    electrons.filter((p) => p[2] > 0).forEach(drawElectron);

    // Nucleus: shaded spheres, back to front, gently wobbling.
    const nr = R * 0.18, ballR = R * 0.072;
    const nspin = time * 0.0004;
    nucleons
      .map((n, i) => {
        const wob = reduce ? 0 : Math.sin(time * 0.003 + i) * 0.03;
        let p = rotY(rotX(n.p, nspin * 0.7), nspin);
        p = [p[0] * (1 + wob), p[1] * (1 + wob), p[2]];
        return { p, proton: n.proton };
      })
      .sort((a, b) => b.p[2] - a.p[2])
      .forEach(({ p, proton }) => {
        const x = W / 2 + p[0] * nr, y = H / 2 + p[1] * nr, r = ballR * (1 - p[2] * 0.08);
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        const base = proton ? accent : muted;
        g.addColorStop(0, "#ffffff"); g.addColorStop(0.25, base); g.addColorStop(1, base);
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = bg; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
        ctx.stroke();
      });

    strokeSegs(segs.front, 0.55);
    electrons.filter((p) => p[2] <= 0).forEach(drawElectron);
    ctx.globalAlpha = 1;
  }

  let running = false, raf = null;
  function frame(t) { draw(t); if (running) raf = requestAnimationFrame(frame); }
  function start() { if (running || reduce) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  size();
  draw(2000);
  window.redrawHero = () => { if (!running) draw(2000); };
  window.addEventListener("resize", () => { size(); if (!running) draw(2000); });
  // Only animate while the hero is on screen.
  new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop())).observe(canvas);
})();

// ---------- Journey map ----------
(function journeyMap() {
  if (!window.d3 || !window.topojson) return;

  const places = [
    { name: "Goldhap, Jhapa", sub: "NEPAL · born", coords: [87.73, 26.65], dx: 8, dy: 4, anchor: "start" },
    { name: "Des Moines", sub: "IOWA · 2009", coords: [-93.62, 41.59], dx: -8, dy: 14, anchor: "end" },
    { name: "Ames", sub: "IOWA STATE", coords: [-93.65, 42.03], dx: -8, dy: -12, anchor: "end" },
    { name: "Harrisburg", sub: "PA · home now", coords: [-76.88, 40.27], dx: 9, dy: -8, anchor: "start" },
    { name: "Atlanta", sub: "GEORGIA TECH · online", coords: [-84.4, 33.78], dx: 8, dy: 16, anchor: "start" },
  ];
  // The last leg is the online link to Georgia Tech, drawn dashed.
  const legs = [[0, 1], [1, 2], [2, 3], [3, 4]];
  const HOME = 3, ONLINE_LEG = 3;

  const W = 960, H = 440;
  const svg = d3.select("#map").attr("viewBox", `0 0 ${W} ${H}`);
  // Crop to the northern band where the story happens.
  const frame = { type: "MultiPoint", coordinates: [[-128, 8], [150, 8], [-128, 66], [150, 66], [10, 72]] };
  const projection = d3.geoNaturalEarth1().rotate([-8, 0]).fitExtent([[24, 24], [W - 24, H - 24]], frame);
  const path = d3.geoPath(projection);

  // Everything that zooms lives in one group.
  const zoomG = svg.append("g");
  zoomG.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));
  const landG = zoomG.append("g");
  const statesG = zoomG.append("g");
  const routeG = zoomG.append("g");
  const dotG = zoomG.append("g");

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
    routes[ONLINE_LEG].classed("online", true);

    const dots = places.map((p) => {
      const [px, py] = projection(p.coords);
      const g = dotG.append("g").attr("class", "place p" + places.indexOf(p)).attr("transform", `translate(${px},${py})`).style("opacity", 0);
      g.datum([px, py]);
      g.append("circle").attr("class", "pulse").attr("r", 4);
      g.append("circle").attr("class", "dot").attr("r", 4);
      g.append("text").attr("class", "label").attr("x", p.dx).attr("y", p.dy).attr("text-anchor", p.anchor).text(p.name);
      g.append("text").attr("class", "sub").attr("x", p.dx).attr("y", p.dy + 13).attr("text-anchor", p.anchor).text(p.sub);
      return g;
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function play() {
      routes.forEach((r, i) => {
        if (i === ONLINE_LEG) { r.style("opacity", reduce ? 1 : 0); return; }
        const len = r.node().getTotalLength();
        if (reduce) return;
        r.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len);
      });
      if (reduce) { dots.forEach((d) => d.style("opacity", 1)); return; }

      dots[0].transition().duration(400).style("opacity", 1);
      let delay = 500;
      legs.forEach(([, b], i) => {
        const dur = i === 0 ? 2200 : 900;
        const tr = routes[i].transition().delay(delay).duration(dur).ease(d3.easeCubicInOut);
        // Drop the draw-on dash once done so the line stays solid when zoomed.
        i === ONLINE_LEG ? tr.style("opacity", 1)
          : tr.attr("stroke-dashoffset", 0).on("end", () => routes[i].attr("stroke-dasharray", null).attr("stroke-dashoffset", null));
        dots[b].transition().delay(delay + dur - 100).duration(400).style("opacity", 1);
        delay += dur + 150;
      });

      // Gentle pulse on the current location.
      const pulse = dots[HOME].select(".pulse");
      (function loop() {
        pulse.attr("r", 4).style("opacity", 0.9)
          .transition().delay(delay).duration(1600).attr("r", 16).style("opacity", 0)
          .on("end", () => { delay = 0; loop(); });
      })();
    }

    // ---------- Zoom & pan ----------
    const wrap = document.querySelector(".map-wrap");
    const hint = wrap.querySelector(".map-hint");
    let detail = null;

    // Swap in sharper borders plus US states the first time someone zooms in.
    function loadDetail() {
      detail = Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json"),
      ]).then(([world50, us]) => {
        landG.select(".land").attr("d", path(topojson.feature(world50, world50.objects.countries)));
        statesG.append("path").attr("class", "states")
          .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
      }).catch(() => {});
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 16])
      .translateExtent([[0, 0], [W, H]])
      .filter((event) => {
        // Plain scrolling keeps scrolling the page; Ctrl/⌘ + scroll (or a trackpad pinch) zooms.
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        // On touch, one finger scrolls the page until the map is zoomed in.
        if (event.type.startsWith("touch")) return event.touches.length > 1 || d3.zoomTransform(svg.node()).k > 1;
        return !event.button;
      })
      .on("zoom", ({ transform: t }) => {
        zoomG.attr("transform", t);
        // Keep dots and labels the same size on screen.
        dots.forEach((d) => { const [px, py] = d.datum(); d.attr("transform", `translate(${px},${py}) scale(${1 / t.k})`); });
        svg.style("touch-action", t.k > 1 ? "none" : "pan-y");
        wrap.classList.toggle("zoomed", t.k > 1.01);
        if (t.k >= 2 && !detail) loadDetail();
      });

    svg.call(zoom).on("dblclick.zoom", null);
    svg.style("touch-action", "pan-y");

    svg.node().addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.metaKey) return;
      hint.classList.remove("flash"); void hint.offsetWidth; hint.classList.add("flash");
    }, { passive: true });

    wrap.querySelector("[data-zoom=in]").addEventListener("click", () => svg.transition().duration(350).call(zoom.scaleBy, 1.8));
    wrap.querySelector("[data-zoom=out]").addEventListener("click", () => svg.transition().duration(350).call(zoom.scaleBy, 1 / 1.8));
    wrap.querySelector("[data-zoom=reset]").addEventListener("click", () => svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity));
    wrap.querySelector("[data-zoom=us]").addEventListener("click", () => {
      // Frame the US stops: Iowa, Pennsylvania, Georgia.
      // Frame the US legs, arcs included, with room for labels.
      const boxes = [1, 2, 3].map((i) => routes[i].node().getBBox());
      const x0 = d3.min(boxes, (b) => b.x) - 30, x1 = d3.max(boxes, (b) => b.x + b.width) + 30;
      const y0 = d3.min(boxes, (b) => b.y) - 10, y1 = d3.max(boxes, (b) => b.y + b.height) + 25;
      const k = Math.min(16, 0.85 / Math.max((x1 - x0) / W, (y1 - y0) / H));
      const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
      svg.transition().duration(750).call(zoom.transform, t);
    });

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { play(); obs.disconnect(); }
    }, { threshold: 0.35 });
    obs.observe(document.getElementById("map"));
  }).catch(() => {
    document.querySelector(".map-wrap").style.display = "none";
  });
})();
