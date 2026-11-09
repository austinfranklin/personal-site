(async () => {
  try {
    await startGame();
  } catch (error) {
    const box = document.getElementById("error");
    box.textContent = "Something went wrong: " + error.message;
    box.hidden = false;
    console.error(error);
  }
})();

async function startGame() {
  if (!window.PIXI) throw new Error("PixiJS didn’t load. Check your internet connection.");

  // . grass  , tall grass  : high ground  # cliff  - path  = bridge  ~ water  o stone
  // T tree  ^ stairs  | ladder  v ledge  _ rails  + platform  @ start  letters = works
  const MAP = [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TT................................................................................TT",
    "TT.T..............................................................T...........T...TT",
    "TT.............###................................T...............................TT",
    "TT..........###:::###......................................T......................TT",
    "TT.......###:::::::::######.....................TTTTTTT...........................TT",
    "TT......#::::::::::::::::::##....T............TTTTTTTTTTTTTTTT...T................TT",
    "TT....T#:::::::::::::::::::::#................TTTTTTTTTTTTTTTTTTT.................TT",
    "TT....#:::::::qqqQqqq::::::::#....T..........TTTTTTTTTTTTTTTTTTTTTT...............TT",
    "TT....#::::::::::::::::::::::^-------............TTTTTTTT.....TTTTTTT.............TT",
    "TT....#::::::::::::::::::::::#......-........jJj.TTTTTT........TTTTTTT............TT",
    "TT....#::::::::::::::::::::::#......--------.....-----.....R...TTTTTTTT...........TT",
    "TT.....#fFf:::::::::::::nNn:#..............T.....TTTT..........TTTTTTTT...........TT",
    "TT.....v:::::::::::::::::::##..............TT....TTTT..........TTTTTTTTT..........TT",
    "TT......v:::::::::::::::::#................TTTTTTTTTTT.........TTTTTTTTT..........TT",
    "TT.......v:::::::::::::###..T..............TTTTTTTTTTTTT......TTTTTTTTTT..........TT",
    "TT........vv::::#######.........T..........TTTTTTTTTTTTTTT-TTTTTTTTTTTT...........TT",
    "TT........,.####-.................T........TTTTTTTTTTTTTTT-TTTTTTTTTTT............TT",
    "TT.......,,,....-..........................TTTTTTTTTTTTTTT-TTTTTTTTT.....,,.......TT",
    "TT.......,,,,...-...........................TTTTTTTTTTTTTT-TTTTT.........,,,......TT",
    "TT......,,,,....-............................TTTTTTTTTTTTT-.............,,,,,.....TT",
    "TT..............-...............................TTTTTTTTT.-............,,,,,,,.T..TT",
    "TT..............-......................................----............,,,,,,,....TT",
    "TT............---...........T..................T.......-................,,,,,,....TT",
    "TT............-........................................-..........................TT",
    "TT............-...................................kkKkk-..X.......................TT",
    "TT............-........................................-...........T......T.......TT",
    "TT............-...............,,..............T,,.------..........................TT",
    "TT............-.........T...,,,,,T............,,,,-...............................TT",
    "TT......T..aAa-............,,,,,,,............,,,,-,.....~~.......................TT",
    "TT............-M...........,,,,,,,............,,,T-...~~~~~~~~~~~~~~~~............TT",
    "TT...T........-................,...............,,.-.Y.~~~~~~~~~~~~~~~~~~~.........TT",
    "TT.....T......-........................T..........-..~~~~~~~~~~~~~~~~~~~~~T.......TT",
    "TT...........@-............................T...T..-..~~~~~~~~~~~...~~~~~~~~.......TT",
    "TT............-...................................-..oooooooooo..S..~~~~~~~.......TT",
    "TT............-...................................-...~~~~~~~~~~...~~~~~~~........TT",
    "TT............-......T.......................T....-....~~~~~~~~~~~~~~~~~~~........TT",
    "TT............-........T...................T......-....~~~~~~~~~~~~~~~~~~.........TT",
    "TT...,,,,,,,..-....-------........................-.....~~~~~~~~~~~~~~~...........TT",
    "TT...,,,,,,,..-...-pPp--hHh.......................-......~~~~~~~~~~~~~............TT",
    "TT.....,,,,...--------------......................-.......~~~~~~~~~~~....T..T.....TT",
    "TT.....,,.........----------.....------------.....-....T....~~~~~~~~..............TT",
    "TT.................---I---.-.....--U---B---W-.....-.....T.........................TT",
    "TT...............T...--....------------------.....-----------------...............TT",
    "TT........................T......-------lLl--.....,,,,,,,,........-..T............TT",
    "TT.....T...............T.........-------------....,,,,,,,,........-...............TT",
    "TT............-........................-.....-....,,,,,,,,........-.-.............TT",
    "TT............-........T...............-.....----------------------.-.C...........TT",
    "TT............-........................-..........................-.-........T....TT",
    "TT............+.......TT...............+............................+.............TT",
    "TT........___________________________________________________________________.....TT",
    "TT.......................T,,,,,,.......................T..........................TT",
    "TT...................T......,.T..T................................................TT",
    "TT.............................................................T..................TT",
    "TT................................................................................TT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  ];

  const ROUTE = [[10, 51], [76, 51]];
  const STOPS = [
    { name: "village", track: [14, 51], platform: [14, 50] },
    { name: "workshop", track: [39, 51], platform: [39, 50] },
    { name: "lake station", track: [68, 51], platform: [68, 50] },
  ];

  const ROWS = MAP.length;
  const COLS = MAP[0].length;
  const TILE = 40;
  const at = (x, y) => (y < 0 || y >= ROWS || x < 0 || x >= COLS ? "T" : MAP[y][x]);
  const WALK = ".,:=@^|o+-_";
  const isWalkable = (x, y) => WALK.includes(at(x, y));
  const isLow = (x, y) => "vf~".includes(at(x, y));

  const app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    background: "#f3f1ea",
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  document.getElementById("stage").appendChild(app.canvas);

  await Promise.race([
    document.fonts.load('400 14px "IBM Plex Mono"'),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => {});

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PAPER = 0xf3f1ea;
  const HIGH = 0xe4e0d4;
  const INK = 0x111111;
  const MID = 0x8a877f;
  const WATER = 0xbcc8e6;
  const RED = 0xe5412d;
  const BLUE = 0x2c5bd6;
  const YELLOW = 0xf2b705;
  const GREEN = 0x239b56;

  const world = new PIXI.Container();
  const ground = new PIXI.Graphics();
  const ripples = new PIXI.Graphics();
  const standing = new PIXI.Container();
  standing.sortableChildren = true;
  world.addChild(ground, ripples, standing);
  app.stage.addChild(world);

  const animations = [];

  const PAGE_LETTERS = "AMQNFJRKXYSCUBWLPHI";
  const isPageTile = (x, y) => /[A-Za-z]/.test(at(x, y)) && PAGE_LETTERS.includes(at(x, y).toUpperCase());
  const touches = (x, y, chars) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => chars.includes(at(x + dx, y + dy)));
  const isRail = (x, y) => at(x, y) === "_";
  const PATH = 0xe9e4d6;
  const FOREST = 0xd8d4c8;

  function drawRail(x, y, px, py) {
    const h = isRail(x - 1, y) ? -1 : isRail(x + 1, y) ? 1 : 0;
    const v = isRail(x, y - 1) ? -1 : isRail(x, y + 1) ? 1 : 0;
    if (h && v) {
      const cx = px + (h > 0 ? TILE : 0);
      const cy = py + (v > 0 ? TILE : 0);
      const mid = Math.atan2(py + TILE / 2 - cy, px + TILE / 2 - cx);
      for (let k = -1; k <= 1; k++) {
        const a = mid + k * 0.5;
        ground.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9).lineTo(cx + Math.cos(a) * 31, cy + Math.sin(a) * 31);
      }
      ground.stroke({ width: 4, color: MID });
      for (const r of [12, 28]) ground.arc(cx, cy, r, mid - Math.PI / 4, mid + Math.PI / 4).stroke({ width: 2, color: INK });
      return;
    }
    if (v && !h) {
      for (let k = 4; k < TILE; k += 12) ground.rect(px + 9, py + k, 22, 4).fill(MID);
      ground.rect(px + 12, py, 2, TILE + 0.5).rect(px + 26, py, 2, TILE + 0.5).fill(INK);
    } else {
      for (let k = 4; k < TILE; k += 12) ground.rect(px + k, py + 9, 4, 22).fill(MID);
      ground.rect(px, py + 12, TILE + 0.5, 2).rect(px, py + 26, TILE + 0.5, 2).fill(INK);
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = at(x, y);
      const px = x * TILE;
      const py = y * TILE;
      const full = () => ground.rect(px, py, TILE + 0.5, TILE + 0.5);

      if (c === ":" || c === "^" || c === "+" || (isPageTile(x, y) && touches(x, y, ":"))) full().fill(HIGH);
      if (c === "~" || c === "o") full().fill(WATER);

      if (c === "#" || c === "|") {
        full().fill(INK);
        for (let k = 5; k < TILE; k += 8) ground.rect(px + k, py + 4, 1, TILE - 8).fill(0x3a3a3a);
      }
      if (c === "|") {
        ground.rect(px + 9, py, 3, TILE).rect(px + TILE - 12, py, 3, TILE).fill(PAPER);
        for (let k = 6; k < TILE; k += 11) ground.rect(px + 9, py + k, TILE - 18, 3).fill(PAPER);
      }
      if (c === "^") {
        for (let k = 4; k < TILE; k += 9) ground.rect(px + 4, py + k, TILE - 8, 3).fill(INK);
      }
      if (c === "o") ground.roundRect(px + 4, py + 5, 32, 30, 10).fill(PAPER).stroke({ width: 2, color: INK });
      if (c === "T") {
        const deep = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].every(([dx, dy]) => at(x + dx, y + dy) === "T");
        if (deep) full().fill(FOREST);
        else ground.circle(px + 20, py + 18, 15).fill(INK).rect(px + 18, py + 30, 4, 8).fill(INK);
      }
      if (c === ",") {
        for (const [ox, oy] of [[9, 14], [20, 26], [30, 12]]) ground.rect(px + ox, py + oy, 2, 8).rect(px + ox + 4, py + oy + 2, 2, 6).fill(GREEN);
      }
      if (c === "v") {
        full().fill(HIGH);
        ground.rect(px, py + 26, TILE + 0.5, 4).fill(INK);
        ground.poly([px + 14, py + 30, px + 20, py + 36, px + 26, py + 30]).fill(INK);
      }
      if (c === "-") full().fill(PATH);
      if (c === "=") {
        full().fill(WATER);
        ground.rect(px, py + 6, TILE + 0.5, 28).fill(PAPER);
        ground.rect(px, py + 6, TILE + 0.5, 2).rect(px, py + 32, TILE + 0.5, 2).fill(INK);
        for (let k = 0; k < 4; k++) ground.rect(px + k * 10 + 4, py + 10, 1.5, 20).fill(MID);
      }
      if (isRail(x, y)) drawRail(x, y, px, py);
      if (c === "+") {
        ground.rect(px + 2, py + 2, TILE - 4, TILE - 4).stroke({ width: 3, color: INK });
        ground.rect(px + 8, py + 17, TILE - 16, 6).fill(YELLOW);
      }
    }
  }

  const waterSpots = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (at(x, y) === "~" && (x * 7 + y * 3) % 5 === 0) waterSpots.push([x, y]);
  animations.push((t) => {
    ripples.clear();
    for (const [x, y] of waterSpots) {
      const shift = Math.sin(t * 1.3 + x * 0.7 + y) * 5;
      ripples.moveTo(x * TILE + 10 + shift, y * TILE + 22).lineTo(x * TILE + 26 + shift, y * TILE + 22);
    }
    ripples.stroke({ width: 2, color: BLUE, alpha: 0.5 });
  });

  const PAGES = {
    A: { id: "about", draw: drawHouse },
    M: { id: "contact", draw: drawMailbox },
    Q: { id: "quartet", draw: drawQuartet },
    N: { id: "concentric", draw: drawCircles },
    F: { id: "flower", draw: drawSaxophones },
    J: { id: "witch", draw: drawPiano },
    R: { id: "rave", draw: drawRave },
    K: { id: "murk", draw: drawOrchestra },
    X: { id: "auxtrument", draw: drawAuxtrument },
    Y: { id: "bloom", draw: drawBloom },
    S: { id: "smallworlds", draw: drawCanvas },
    C: { id: "clock", draw: drawClock },
    U: { id: "unfinder", draw: drawUnfinder },
    B: { id: "bounded", draw: drawBounded },
    W: { id: "dom", draw: drawLiveCoding },
    L: { id: "lightmotif", draw: drawLightmotif },
    P: { id: "mosaics", draw: drawMarimba },
    H: { id: "motion", draw: drawPendulums },
    I: { id: "io", draw: drawSnare },
  };

  const add = (c) => c.addChild(new PIXI.Graphics());

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const page = PAGES[at(x, y)];
      if (!page) continue;
      const c = new PIXI.Container();
      c.position.set(x * TILE + TILE / 2, (y + 1) * TILE - 4);
      c.zIndex = (y + 1) * TILE;
      page.draw(c);
      standing.addChild(c);
    }
  }

  function drawHouse(c) {
    add(c).rect(-56, -70, 112, 70).fill(INK).poly([-66, -70, 0, -112, 66, -70]).fill(INK)
      .rect(-10, -38, 20, 38).fill(PAPER).rect(22, -54, 18, 18).fill(YELLOW);
  }  function drawMailbox(c) {
    add(c).rect(-2, -28, 4, 28).fill(INK).rect(-14, -46, 28, 20).fill(INK);
    const flag = add(c).rect(0, -14, 3, 14).fill(INK).rect(0, -14, 10, 6).fill(RED);
    flag.position.set(14, -32);
    animations.push((t) => { flag.rotation = -0.2 + Math.sin(t * 0.8) * 0.05; });
  }
  function instrument(g, x, y, s, endpin) {
    const base = y + (endpin ? -10 * s : 0);
    if (endpin) g.rect(x - 1, base, 2, y - base).fill(INK);
    g.ellipse(x, base - 20 * s, 15 * s, 18 * s).fill(INK);
    g.ellipse(x, base - 48 * s, 12 * s, 14 * s).fill(INK);
    g.rect(x - 2.5 * s, base - 92 * s, 5 * s, 46 * s).fill(INK);
    g.circle(x, base - 95 * s, 4 * s).fill(INK);
    g.rect(x - 5 * s, base - 30 * s, 10 * s, 2).fill(PAPER);
    for (let k = -1.5; k <= 1.5; k++) g.moveTo(x + k * 1.6 * s, base - 88 * s).lineTo(x + k * 2.4 * s, base - 8 * s);
    g.stroke({ width: 1, color: PAPER });
    return base - 26 * s;
  }
  function drawQuartet(c) {
    const R = 112;
    const seats = [
      { a: Math.PI * 0.94, s: 0.62 },
      { a: Math.PI * 0.66, s: 0.62 },
      { a: Math.PI * 0.34, s: 0.7 },
      { a: Math.PI * 0.06, s: 0.95, endpin: true },
    ].map((p) => ({ ...p, x: Math.cos(p.a) * R, y: -Math.sin(p.a) * R * 0.4 }));
    const g = add(c);
    for (let a = 0; a <= Math.PI; a += Math.PI / 40) {
      const x = Math.cos(a) * R;
      const y = -Math.sin(a) * R * 0.4 + 4;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke({ width: 2, color: MID });
    [...seats].sort((p, q) => p.y - q.y).forEach((p) => { p.bowY = instrument(g, p.x, p.y, p.s, p.endpin); });
    const bows = add(c);
    animations.push((t) => {
      bows.clear();
      seats.forEach((p, i) => {
        const stroke = Math.sin(t * 1.6 + i * 0.9) * 20 * p.s;
        const half = 34 * p.s;
        bows.moveTo(p.x + stroke - half, p.bowY + 3).lineTo(p.x + stroke + half, p.bowY - 3);
      });
      bows.stroke({ width: 2, color: RED });
    });
  }
  function drawCircles(c) {
    const rings = add(c);
    const cello = add(c);
    instrument(cello, 0, 0, 0.8, true);
    animations.push((t) => {
      rings.clear();
      for (let k = 0; k < 3; k++) {
        const f = (t * 0.25 + k / 3) % 1;
        rings.ellipse(0, -2, 18 + f * 50, 6 + f * 17).stroke({ width: 2, color: k === 0 ? BLUE : INK, alpha: 1 - f });
      }
    });
  }

  function drawSaxophones(c) {
    const sun = add(c).circle(0, -86, 13).fill(YELLOW);
    const saxes = [-36, -12, 12, 36].map((x) => {
      const s = add(c);
      s.moveTo(-3, -52).lineTo(0, -48).lineTo(0, -16).quadraticCurveTo(0, -4, 8, -6).lineTo(11, -18)
        .stroke({ width: 6, color: INK, cap: "round", join: "round" });
      s.ellipse(11, -19, 5, 2.5).fill(INK);
      s.x = x;
      return s;
    });
    animations.push((t) => {
      const beat = (t * 1.6) % 1;
      saxes.forEach((s, i) => {
        const phase = (beat + i * 0.375) % 1;
        s.y = phase < 0.75 ? -Math.sin((phase / 0.75) * Math.PI) * 3 : 0;
      });
      sun.scale.set(1 + Math.sin(t * 0.8) * 0.04);
    });
  }

  function drawPiano(c) {
    add(c).poly([-50, -30, 40, -30, 50, -50, 20, -70, -50, -70]).fill(INK).rect(-48, -6, 4, 6).rect(36, -6, 4, 6).rect(-48, -30, 96, 24).fill(INK);
    const keys = add(c);
    animations.push((t) => {
      keys.clear();
      for (let k = 0; k < 14; k++) {
        const down = Math.sin(t * 3 + k * 1.7) > 0.85;
        keys.rect(-46 + k * 6.6, -30 + (down ? 2 : 0), 5.6, 12).fill(down ? RED : PAPER);
      }
    });
  }
  function drawRave(c) {
    const g = add(c);
    const performers = [RED, BLUE, YELLOW];
    animations.push((t) => {
      g.clear();
      performers.forEach((colour, i) => {
        const x = Math.sin(t * 0.35 + i * 2.1) * 90;
        const y = -20 + Math.cos(t * 0.3 + i * 1.4) * 40;
        const ring = (t * 0.5 + i * 0.33) % 1;
        g.circle(x, y, 6 + ring * 50).stroke({ width: 1.5, color: colour, alpha: 1 - ring });
        g.circle(x, y, 5).fill(colour);
      });
      g.rect(-3, -16, 6, 16).fill(INK);
    });
  }
  function drawOrchestra(c) {
    const g = add(c);
    for (const [r, n] of [[26, 7], [42, 11], [58, 15]]) {
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.12 + 0.76 * (i / (n - 1)));
        g.circle(Math.cos(a) * r, -6 - Math.sin(a) * r * 0.45, 3.5).fill(INK);
      }
    }
    g.rect(-6, -8, 12, 8).fill(INK);
    const fog = add(c);
    animations.push((t) => {
      fog.clear();
      for (let i = 0; i < 4; i++) fog.circle(Math.sin(t * 0.2 + i * 1.7) * 55, -18 + Math.cos(t * 0.17 + i) * 8, 16 + i * 4);
      fog.fill({ color: INK, alpha: 0.08 });
    });
  }

  function drawAuxtrument(c) {
    add(c)
      .rect(-30, -40, 22, 40).fill(INK).circle(-19, -28, 6).fill(PAPER).circle(-19, -12, 4).fill(PAPER)
      .rect(17, -34, 2.5, 34).fill(INK).roundRect(13, -46, 10, 14, 5).fill(INK);
    const waves = add(c);
    animations.push((t) => {
      waves.clear();
      for (let k = 0; k < 3; k++) {
        const f = (t * 0.6 + k / 3) % 1;
        const x = -6 + f * 18;
        waves.arc(x - 14, -28, 6 + f * 6, -0.9, 0.9).stroke({ width: 2, color: GREEN, alpha: 1 - Math.abs(f - 0.5) * 2 });
      }
    });
  }

  function drawBloom(c) {
    const cello = add(c);
    instrument(cello, 0, 0, 0.8, true);
    const petals = add(c);
    petals.y = -100;
    animations.push((t) => {
      const open = 0.5 + 0.5 * Math.sin(t * 0.6);
      petals.clear();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.1;
        petals.ellipse(Math.cos(a) * 10 * open, Math.sin(a) * 10 * open, 6, 6).fill(INK);
      }
      petals.circle(0, 0, 3 + open * 3).fill(RED);
    });
  }

  function drawCanvas(c) {
    add(c).rect(-24, -16, 3, 16).rect(21, -16, 3, 16).fill(INK)
      .rect(-30, -66, 60, 50).fill(PAPER).stroke({ width: 3, color: INK })
      .moveTo(-22, -24).lineTo(18, -58).stroke({ width: 2.5, color: INK })
      .circle(10, -30, 9).fill(BLUE);
    const point = add(c);
    animations.push((t) => {
      point.clear().circle(-10 + Math.sin(t * 0.5) * 6, -50 + Math.cos(t * 0.4) * 4, 4).fill(RED);
    });
  }

  function drawClock(c) {
    add(c).rect(-2, -30, 4, 30).fill(INK).circle(0, -52, 24).fill(PAPER).stroke({ width: 3, color: INK });
    const hands = add(c);
    let angle = 0;
    animations.push((t, dt) => {
      if (train.waiting > 0) angle += dt * 3;
      hands.clear()
        .moveTo(0, -52).lineTo(Math.cos(angle - Math.PI / 2) * 18, -52 + Math.sin(angle - Math.PI / 2) * 18)
        .moveTo(0, -52).lineTo(Math.cos(angle / 12 - Math.PI / 2) * 11, -52 + Math.sin(angle / 12 - Math.PI / 2) * 11)
        .stroke({ width: 2.5, color: INK })
        .circle(0, -52, 2.5).fill(RED);
    });
  }
  function drawUnfinder(c) {
    const g = add(c);
    animations.push((t) => {
      g.clear();
      const playing = Math.floor(t / 1.2) % 5;
      for (let i = 0; i < 5; i++) {
        const out = i === playing ? Math.sin(((t % 1.2) / 1.2) * Math.PI) * 16 : 0;
        g.rect(-18 + out, -12 - i * 9, 36, 7).fill(i === playing ? GREEN : INK);
      }
    });
  }
  function drawBounded(c) {
    add(c).rect(-22, -50, 44, 44).stroke({ width: 3, color: INK });
    const dot = add(c).rect(-4, -4, 8, 8).fill(GREEN);
    const bounce = (v) => 1 - Math.abs((((v % 2) + 2) % 2) - 1) * 2;
    animations.push((t) => dot.position.set(bounce(t * 0.43) * 14, -28 + bounce(t * 0.61) * 14));
  }
  function drawLiveCoding(c) {
    add(c)
      .rect(-36, -70, 72, 60).fill(PAPER).stroke({ width: 3, color: INK })
      .rect(-36, -70, 72, 10).fill(INK)
      .circle(-29, -65, 2).circle(-23, -65, 2).circle(-17, -65, 2).fill(PAPER)
      .rect(-2, -10, 4, 10).fill(INK);
    const code = add(c);
    const widths = [30, 46, 22, 38, 52, 18];
    animations.push((t) => {
      code.clear();
      const typed = (t * 30) % (widths.reduce((a, b) => a + b, 0) + 40);
      let left = typed;
      widths.forEach((w, i) => {
        const shown = Math.max(0, Math.min(w, left));
        left -= w;
        const indent = i % 3 === 1 ? 8 : 0;
        if (shown > 0) code.rect(-28 + indent, -54 + i * 7, shown, 3).fill(i % 2 ? GREEN : INK);
        if (shown > 0 && shown < w) code.rect(-28 + indent + shown + 1, -55 + i * 7, 2, 5).fill(INK);
      });
    });
  }
  function drawLightmotif(c) {
    const g = add(c);
    animations.push((t) => {
      g.clear();
      g.rect(-30, -30, 3, 30).fill(INK).circle(-28.5, -38, 8).fill(INK);
      for (let i = 0; i < 3; i++) {
        const h = 6 + Math.abs(Math.sin(t * 4 + i * 1.1)) * 14;
        g.rect(-14 + i * 6, -38 - h / 2, 3, h).fill(GREEN);
      }
      g.rect(8, -56, 34, 30).stroke({ width: 2, color: INK });
      const y = -41 + Math.sin(t * 3) * 9;
      g.rect(14, y - 3, 6, 6).fill(GREEN);
      g.rect(30 - ((t * 20) % 24), -45, 4, 8).fill(INK);
    });
  }
  function drawMarimba(c) {
    add(c).rect(-56, -26, 4, 26).rect(52, -26, 4, 26).fill(INK);
    const bars = add(c);
    animations.push((t) => {
      bars.clear();
      const step = Math.floor(t * 4);
      for (let i = 0; i < 12; i++) {
        const h = 34 - i * 1.6;
        const lit = (i * 5 + step) % 7 === 0 || (i * 3 + step) % 11 === 0;
        bars.rect(-54 + i * 9, -30 - h / 2, 7, h).fill(lit ? YELLOW : INK);
      }
    });
  }
  function drawPendulums(c) {
    add(c).rect(-56, -74, 112, 4).rect(-56, -74, 4, 74).rect(52, -74, 4, 74).fill(INK);
    const g = add(c);
    animations.push((t) => {
      g.clear();
      for (let i = 0; i < 4; i++) {
        const x0 = -33 + i * 22;
        const a = Math.sin(t * (1.4 + i * 0.18)) * 0.5;
        const len = 44;
        const x = x0 + Math.sin(a) * len;
        const y = -70 + Math.cos(a) * len;
        g.moveTo(x0, -70).lineTo(x, y).stroke({ width: 1.5, color: INK });
        g.circle(x, y, 6).fill(i === 1 ? RED : INK);
      }
    });
  }
  function drawSnare(c) {
    add(c).rect(-26, -24, 4, 24).rect(10, -24, 4, 24).fill(INK)
      .rect(-30, -42, 48, 20).fill(INK).ellipse(-6, -42, 24, 6).fill(PAPER).stroke({ width: 2, color: INK });
    const sw = add(c);
    const wires = add(c);
    animations.push((t) => {
      const on = Math.floor(t / 2.5) % 2 === 0;
      wires.clear();
      if (on) {
        for (let k = 0; k < 4; k++) wires.moveTo(-26 + k * 3, -20 + k * 1.5).lineTo(10 + k * 3, -20 + k * 1.5);
        wires.stroke({ width: 1, color: INK });
      }
      sw.clear().roundRect(26, -40, 22, 12, 6).stroke({ width: 2, color: INK }).circle(on ? 42 : 32, -34, 4).fill(on ? BLUE : INK);
    });
  }

  let startX = 1;
  let startY = 1;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (at(x, y) === "@") { startX = x; startY = y; }

  const player = {
    tx: startX, ty: startY,
    px: startX * TILE, py: startY * TILE,
    facing: { x: 0, y: 1 },
    move: null,
    air: 0,
    riding: false,
  };
  const AIR_TIME = 0.5;

  const block = new PIXI.Container();
  const body = new PIXI.Graphics().rect(-11, -28, 22, 28).fill(INK);
  const mark = new PIXI.Graphics().rect(-2.5, -2.5, 5, 5).fill(PAPER);
  const emote = new PIXI.Container();
  emote.addChild(new PIXI.Graphics().rect(-9, -24, 18, 22).fill(PAPER).stroke({ width: 2, color: INK }).poly([-4, -2, 0, 4, 4, -2]).fill(INK));
  const bang = new PIXI.Text({ text: "!", style: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: "600", fontSize: 17, fill: INK } });
  bang.anchor.set(0.5);
  bang.y = -13;
  emote.addChild(bang);
  emote.visible = false;
  block.addChild(body, mark, emote);
  standing.addChild(block);

  const line = [];
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [x0, y0] = ROUTE[i];
    const [x1, y1] = ROUTE[i + 1];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    for (let x = x0, y = y0; x !== x1 || y !== y1; x += dx, y += dy) line.push([x, y]);
  }
  line.push(ROUTE[ROUTE.length - 1]);
  for (const stop of STOPS) stop.index = line.findIndex(([x, y]) => x === stop.track[0] && y === stop.track[1]);

  const FIRST_STOP = Math.min(...STOPS.map((s) => s.index));
  const LAST_STOP = Math.max(...STOPS.map((s) => s.index));
  // train runs back and forth between the stops
  const train = { s: STOPS[0].index, dir: 1, waiting: 3, stop: STOPS[0], speed: 5, blocked: false };
  const CAR_GAP = 0.95;
  const cars = [INK, YELLOW, INK].map((colour, i) => {
    const car = new PIXI.Graphics().rect(-16, -10, 32, 20).fill(colour);
    if (i === 0) car.rect(4, -4, 8, 8).fill(PAPER);
    standing.addChild(car);
    return car;
  });

  function along(s) {
    const clamped = Math.max(0, Math.min(line.length - 1, s));
    const i = Math.min(line.length - 2, Math.floor(clamped));
    const f = clamped - i;
    const [x0, y0] = line[i];
    const [x1, y1] = line[i + 1];
    return { x: (x0 + (x1 - x0) * f) * TILE + TILE / 2, y: (y0 + (y1 - y0) * f) * TILE + TILE / 2, vertical: x0 === x1 };
  }

  const tileAlong = (s) => line[Math.round(Math.max(0, Math.min(line.length - 1, s)))];
  function trainTiles() {
    return cars.map((_, i) => tileAlong(train.s - train.dir * i * CAR_GAP));
  }
  const trainOn = (x, y) => trainTiles().some(([tx, ty]) => tx === x && ty === y);

  function updateTrain(dt) {
    if (train.waiting > 0) {
      train.waiting -= dt;
      if (train.waiting <= 0) train.stop = null;
    } else {
      const ahead = [0.6, 1.2, 1.8].map((k) => tileAlong(train.s + train.dir * k));
      const target = player.move ? [player.move.toX, player.move.toY] : [player.tx, player.ty];
      train.blocked = !player.riding && ahead.some(([x, y]) => (x === player.tx && y === player.ty) || (x === target[0] && y === target[1]));
      if (!train.blocked) {
        const before = train.s;
        train.s += train.dir * train.speed * dt;
        for (const stop of STOPS) {
          const passed = train.dir > 0 ? before < stop.index && train.s >= stop.index : before > stop.index && train.s <= stop.index;
          if (passed) {
            train.s = stop.index;
            train.stop = stop;
            train.waiting = 4;
            if (stop.index === FIRST_STOP || stop.index === LAST_STOP) train.dir *= -1;
            if (player.riding) getOff(stop);
            break;
          }
        }
      }
    }
    cars.forEach((car, i) => {
      const p = along(train.s - train.dir * i * CAR_GAP);
      car.position.set(p.x, p.y + 4);
      car.rotation = p.vertical ? Math.PI / 2 : 0;
      car.scale.x = train.dir;
      car.zIndex = p.y + 20;
    });
  }

  const trainWaitingHere = () => train.waiting > 0.3 && train.stop;

  function getOn() {
    player.riding = true;
    player.move = null;
    player.air = 0;
    path = [];
    showPage(null);
  }

  function getOff(stop) {
    player.riding = false;
    player.tx = stop.platform[0];
    player.ty = stop.platform[1];
    player.px = player.tx * TILE;
    player.py = player.ty * TILE;
    player.move = null;
  }

  const held = [];
  let jumpQueued = false;
  let path = [];
  const hello = document.getElementById("hello");
  const hint = document.getElementById("hint");
  let started = false;

  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const KEYMAP = {
    arrowup: "up", w: "up", arrowdown: "down", s: "down",
    arrowleft: "left", a: "left", arrowright: "right", d: "right",
    " ": "jump", z: "jump", x: "jump",
  };

  function begin() {
    if (started) return;
    started = true;
    setTimeout(() => hello.classList.add("gone"), 3000);
  }

  function press(name, down) {
    begin();
    if (DIRS[name]) {
      const i = held.indexOf(name);
      if (i >= 0) held.splice(i, 1);
      if (down) { held.push(name); path = []; manualPage = false; }
    } else if (name === "jump" && down) {
      jumpQueued = true;
      path = [];
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.target.closest("a, button, iframe")) return;
    const name = KEYMAP[e.key.toLowerCase()];
    if (!name) return;
    e.preventDefault();
    if (!e.repeat || DIRS[name]) press(name, true);
  });
  window.addEventListener("keyup", (e) => {
    const name = KEYMAP[e.key.toLowerCase()];
    if (name) press(name, false);
  });
  window.addEventListener("blur", () => { held.length = 0; });

  document.querySelectorAll(".pad button").forEach((button) => {
    const name = button.dataset.key;
    button.addEventListener("pointerdown", (e) => { e.preventDefault(); press(name, true); });
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) button.addEventListener(type, () => press(name, false));
  });

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointerdown", (e) => {
    begin();
    if (player.riding) return;
    manualPage = false;
    const spot = world.toLocal(e.global);
    const tx = Math.floor(spot.x / TILE);
    const ty = Math.floor(spot.y / TILE);
    const goal = pageOf(tx, ty) ? (x, y) => Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1 : (x, y) => x === tx && y === ty;
    path = findPath(goal) || [];
  });

  function findPath(goal) {
    const key = (x, y) => y * COLS + x;
    const cameFrom = new Map([[key(player.tx, player.ty), null]]);
    const queue = [[player.tx, player.ty]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (goal(x, y)) {
        const steps = [];
        let k = key(x, y);
        while (cameFrom.get(k) !== null) {
          steps.unshift(cameFrom.get(k).move);
          k = cameFrom.get(k).from;
        }
        return steps;
      }
      for (const d of Object.values(DIRS)) {
        const move = walkTo(x, y, d, true);
        if (move && !cameFrom.has(key(move.x, move.y))) {
          cameFrom.set(key(move.x, move.y), { from: key(x, y), move: { ...move, d } });
          queue.push([move.x, move.y]);
        }
      }
    }
    return null;
  }

  const STEP_TIME = 0.16;

  // ladders only go up/down; walking off a ledge drops you below it
  function walkTo(x, y, d, planning = false) {
    if (at(x, y) === "|" && d.x !== 0) return null;
    const nx = x + d.x;
    const ny = y + d.y;
    if (!planning && trainOn(nx, ny)) return trainWaitingHere() ? { x: nx, y: ny, board: true } : null;
    if (isWalkable(nx, ny) && !(at(nx, ny) === "|" && d.x !== 0)) return { x: nx, y: ny, hop: false };
    if (at(nx, ny) === "v" && d.y === 1 && isWalkable(x, y + 2)) return { x, y: y + 2, hop: true };
    return null;
  }

  // mid-jump you can clear one ledge or tile of water
  function airStep(x, y, d) {
    if (isLow(x + d.x, y + d.y) && isWalkable(x + 2 * d.x, y + 2 * d.y) && at(x + 2 * d.x, y + 2 * d.y) !== "|") {
      return { x: x + 2 * d.x, y: y + 2 * d.y, hop: true };
    }
    return walkTo(x, y, d);
  }

  function startMove(move, d) {
    player.facing = d;
    if (move.board) { getOn(); return; }
    player.move = { fromX: player.tx, fromY: player.ty, toX: move.x, toY: move.y, hop: move.hop, t: 0 };
    player.tx = move.x;
    player.ty = move.y;
  }

  function updateMovement(dt) {
    if (player.riding) {
      const p = along(train.s);
      player.px = p.x - TILE / 2;
      player.py = p.y - TILE / 2 - 14;
      player.lift = 0;
      jumpQueued = false;
      return;
    }

    if (jumpQueued && player.air <= 0 && (!player.move || !player.move.hop)) player.air = AIR_TIME;
    jumpQueued = false;
    if (player.air > 0) player.air = Math.max(0, player.air - dt);
    const airLift = player.air > 0 ? Math.sin((1 - player.air / AIR_TIME) * Math.PI) * 26 : 0;

    if (player.move) {
      const m = player.move;
      const duration = m.hop ? STEP_TIME * 2.2 : at(m.toX, m.toY) === "|" ? STEP_TIME * 1.6 : STEP_TIME;
      m.t = Math.min(1, m.t + dt / duration);
      player.px = (m.fromX + (m.toX - m.fromX) * m.t) * TILE;
      player.py = (m.fromY + (m.toY - m.fromY) * m.t) * TILE;
      const hopLift = m.hop && player.air <= 0 ? Math.sin(m.t * Math.PI) * 22 : 0;
      player.lift = Math.max(airLift, hopLift, Math.sin(m.t * Math.PI) * 2);
      if (m.t >= 1) player.move = null;
      return;
    }
    player.lift = airLift;

    const name = held[held.length - 1];
    if (name) {
      const d = DIRS[name];
      const move = player.air > 0 ? airStep(player.tx, player.ty, d) : walkTo(player.tx, player.ty, d);
      if (move) startMove(move, d);
      else player.facing = d;
      return;
    }
    if (path.length && player.air <= 0) {
      const next = path.shift();
      const move = walkTo(player.tx, player.ty, next.d);
      if (move) startMove(move, next.d);
      else path = [];
    }
  }

  const pagesBox = document.getElementById("pages");
  const counter = document.querySelector(".counter");
  const foundCount = document.getElementById("found");
  const total = Object.keys(PAGES).length;
  document.getElementById("total").textContent = total;
  let openPage = null;
  let manualPage = false;

  const saved = (() => { try { return JSON.parse(localStorage.getItem("af-found") || "[]"); } catch { return []; } })();
  const found = new Set(saved);
  const saveFound = () => { try { localStorage.setItem("af-found", JSON.stringify([...found])); } catch {} };

  function pageOf(x, y) {
    return isPageTile(x, y) ? PAGES[at(x, y).toUpperCase()] : null;
  }

  function pageNearby() {
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const page = pageOf(player.tx + dx, player.ty + dy);
      if (page) return page;
    }
    return null;
  }

  const reelId = (link) => (link.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/) || [])[1] || link.trim();
  for (const section of document.querySelectorAll(".page")) {
    const body = document.createElement("div");
    body.className = "body";
    const media = document.createElement("div");
    media.className = "media";
    body.append(media, section.querySelector(".text"));
    section.append(body);
    if ((section.dataset.reel || "").trim()) section.classList.add("with-reel");
  }

  function setMedia(section, on) {
    const media = section.querySelector(".media");
    if (!on) { media.innerHTML = ""; return; }
    const reel = (section.dataset.reel || "").trim();
    media.hidden = !reel;
    if (!reel) return;
    const id = reelId(reel);
    media.innerHTML =
      `<div class="frame reel"><iframe src="https://www.instagram.com/reel/${id}/embed/" title="Instagram reel" loading="lazy" allowfullscreen></iframe></div>` +
      `<p class="media-links"><a href="https://www.instagram.com/reel/${id}/">Instagram</a></p>`;
  }

  function showPage(page) {
    if (page === openPage) return;
    if (openPage) {
      const old = document.getElementById("page-" + openPage.id);
      old.classList.remove("open");
      setMedia(old, false);
    }
    openPage = page;
    pagesBox.classList.toggle("reading", Boolean(page));
    if (!page) return;
    const section = document.getElementById("page-" + page.id);
    section.classList.add("open");
    pagesBox.classList.toggle("wide", section.classList.contains("with-reel"));
    setMedia(section, true);
    pagesBox.scrollTop = 0;
    if (!found.has(page.id)) {
      found.add(page.id);
      saveFound();
      updateCounter();
      buildIndex();
    }
  }

  function updateCounter() {
    foundCount.textContent = found.size;
    if (found.size === total) counter.textContent = "All found";
  }

  const indexBox = document.getElementById("index");
  const indexButton = document.getElementById("index-btn");
  const GROUPS = ["about", "music", "projects"];

  function buildIndex() {
    const list = document.getElementById("index-list");
    list.innerHTML = "";
    for (const group of GROUPS) {
      const box = document.createElement("div");
      box.className = "index-group";
      box.innerHTML = `<h3>${group[0].toUpperCase() + group.slice(1)}</h3><ul></ul>`;
      for (const section of document.querySelectorAll(`.page[data-group="${group}"]`)) {
        const id = section.id.replace("page-", "");
        const li = document.createElement("li");
        if (found.has(id)) {
          const button = document.createElement("button");
          button.textContent = section.querySelector("h2").textContent;
          button.addEventListener("click", () => {
            toggleIndex(false);
            manualPage = true;
            showPage(Object.values(PAGES).find((p) => p.id === id));
          });
          li.append(button);
        } else {
          li.innerHTML = `<span class="locked">Not found yet</span>`;
        }
        box.querySelector("ul").append(li);
      }
      list.append(box);
    }
  }

  function toggleIndex(on) {
    indexBox.hidden = !on;
    indexButton.setAttribute("aria-expanded", on);
    if (on) { showPage(null); hello.classList.add("gone"); }
  }
  indexButton.addEventListener("click", () => toggleIndex(indexBox.hidden));

  buildIndex();
  updateCounter();

  let time = 0;
  const camera = { x: player.px, y: player.py };

  app.ticker.add((ticker) => {
    const dt = Math.min(ticker.deltaMS / 1000, 1 / 20);
    time += dt;

    updateTrain(dt);
    updateMovement(dt);
    for (const animate of animations) animate(reduceMotion ? 0 : time, reduceMotion ? 0 : dt);

    if (!player.move && !player.riding && indexBox.hidden && !manualPage) showPage(pageNearby());

    const onPlatform = STOPS.find((s) => s.platform[0] === player.tx && s.platform[1] === player.ty);
    let message = "";
    if (player.riding) message = "Riding the train";
    else if (onPlatform && trainWaitingHere() === onPlatform) message = "Step onto the train to ride";
    else if (onPlatform && !player.move) message = "Wait here for the train";
    else if (train.blocked) message = "The train is waiting for you";
    hint.hidden = !message;
    hint.textContent = message;

    block.position.set(player.px + TILE / 2, player.py + TILE - 4);
    block.zIndex = player.riding ? 1e6 : player.py + TILE;
    body.y = -player.lift;
    mark.position.set(player.facing.x * 6, -18 + player.facing.y * 5 - player.lift);
    emote.visible = !player.riding && !player.move && player.air <= 0 && pageNearby() !== null;
    emote.y = -34 + Math.sin(time * 5) * 2;

    const w = app.screen.width;
    const h = app.screen.height;
    const zoom = Math.max(0.55, Math.min(1.6, h / (15 * TILE)));
    const viewW = w / zoom;
    const viewH = h / zoom;
    const panel = pagesBox.classList.contains("reading") && w > 760 ? pagesBox.offsetWidth + 40 : 0;
    camera.x += (player.px + TILE / 2 + panel / 2 / zoom - camera.x) * 0.12;
    camera.y += (player.py + TILE / 2 - camera.y) * 0.12;
    const worldW = COLS * TILE;
    const worldH = ROWS * TILE;
    const camX = viewW >= worldW ? worldW / 2 : Math.min(worldW - viewW / 2, Math.max(viewW / 2, camera.x));
    const camY = viewH >= worldH ? worldH / 2 : Math.min(worldH - viewH / 2, Math.max(viewH / 2, camera.y));
    world.scale.set(zoom);
    world.position.set(w / 2 - camX * zoom, h / 2 - camY * zoom);
  });
}
