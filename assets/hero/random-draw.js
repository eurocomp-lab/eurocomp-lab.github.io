/* Homepage hero: the random draw.

   Forty eligible firms of different sizes sit in a pool. The draw pairs firms of
   similar size and sends one of each pair, at random, to the supported group and
   the other to the comparison group. Both groups therefore end up with a similar
   mix of firms, which is the property an RCT relies on. "Run the draw again"
   reshuffles who goes where; the mix stays alike.

   Two layouts: "wide" (pool on the left, groups on the right) and "tall" (pool on
   top, groups side by side below) for narrow screens.

   Replaces the static fallback image in .hero-draw. Without JavaScript the
   static image stays and the button stays hidden. */
(function () {
  "use strict";

  var figure = document.querySelector(".hero-draw");
  if (!figure) return;

  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      labels: [[4, 40, "Eligible applicants"], [312, 40, "Supported (20)", "t"],
               [312, 200, "Comparison group (20)"], [152, 172, "Random draw"]],
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
      labels: [[0, 18, "Eligible applicants"], [10, 292, "Supported (20)", "t"],
               [180, 292, "Comparison group (20)"], [182, 208, "Random draw"]],
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

  var svg = el("svg", {
    role: "img",
    "aria-label": "Forty eligible firms of different sizes are split by a random draw " +
      "into two groups of twenty, each with a similar mix of small, medium and large firms."
  });
  firms.forEach(function (f) {
    f.node = el("circle", { "class": "firm", cx: 0, cy: 0, r: f.r.toFixed(2) });
  });

  var layout = null;      // current layout key
  var groups = null;      // null while the firms sit in the pool

  function build(key) {
    var L = LAYOUTS[key];
    layout = key;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + L.W + " " + L.H);
    L.labels.forEach(function (t) {
      svg.appendChild(el("text", t[3] ? { x: t[0], y: t[1], "class": t[3] } : { x: t[0], y: t[1] }, t[2]));
    });
    L.paths.forEach(function (d) { svg.appendChild(el("path", { "class": "path", d: d })); });
    // Faint outlines mark the pool after the firms have moved out
    firms.forEach(function (f) {
      var p = L.pool(f);
      svg.appendChild(el("circle", { "class": "ghost", cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: f.r.toFixed(2) }));
    });
    firms.forEach(function (f) { svg.appendChild(f.node); });
  }

  function placeAll() {
    var L = LAYOUTS[layout];
    function move(f, p) {
      f.node.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px)";
    }
    if (!groups) {
      firms.forEach(function (f) { f.node.setAttribute("class", "firm"); move(f, L.pool(f)); });
      return;
    }
    ["t", "c"].forEach(function (g) {
      groups[g].forEach(function (f, i) { f.node.setAttribute("class", "firm " + g); move(f, L.group(g, i)); });
    });
  }

  // Pair firms of similar size; a coin flip sends one of each pair to each group
  function draw() {
    var bySize = firms.slice().sort(function (a, b) { return b.r - a.r; });
    groups = { t: [], c: [] };
    for (var i = 0; i < bySize.length; i += 2) {
      var first = Math.random() < 0.5;
      groups.t.push(first ? bySize[i] : bySize[i + 1]);
      groups.c.push(first ? bySize[i + 1] : bySize[i]);
    }
    groups.t.sort(function (a, b) { return b.r - a.r; });
    groups.c.sort(function (a, b) { return b.r - a.r; });
    placeAll();
  }

  function toPool() { groups = null; placeAll(); }

  function layoutFor(width) { return width < 460 ? "tall" : "wide"; }

  // Swap the static image for the live drawing
  var fallback = figure.querySelector("img");
  if (fallback) fallback.replaceWith(svg); else figure.insertBefore(svg, figure.firstChild);
  build(layoutFor(figure.clientWidth));

  // Switch layout without animating when the figure crosses the breakpoint
  if (window.ResizeObserver) {
    new ResizeObserver(function (entries) {
      var key = layoutFor(entries[0].contentRect.width);
      if (key === layout) return;
      svg.classList.add("no-anim");
      build(key);
      placeAll();
      requestAnimationFrame(function () { svg.classList.remove("no-anim"); });
    }).observe(figure);
  }

  var button = figure.querySelector(".draw-again");
  var status = figure.querySelector("[aria-live]");

  if (reduceMotion) {
    draw();
  } else {
    toPool();
    // let the pool paint once, then run the draw a moment after load
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { setTimeout(draw, 450); });
    });
  }

  if (button) {
    button.hidden = false;
    button.addEventListener("click", function () {
      if (reduceMotion) {
        draw();
      } else {
        button.disabled = true;
        toPool();
        setTimeout(function () {
          draw();
          setTimeout(function () { button.disabled = false; }, 800);
        }, 650);
      }
      if (status) {
        status.textContent = "New draw: twenty firms supported and twenty in the comparison " +
          "group, again with a similar mix of firm sizes.";
      }
    });
  }
})();
