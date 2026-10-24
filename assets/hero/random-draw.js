/* Homepage hero: the random draw.

   Forty eligible firms of different sizes. The page opens on a finished draw:
   in the applicant pool on the left, each firm is marked by the group it was
   drawn into (yellow = supported, ring = comparison), and the two groups on the
   right show the same firms sorted by size, so their similar mix is easy to see.

   "Run the draw again" clears the marks, then draws the firms one by one in a
   random order: each firm lights up in the pool and a copy travels through the
   "Random draw" arrow to its group.
   Every draw picks different firms; the two groups still end up with a similar
   mix, because firms are paired by size and a coin flip splits each pair.

   Without JavaScript the static fallback image stays and the button stays hidden.
   With "reduce motion" set, a new draw appears at once, without movement. */
(function () {
  "use strict";

  var figure = document.querySelector(".hero-draw");
  if (!figure) return;

  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = !reduceMotion && typeof Element.prototype.animate === "function";

  var STAGGER = 34;   // ms between two firms being drawn
  var FLIGHT = 900;   // ms for one firm to travel to its group
  var CLEAR = 300;    // ms to clear the previous draw

  // Seeded generator, so the same forty firms appear on every visit
  function seeded(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = seeded(20231018);

  // Firm sizes as dot radii: 8 large, 14 medium, 18 small
  var firms = [];
  [[8, 9.5], [14, 7], [18, 5]].forEach(function (group) {
    for (var i = 0; i < group[0]; i++) {
      firms.push({ r: group[1] + (rand() - 0.5) * 1.2 });
    }
  });
  // Each firm gets a shuffled pool slot (so sizes are mixed) and a small jitter
  var order = firms.map(function (_, i) { return i; });
  for (var k = order.length - 1; k > 0; k--) {
    var j = Math.floor(rand() * (k + 1));
    var tmp = order[k]; order[k] = order[j]; order[j] = tmp;
  }
  firms.forEach(function (f, i) {
    f.slot = order[i];
    f.jx = rand() - 0.5;
    f.jy = rand() - 0.5;
  });

  var LAYOUTS = {
    wide: {
      W: 470, H: 340,
      pool: function (f) {
        return { x: 18 + (f.slot % 5) * 28 + f.jx * 7, y: 74 + Math.floor(f.slot / 5) * 33 + f.jy * 7 };
      },
      group: function (g, i) {
        return { x: 326 + (i % 5) * 29, y: (g === "t" ? 76 : 236) + Math.floor(i / 5) * 30 };
      },
      via: [{ x: 150, y: 184 }, { x: 245, y: 184 }],   // along the arrow: start, then fork
      labels: [[4, 40, "Eligible applicants"], [312, 40, "Supported (20)", "t"],
               [312, 200, "Comparison group (20)"], [152, 166, "Random draw"]],
      paths: ["M150 184 H245 C272 184 276 121 300 121", "M245 184 C272 184 276 281 300 281",
              "M294 116 L301 121 L294 126", "M294 276 L301 281 L294 286"]
    },
    tall: {
      W: 340, H: 420,
      pool: function (f) {
        return { x: 44 + (f.slot % 8) * 36 + f.jx * 6, y: 48 + Math.floor(f.slot / 8) * 30 + f.jy * 6 };
      },
      group: function (g, i) {
        return { x: (g === "t" ? 25 : 195) + (i % 5) * 30, y: 312 + Math.floor(i / 5) * 30 };
      },
      via: [{ x: 170, y: 184 }, { x: 170, y: 220 }],
      labels: [[0, 18, "Eligible applicants"], [10, 292, "Supported (20)", "t"],
               [180, 292, "Comparison group (20)"], [186, 208, "Random draw"]],
      paths: ["M170 184 V220 C170 250 85 244 85 268", "M170 220 C170 250 255 244 255 268",
              "M80 262 L85 269 L90 262", "M250 262 L255 269 L260 262"]
    }
  };

  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    for (var a in attrs) node.setAttribute(a, attrs[a]);
    if (text) node.textContent = text;
    return node;
  }
  function translate(p) {
    return "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px)";
  }

  var svg = el("svg", {
    role: "img",
    "aria-label": "Forty eligible firms of different sizes. A random draw marks twenty as " +
      "supported and twenty as the comparison group. Both groups end up with a similar mix " +
      "of small, medium and large firms."
  });
  firms.forEach(function (f) {
    f.dot = el("circle", { "class": "firm", r: f.r.toFixed(2) });                    // stays in the pool
    f.copy = el("circle", { "class": "firm", cx: 0, cy: 0, r: f.r.toFixed(2) });     // sits in its group
  });

  var layout = null;
  var timers = [];
  var running = false;

  function build(key) {
    var L = LAYOUTS[key];
    layout = key;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + L.W + " " + L.H);
    L.labels.forEach(function (t) {
      svg.appendChild(el("text", t[3] ? { x: t[0], y: t[1], "class": t[3] } : { x: t[0], y: t[1] }, t[2]));
    });
    L.paths.forEach(function (d) { svg.appendChild(el("path", { "class": "path", d: d })); });
    firms.forEach(function (f) {
      var p = L.pool(f);
      f.dot.setAttribute("cx", p.x.toFixed(1));
      f.dot.setAttribute("cy", p.y.toFixed(1));
      svg.appendChild(f.dot);
    });
    firms.forEach(function (f) { svg.appendChild(f.copy); });
  }

  // Pair firms of similar size; a coin flip sends one of each pair to each group.
  // Within each group, firms are ranked by size to give their place in the grid.
  function assign() {
    var bySize = firms.slice().sort(function (a, b) { return b.r - a.r; });
    var groups = { t: [], c: [] };
    for (var i = 0; i < bySize.length; i += 2) {
      var first = Math.random() < 0.5;
      groups.t.push(first ? bySize[i] : bySize[i + 1]);
      groups.c.push(first ? bySize[i + 1] : bySize[i]);
    }
    ["t", "c"].forEach(function (g) {
      groups[g].sort(function (a, b) { return b.r - a.r; });
      groups[g].forEach(function (f, rank) { f.group = g; f.rank = rank; });
    });
  }

  function stopAll() {
    timers.forEach(clearTimeout);
    timers = [];
    firms.forEach(function (f) {
      if (f.copy.getAnimations) f.copy.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }

  // The finished draw, without movement
  function showResult() {
    var L = LAYOUTS[layout];
    firms.forEach(function (f) {
      f.dot.setAttribute("class", "firm " + f.group);
      f.copy.setAttribute("class", "firm " + f.group);
      f.copy.style.transform = translate(L.group(f.group, f.rank));
      f.copy.style.opacity = "1";
    });
  }

  // Clear the previous draw: marks fade in the pool, the groups fade out
  function clear(next) {
    firms.forEach(function (f) {
      f.dot.setAttribute("class", "firm");
      f.copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLEAR, fill: "forwards" });
    });
    timers.push(setTimeout(next, CLEAR + 60));
  }

  // Draw the firms one by one, in a random order
  function drawOneByOne(done) {
    var L = LAYOUTS[layout];
    var sequence = firms.slice();
    for (var i = sequence.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = sequence[i]; sequence[i] = sequence[j]; sequence[j] = tmp;
    }
    sequence.forEach(function (f, n) {
      var delay = n * STAGGER;
      var from = translate(L.pool(f));
      var to = translate(L.group(f.group, f.rank));
      if (f.copy.getAnimations) f.copy.getAnimations().forEach(function (a) { a.cancel(); });
      f.copy.setAttribute("class", "firm " + f.group);
      f.copy.style.transform = to;          // resting place once the flight ends
      f.copy.style.opacity = "1";
      f.copy.animate([
        { transform: from, opacity: 0 },
        { transform: from, opacity: 1, offset: 0.08 },
        { transform: translate(L.via[0]), offset: 0.4 },
        { transform: translate(L.via[1]), offset: 0.6 },
        { transform: to, opacity: 1 }
      ], { duration: FLIGHT, delay: delay, easing: "cubic-bezier(.45, .05, .25, 1)", fill: "backwards" });
      timers.push(setTimeout(function () { f.dot.setAttribute("class", "firm " + f.group); }, delay));
    });
    timers.push(setTimeout(done, (sequence.length - 1) * STAGGER + FLIGHT));
  }

  function layoutFor(width) { return width < 460 ? "tall" : "wide"; }

  // Swap the static image for the live drawing, showing a finished draw
  var fallback = figure.querySelector("img");
  if (fallback) fallback.replaceWith(svg); else figure.insertBefore(svg, figure.firstChild);
  build(layoutFor(figure.clientWidth));
  assign();
  showResult();

  var button = figure.querySelector(".draw-again");
  var status = figure.querySelector("[aria-live]");

  function finish() {
    running = false;
    if (button) button.removeAttribute("aria-disabled");
  }

  // Switch layout when the figure crosses the breakpoint; a draw in progress jumps to its end
  if (window.ResizeObserver) {
    new ResizeObserver(function (entries) {
      var key = layoutFor(entries[0].contentRect.width);
      if (key === layout) return;
      stopAll();
      build(key);
      showResult();
      finish();
    }).observe(figure);
  }

  if (button) {
    button.hidden = false;
    button.addEventListener("click", function () {
      if (running) return;              // let the current draw finish
      assign();
      if (status) {
        status.textContent = "New draw: different firms picked, and both groups again have " +
          "a similar mix of firm sizes.";
      }
      if (!canAnimate) { showResult(); return; }
      running = true;
      button.setAttribute("aria-disabled", "true");
      stopAll();
      clear(function () { drawOneByOne(finish); });
    });
  }
})();
