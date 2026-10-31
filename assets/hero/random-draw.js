/* Homepage hero: the random draw, and selection on merit for comparison.

   Forty eligible firms of different sizes. The page opens on a finished draw:
   in the applicant pool on the left, each firm is marked by the group it was
   drawn into (yellow = supported, ring = comparison), and the two groups on the
   right show the same firms sorted by size, so their similar mix is easy to see.

   "Run the draw again" clears the marks, then draws the firms one by one in a
   random order: each firm lights up in the pool and a copy travels through the
   "Random draw" arrow to its group.
   Every draw picks different firms; the two groups still end up with a similar
   mix, because firms are paired by size and a coin flip splits each pair.

   A switch above the drawing, under the line "Compare two ways to choose who
   gets support", compares this with selection on merit (batch 37): the same
   firms are ranked, here by size, and the twenty largest are supported. They
   move one by one from largest to smallest and the other group is labelled
   "Not selected" rather than "Comparison group". A ranking picks the same firms
   every time, so "Run the draw again" shows only for the random draw.

   Under the drawing, one plain sentence says what each method does (groups that
   start out alike, or support for bigger firms; batches 38, 40 and 41), and two
   bars show the consequence
   (batch 39): each group's average result a year later in an illustrative case
   where the support makes no difference at all, so results depend only on firm
   size (larger firms do better anyway) plus a little noise. After a random draw
   the bars come out about equal; on merit the supported firms come out clearly
   ahead, a difference the support did not cause. Each group's mix of firm sizes
   is given to screen readers in the drawing's description.

   Without JavaScript the static fallback image and the random-draw verdict stay,
   and the switch, the bars and the button stay hidden. With "reduce motion" set, a new result appears at once,
   without movement. */
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
  [[8, 9.5, "large"], [14, 7, "medium"], [18, 5, "small"]].forEach(function (group) {
    for (var i = 0; i < group[0]; i++) {
      firms.push({ r: group[1] + (rand() - 0.5) * 1.2, size: group[2] });
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
  // Illustrative result a year later, with a support that has no effect: size plus noise
  var randY = seeded(20240601);
  var YMAX = 8;                       // full bar
  firms.forEach(function (f) { f.y = 2 + 1.2 * (f.r - 5) + (randY() - 0.5) * 1.6; });

  // What changes between the two ways of selecting
  var MODES = {
    random: {
      rule: "Random draw",
      other: "Comparison group (20)",
      otherShort: "comparison group",
      otherBar: "Comparison group",
      icon: "\u2713",
      verdict: "A random draw creates two groups that start out alike.",
      result: "If the support made no difference, both groups would have similar results a year later.",
      label: "Forty eligible firms of different sizes. A random draw marks twenty as supported and twenty " +
        "as the comparison group."
    },
    merit: {
      rule: "Selection on merit",
      other: "Not selected (20)",
      otherShort: "not selected",
      otherBar: "Not selected",
      icon: "\u2715",
      verdict: "Selecting on merit gives the support to bigger firms.",
      result: "If the support made no difference, the supported firms would still show better results a year " +
        "later, because they were bigger from the start.",
      label: "Forty eligible firms of different sizes. Selection on merit supports the twenty largest."
    }
  };
  var mode = "random";

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
      labels: { pool: [4, 40], t: [312, 40], c: [312, 200], rule: [152, 166] },
      ruleLines: { random: ["Random draw"], merit: ["Selection", "on merit"] },   // the second fits before the fork
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
      labels: { pool: [0, 18], t: [10, 292], c: [180, 292], rule: [186, 208] },
      ruleLines: { random: ["Random draw"], merit: ["Selection on merit"] },
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

  var svg = el("svg", { role: "img", "aria-label": MODES.random.label });
  firms.forEach(function (f) {
    f.dot = el("circle", { "class": "firm", r: f.r.toFixed(2) });                    // stays in the pool
    f.copy = el("circle", { "class": "firm", cx: 0, cy: 0, r: f.r.toFixed(2) });     // sits in its group
  });

  var layout = null;
  var labels = {};
  var timers = [];
  var running = false;

  // Each group's mix of large, medium and small firms, for its label and the description
  function mix(g) {
    var n = { large: 0, medium: 0, small: 0 };
    firms.forEach(function (f) { if (f.group === g) n[f.size] += 1; });
    return n;
  }
  function mixWords(n) { return n.large + " large, " + n.medium + " medium and " + n.small + " small"; }
  function setMix() {
    var t = mix("t"), c = mix("c");
    svg.setAttribute("aria-label", MODES[mode].label + " Supported: " + mixWords(t) + " firms; " +
      MODES[mode].otherShort + ": " + mixWords(c) + ".");
  }

  // Each group's average result a year later (no effect), as bar lengths
  var bars = { t: figure.querySelector(".draw-bar.t"), c: figure.querySelector(".draw-bar.c") };
  var otherBarLabel = figure.querySelector(".draw-other");
  var resultText = figure.querySelector(".draw-result-text");
  function average(g) {
    var sum = 0, n = 0;
    firms.forEach(function (f) { if (f.group === g) { sum += f.y; n += 1; } });
    return n ? sum / n : 0;
  }
  function setResult(show) {
    ["t", "c"].forEach(function (g) {
      if (!bars[g]) return;
      bars[g].style.width = show ? Math.min(100, average(g) / YMAX * 100).toFixed(1) + "%" : "0";
      bars[g].style.opacity = show ? "1" : "0";
    });
    if (otherBarLabel) otherBarLabel.textContent = MODES[mode].otherBar;
    if (resultText) resultText.textContent = MODES[mode].result;
  }

  // The labels that depend on the mode: the arrow and the second group
  function setLabels() {
    var L = LAYOUTS[layout];
    var lines = L.ruleLines[mode];
    var rule = labels.rule;
    while (rule.firstChild) rule.removeChild(rule.firstChild);
    lines.forEach(function (line, n) {
      rule.appendChild(el("tspan", {
        x: L.labels.rule[0],
        y: L.labels.rule[1] - (lines.length - 1 - n) * 15
      }, line));
    });
    labels.c.textContent = MODES[mode].other;
  }

  function build(key) {
    var L = LAYOUTS[key];
    layout = key;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + L.W + " " + L.H);
    labels.pool = el("text", { x: L.labels.pool[0], y: L.labels.pool[1] }, "Eligible applicants");
    labels.t = el("text", { x: L.labels.t[0], y: L.labels.t[1], "class": "t" }, "Supported (20)");
    labels.c = el("text", { x: L.labels.c[0], y: L.labels.c[1] });
    labels.rule = el("text", {});
    [labels.pool, labels.t, labels.c, labels.rule].forEach(function (t) { svg.appendChild(t); });
    setLabels();
    L.paths.forEach(function (d) { svg.appendChild(el("path", { "class": "path", d: d })); });
    firms.forEach(function (f) {
      var p = L.pool(f);
      f.dot.setAttribute("cx", p.x.toFixed(1));
      f.dot.setAttribute("cy", p.y.toFixed(1));
      svg.appendChild(f.dot);
    });
    firms.forEach(function (f) { svg.appendChild(f.copy); });
  }

  function bySize() {
    return firms.slice().sort(function (a, b) { return b.r - a.r; });
  }

  // Random draw: pair firms of similar size; a coin flip sends one of each pair to each group.
  // Selection on merit: the twenty largest are supported.
  // Within each group, firms are ranked by size to give their place in the grid.
  function assign() {
    var ranked = bySize();
    var groups = { t: [], c: [] };
    if (mode === "merit") {
      groups.t = ranked.slice(0, ranked.length / 2);
      groups.c = ranked.slice(ranked.length / 2);
    } else {
      for (var i = 0; i < ranked.length; i += 2) {
        var first = Math.random() < 0.5;
        groups.t.push(first ? ranked[i] : ranked[i + 1]);
        groups.c.push(first ? ranked[i + 1] : ranked[i]);
      }
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

  // The finished result, without movement
  function showResult() {
    var L = LAYOUTS[layout];
    setMix();
    setResult(true);
    firms.forEach(function (f) {
      f.dot.setAttribute("class", "firm " + f.group);
      f.copy.setAttribute("class", "firm " + f.group);
      f.copy.style.transform = translate(L.group(f.group, f.rank));
      f.copy.style.opacity = "1";
    });
  }

  // Clear the previous result: marks fade in the pool, the groups fade out
  function clear(next) {
    firms.forEach(function (f) {
      f.dot.setAttribute("class", "firm");
      f.copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLEAR, fill: "forwards" });
    });
    timers.push(setTimeout(next, CLEAR + 60));
  }

  // Move the firms one by one: in a random order for the draw, largest first for the ranking
  function drawOneByOne(done) {
    var L = LAYOUTS[layout];
    var sequence;
    if (mode === "merit") {
      sequence = bySize();
    } else {
      sequence = firms.slice();
      for (var i = sequence.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = sequence[i]; sequence[i] = sequence[j]; sequence[j] = tmp;
      }
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
  var why = figure.querySelector(".draw-why");
  var resultBlock = figure.querySelector(".draw-result");
  if (resultBlock) resultBlock.hidden = false;
  var intro = figure.querySelector(".draw-intro");
  var switcher = figure.querySelector(".draw-mode");
  var icon = figure.querySelector(".draw-icon");
  var verdict = figure.querySelector(".draw-verdict-text");

  function finish() {
    running = false;
    if (button) button.removeAttribute("aria-disabled");
    setMix();
    setResult(true);
  }

  // Run a new result: animated where possible, at once otherwise
  function play(message) {
    assign();
    if (status) status.textContent = message;
    if (!canAnimate) { showResult(); return; }
    stopAll();
    setResult(false);                   // the results appear once the groups are complete
    running = true;
    if (button) button.setAttribute("aria-disabled", "true");
    clear(function () { drawOneByOne(finish); });
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
      play("New draw: different firms picked, and again two groups that start out alike.");
    });
  }

  if (switcher) {
    var toggles = switcher.querySelectorAll("button[data-mode]");
    switcher.hidden = false;
    if (intro) intro.hidden = false;
    Array.prototype.forEach.call(toggles, function (t) {
      t.addEventListener("click", function () {
        var next = t.getAttribute("data-mode");
        if (next === mode || !MODES[next]) return;
        mode = next;
        Array.prototype.forEach.call(toggles, function (o) {
          o.setAttribute("aria-pressed", o === t ? "true" : "false");
        });
        setLabels();
        figure.setAttribute("data-mode", mode);
        if (icon) icon.textContent = MODES[mode].icon;
        if (verdict) verdict.textContent = MODES[mode].verdict;
        if (button) button.hidden = mode !== "random";
        if (why) why.hidden = mode !== "merit";
        finish();                         // a switch interrupts a draw in progress
        play(MODES[mode].verdict + " " + MODES[mode].result);
      });
    });
  }
})();
