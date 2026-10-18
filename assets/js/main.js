// Runs the board: landing, questions, loading lines, verdict, then the wipe
// and the Today's Specials reveal. Every word comes from _data/pathway.yml,
// which the page carries as JSON. The hand-drawn pieces are <template>s
// from _includes/art.html, cloned here.
(() => {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stage = document.getElementById("stage");
  const board = document.getElementById("board");
  const doodleLayer = document.getElementById("doodles");
  const announcer = document.getElementById("announce");
  const source = document.getElementById("pathway");

  // ---- Helpers --------------------------------------------------------------

  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Copy stays plain text in the YAML; colour is added here. "wine" is pink
  // wherever it appears and a leading "Great!" is blue.
  // The heading face draws a straight apostrophe as a faint speck, so the
  // board headings show a curly one instead.
  const curly = (text) => escapeHtml(String(text).replace(/'/g, "’"));

  const colourWords = (text) =>
    escapeHtml(text)
      .replace(/\bwine\b/gi, '<span class="wine-word">$&</span>')
      .replace(/^Great!/, '<span class="cheer">Great!</span>');

  const artNames = (prefix) =>
    [...document.querySelectorAll("template[data-art]")]
      .map((t) => t.dataset.art)
      .filter((name) => name.startsWith(prefix));

  // A fresh copy of one piece of art as an <svg>, decorative and unfocusable.
  const art = (name, className) => {
    const template = document.querySelector(`template[data-art="${name}"]`);
    const svg = template.content.querySelector("svg").cloneNode(true);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (className) svg.setAttribute("class", className);
    return svg;
  };

  const strokes = (svg) => svg.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect");

  // Art that stretches to fit a box while keeping its lines the same weight.
  const stretchy = (svg) => {
    svg.setAttribute("preserveAspectRatio", "none");
    strokes(svg).forEach((el) => el.setAttribute("vector-effect", "non-scaling-stroke"));
    return svg;
  };

  const traceable = (svg) => {
    strokes(svg).forEach((el) => el.setAttribute("pathLength", "1"));
    return svg;
  };

  const say = (text) => {
    announcer.textContent = "";
    window.setTimeout(() => { announcer.textContent = text; }, 50);
  };

  const focusHeading = () => {
    const h1 = stage.querySelector("h1");
    if (h1) h1.focus({ preventScroll: false });
  };

  // ---- Hand-circled answers ------------------------------------------------

  // No two answers on a screen share both a loop and a scribble.
  const circleAnswers = () => {
    const answers = [...stage.querySelectorAll(".answer")];
    const loops = artNames("loop-");
    const scribbles = artNames("scribble-");
    const pairs = shuffle(loops.flatMap((l) => scribbles.map((s) => [l, s])));
    answers.forEach((answer, i) => {
      const [loop, scribble] = pairs[i % pairs.length];
      const label = document.createElement("span");
      label.className = "answer-label";
      label.append(...answer.childNodes);
      const loopSvg = stretchy(art(loop, "loop"));
      if (Math.random() < 0.5) loopSvg.classList.add("flip");
      answer.append(traceable(stretchy(art(scribble, "scribble"))), label, loopSvg);
    });
  };

  // ---- Doodles round the edges ------------------------------------------------

  // Corners first; "edge" spots are hidden on narrow screens by the stylesheet.
  const SPOTS = [
    { left: "4%", top: "3%" },
    { right: "4%", top: "3%" },
    { left: "4%", bottom: "3%" },
    { right: "4%", bottom: "3%" },
    { left: "2%", top: "44%", edge: true },
    { right: "2%", top: "44%", edge: true },
  ];

  const scatterDoodles = (count, spots = SPOTS) => {
    doodleLayer.replaceChildren();
    const names = shuffle(artNames("doodle-"));
    shuffle(spots).slice(0, count).forEach((spot, i) => {
      const svg = art(names[i % names.length], "doodle" + (spot.edge ? " edge" : ""));
      ["left", "right", "top", "bottom"].forEach((side) => { if (spot[side]) svg.style[side] = spot[side]; });
      svg.style.transform = `rotate(${Math.round(Math.random() * 30 - 15)}deg)`;
      doodleLayer.append(svg);
    });
  };

  // ---- The flow ---------------------------------------------------------------

  if (!source) {
    // The 404 page: no flow, just its one circled link.
    circleAnswers();
    return;
  }

  const data = JSON.parse(source.textContent);
  const nodes = data.nodes;
  let route = [];

  let lineBag = [];
  let lastLine = null;
  const nextLoadingLine = () => {
    if (lineBag.length === 0) {
      lineBag = shuffle(data.loading_lines);
      // A fresh bag never opens with the line the last one closed on.
      if (lineBag.length > 1 && lineBag[lineBag.length - 1] === lastLine) {
        [lineBag[0], lineBag[lineBag.length - 1]] = [lineBag[lineBag.length - 1], lineBag[0]];
      }
    }
    lastLine = lineBag.pop();
    return lastLine;
  };

  const underline = () => {
    const span = document.createElement("span");
    span.className = "heading-underline";
    span.append(art("underline"));
    return span;
  };

  const startButton = () => {
    stage.querySelector(".answer").addEventListener("click", () => {
      route = [];
      ask(data.start);
    });
  };

  const landing = () => {
    board.classList.remove("wiped");
    stage.innerHTML = `<h1 class="heading" tabindex="-1">${curly(data.landing.heading)}</h1>
      <div class="answers"><button class="answer" type="button">${escapeHtml(data.landing.button)}</button></div>`;
    stage.querySelector("h1").append(underline());
    circleAnswers();
    startButton();
    scatterDoodles(3);
    focusHeading();
  };

  const goTo = (id) => (nodes[id].type === "verdict" ? verdict(id) : ask(id));

  const ask = (id) => {
    const node = nodes[id];
    const many = node.options.length > 2 ? " many" : "";
    stage.innerHTML = `<h1 class="question" tabindex="-1">${colourWords(node.text)}</h1>
      <div class="answers${many}">${node.options
        .map((opt, i) => `<button class="answer" type="button" data-option="${i}">${escapeHtml(opt.label)}</button>`)
        .join("")}</div>`;
    circleAnswers();
    stage.querySelectorAll(".answer").forEach((button) => {
      button.addEventListener("click", () => {
        const i = Number(button.dataset.option);
        route.push({ id, option: i, answer: node.options[i].label });
        loading(() => goTo(node.options[i].next));
      });
    });
    scatterDoodles(2);
    focusHeading();
  };

  const loading = (then) => {
    const line = nextLoadingLine();
    const wait = reduceMotion.matches ? 1000 : 1400 + Math.random() * 800;
    stage.innerHTML = `<h1 class="loading-line">${escapeHtml(line)}</h1>`;
    const glass = art("doodle-glass", "loading-glass");
    glass.style.setProperty("--fill-time", `${wait}ms`);
    stage.prepend(glass);
    scatterDoodles(2);
    say(line);
    window.setTimeout(then, wait);
  };

  const verdict = (id) => {
    route.push({ id });
    stage.innerHTML = `<h1 class="verdict" tabindex="-1">${colourWords(nodes[id].text)}</h1>
      <div class="answers"><button class="answer" type="button">${escapeHtml(data.reveal.button)}</button></div>`;
    circleAnswers();
    stage.querySelector(".answer").addEventListener("click", reveal);
    scatterDoodles(6);
    focusHeading();
  };

  // ---- The reveal ---------------------------------------------------------------

  const reveal = () => {
    if (reduceMotion.matches) return specials();
    const wipe = document.createElement("div");
    wipe.className = "wipe";
    wipe.setAttribute("aria-hidden", "true");
    wipe.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <path class="draw" pathLength="1" d="M-30 40 L 130 -12"/>
      <path class="draw" pathLength="1" style="--d: var(--draw-time)" d="M130 70 L -30 122"/></svg>`;
    board.append(wipe);
    const swipes = wipe.querySelectorAll("path");
    swipes[swipes.length - 1].addEventListener("animationend", () => {
      specials();
      wipe.classList.add("done");
      wipe.addEventListener("transitionend", () => wipe.remove(), { once: true });
    });
  };

  const specials = () => {
    board.classList.add("wiped");
    const r = data.reveal;
    const said = route.filter((step) => "answer" in step).map((step) => step.answer);
    stage.innerHTML = `<h1 class="heading fade" tabindex="-1" aria-label="${escapeHtml(r.heading)}">${curly(r.heading)}</h1>
      <div class="chart"></div>
      <p class="visually-hidden">${escapeHtml([r.route_intro + " " + said.join(" → "), r.final_node].join(" → "))}</p>
      <div class="answers"><button class="answer fade" type="button">${escapeHtml(r.restart)}</button></div>`;
    const heading = stage.querySelector("h1");
    const line = underline();
    traceable(line.querySelector("svg")).querySelectorAll("path").forEach((p) => {
      p.classList.add("draw");
      p.style.setProperty("--d", "0.3s");
    });
    heading.append(line);
    const finished = drawChart(stage.querySelector(".chart"), 0.8);
    stage.querySelector(".answer").style.setProperty("--d", `${finished + 0.3}s`);
    circleAnswers();
    stage.querySelector(".answer").addEventListener("click", landing);
    scatterDoodles(2, SPOTS.slice(0, 2));
    focusHeading();
  };

  // Board geometry: one layout column and row, in chart units.
  const COL = 118;
  const ROW = 118;
  const STEP = 0.22; // seconds between one node drawing and the next
  const WRAP = 10; // characters per label line, roughly

  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(SVG, name);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.append(node);
    return node;
  };

  const wrapLabel = (text) => {
    const lines = [];
    text.split(/\s+/).forEach((word) => {
      const last = lines[lines.length - 1];
      if (last && (last + " " + word).length <= WRAP) lines[lines.length - 1] = last + " " + word;
      else lines.push(word);
    });
    return lines;
  };

  const delay = (node, seconds) => {
    node.style.setProperty("--d", `${seconds.toFixed(2)}s`);
    return node;
  };

  // A label centred on (x, y), returned with the box it takes up.
  const label = (group, text, x, y, className, at) => {
    const lines = wrapLabel(text);
    const t = el("text", { class: className, "text-anchor": "middle", x, y }, group);
    lines.forEach((line, i) => {
      el("tspan", { x, dy: i === 0 ? `${0.35 - (lines.length - 1) * 0.55}em` : "1.1em" }, t).textContent = line;
    });
    delay(t, at).classList.add("fade");
    return t.getBBox();
  };

  // Stretches one piece of art over a box and traces it in at a given time.
  const sketch = (group, name, box, className, at) => {
    const svg = traceable(stretchy(art(name)));
    ["x", "y", "width", "height"].forEach((k) => svg.setAttribute(k, box[k]));
    strokes(svg).forEach((s) => {
      s.removeAttribute("class");
      s.setAttribute("class", `${className} draw`);
      delay(s, at);
    });
    group.append(svg);
    return svg;
  };

  // Where the line from a node's centre towards (tx, ty) leaves its ellipse.
  const rim = (n, tx, ty) => {
    const dx = tx - n.x;
    const dy = ty - n.y;
    const k = 1 / Math.sqrt((dx * dx) / (n.rx * n.rx) + (dy * dy) / (n.ry * n.ry));
    return { x: n.x + dx * k, y: n.y + dy * k };
  };

  const arrowHead = (tip, from) => {
    const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
    const side = (turn) => `L ${tip.x - 12 * Math.cos(angle + turn)} ${tip.y - 12 * Math.sin(angle + turn)}`;
    return `M ${tip.x} ${tip.y} ${side(0.5)} M ${tip.x} ${tip.y} ${side(-0.5)}`;
  };

  // A slightly bowed arrow. bend > 0 bows to the left of the direction of travel.
  const arrow = (a, b, bend) => {
    const start = rim(a, b.x, b.y);
    const end = rim(b, a.x, a.y);
    const len = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const cx = (start.x + end.x) / 2 + (bend * (end.y - start.y)) / len;
    const cy = (start.y + end.y) / 2 - (bend * (end.x - start.x)) / len;
    return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y} ${arrowHead(end, { x: cx, y: cy })}`;
  };

  // An arrow back up the board: out to a loop-the-loop centred on `centre`
  // (halfway along when the layout gives none), then a long arc over the top
  // of the board, as high as `ceiling`, and down into its target.
  const loopArrow = (a, b, centre, ceiling) => {
    const r = 34;
    const c = centre || { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const loopFoot = { x: c.x, y: c.y + r };
    const start = rim(a, loopFoot.x, loopFoot.y);
    const c1 = { x: (start.x + loopFoot.x) / 2, y: Math.max(start.y, loopFoot.y) + 20 };
    const up1 = { x: c.x - 3 * r, y: c.y - r };
    const up2 = { x: b.x, y: ceiling };
    const end = rim(b, up2.x, up2.y);
    return `M ${start.x} ${start.y} Q ${c1.x} ${c1.y} ${loopFoot.x} ${loopFoot.y}
      a ${r} ${r} 0 1 0 0 ${-2 * r} a ${r} ${r} 0 1 0 0 ${2 * r}
      C ${up1.x} ${up1.y} ${c.x} ${ceiling} ${(c.x + b.x) / 2} ${ceiling}
      S ${up2.x} ${up2.y} ${end.x} ${end.y} ${arrowHead(end, up2)}`;
  };

  // Draws the whole pathway as a flowchart into `holder`, starting at time
  // `t0`. Returns the time, in seconds, at which the drawing is finished.
  const drawChart = (holder, t0) => {
    const r = data.reveal;
    const svg = el("svg", { role: "img", "aria-labelledby": "chart-title" });
    el("title", { id: "chart-title" }, svg).textContent = r.heading;
    const edges = el("g", {}, svg);
    const shapes = el("g", {}, svg);
    holder.append(svg);

    const pos = (key) => ({ x: (r.layout[key].col - 1) * COL, y: (r.layout[key].row - 1) * ROW });

    // Breadth-first from the start, so the board draws in reading order.
    const order = [data.start];
    for (let i = 0; i < order.length; i++) {
      (nodes[order[i]].options || []).forEach((opt) => { if (!order.includes(opt.next)) order.push(opt.next); });
    }
    Object.keys(nodes).forEach((id) => { if (!order.includes(id)) order.push(id); });

    const onRoute = new Set(route.map((step) => step.id));
    const placed = {};
    let t = t0;

    order.forEach((id) => {
      const node = nodes[id];
      const p = pos(id);
      const g = el("g", {}, shapes);
      const box = label(g, node.board_label, p.x, p.y, "label", t + 0.15);
      const hot = onRoute.has(id) ? " on-route" : "";
      if (node.type === "question") {
        const ring = { x: box.x - 22, y: box.y - 14, width: box.width + 44, height: box.height + 28 };
        sketch(g, artNames("loop-")[order.indexOf(id) % artNames("loop-").length], ring, "ring" + hot, t);
        placed[id] = { x: p.x, y: p.y, rx: ring.width / 2 + 4, ry: ring.height / 2 + 4, at: t };
      } else {
        if (hot) {
          const y = box.y + box.height + 4;
          delay(el("path", { class: "mark on-route draw", pathLength: 1, d: `M ${box.x} ${y} q ${box.width / 2} -5 ${box.width} 1` }, g), t + 0.2);
        }
        placed[id] = { x: p.x, y: p.y, rx: box.width / 2 + 10, ry: box.height / 2 + 10, at: t };
      }
      t += STEP;
    });

    // Questions' arrows, once both ends are on the board.
    const ceiling = Math.min(...Object.values(placed).map((n) => n.y - n.ry)) - 50;
    order.forEach((id) => {
      const opts = nodes[id].options || [];
      opts.forEach((opt, i) => {
        const a = placed[id];
        const b = placed[opt.next];
        const twins = opts.filter((o) => o.next === opt.next).length;
        const bend = twins > 1 ? (i % 2 ? -34 : 34) : 10;
        const back = r.layout[opt.next].row < r.layout[id].row;
        const hot = route.some((step) => step.id === id && step.option === i) ? " on-route" : "";
        const d = back ? loopArrow(a, b, r.layout.loop && pos("loop"), ceiling) : arrow(a, b, bend);
        delay(el("path", { class: "edge draw" + hot, pathLength: 1, d }, edges), Math.max(a.at, b.at) + 0.2);
      });
    });

    // Every verdict converges on the glass of wine.
    const fp = pos("final");
    const fg = el("g", {}, shapes);
    const finalAt = t + 0.3;
    const fbox = label(fg, r.final_node, fp.x, fp.y, "label final-label", finalAt + 0.2);
    const ring = { x: fbox.x - 34, y: fbox.y - 22, width: fbox.width + 68, height: fbox.height + 44 };
    sketch(fg, artNames("loop-")[0], ring, "ring on-route", finalAt);
    const glass = art("doodle-glass");
    const gw = 44;
    Object.entries({ x: ring.x + ring.width + 6, y: fp.y - gw * 0.83, width: gw, height: gw * 1.66 })
      .forEach(([k, v]) => glass.setAttribute(k, v));
    delay(glass, finalAt + 0.4).classList.add("fade");
    fg.append(glass);
    const final = { x: fp.x, y: fp.y, rx: ring.width / 2 + 4, ry: ring.height / 2 + 4 };
    const last = route[route.length - 1];
    Object.keys(nodes).filter((id) => nodes[id].type === "verdict").forEach((id, i) => {
      const hot = last && last.id === id ? " on-route" : "";
      delay(el("path", { class: "edge draw" + hot, pathLength: 1, d: arrow(placed[id], final, i % 2 ? 8 : -8) }, edges), t + i * 0.08);
    });

    const bounds = svg.getBBox();
    const pad = 16;
    svg.setAttribute("viewBox", `${bounds.x - pad} ${bounds.y - pad} ${bounds.width + 2 * pad} ${bounds.height + 2 * pad}`);
    return finalAt + 0.6;
  };

  // ---- Start -----------------------------------------------------------------

  // The landing screen is already in the page; it only needs its art and button.
  stage.querySelector(".js-only").classList.remove("js-only");
  circleAnswers();
  startButton();
  scatterDoodles(3);
})();
