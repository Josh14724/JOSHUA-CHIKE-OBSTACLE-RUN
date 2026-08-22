const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let dpr = 1;

function resize() {

  dpr = Math.min(devicePixelRatio || 1, 2);

  W = innerWidth;
  H = innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;

  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);

resize();


/* HUD */

const scoreEl = document.getElementById("score");
const coinsEl = document.getElementById("coins");
const speedEl = document.getElementById("speed");

const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");


/* GAME VARIABLES */

let running = false;
let gameOver = false;

let last = 0;

let score = 0;
let coins = 0;

let distance = 0;

/*
  Increase this to make the game faster.
*/
let speed = 1;

let playerLane = 0;
let targetLane = 0;

let jump = 0;
let vy = 0;

let objects = [];


/* THREE LANES */

const lanes = [-1, 0, 1];


/* RESET */

function reset() {

  score = 0;
  coins = 0;

  distance = 0;

  speed = 1;

  playerLane = 0;
  targetLane = 0;

  jump = 0;
  vy = 0;

  objects = [];

  for (let i = 0; i < 18; i++) {

    spawn(i * 0.75 + 1);

  }

  updateHUD();
}


/* CREATE OBSTACLE / COIN */

function spawn(z = 1) {

  const lane =
    lanes[Math.floor(Math.random() * 3)];

  const type =
    Math.random() < 0.58
      ? "obstacle"
      : "coin";

  objects.push({

    lane: lane,

    z: z,

    type: type,

    hit: false,

    rot: Math.random() * 6.28

  });
}


/* 3D PROJECTION */

function project(lane, z) {

  const horizon = H * 0.39;

  const nearY = H * 0.93;

  const t =
    Math.max(
      0,
      Math.min(1, 1 - z)
    );

  const y =
    horizon +
    (nearY - horizon) *
    Math.pow(t, 1.55);

  const roadNear = W * 0.43;
  const roadFar = W * 0.055;

  const half =
    roadFar +
    (roadNear - roadFar) *
    Math.pow(t, 1.05);

  const x =
    W / 2 +
    lane * half * 0.58;

  const scale =
    0.18 +
    1.25 *
    Math.pow(t, 1.35);

  return {
    x,
    y,
    scale
  };
}


/* BACKGROUND */

function drawBackground() {

  const g =
    ctx.createLinearGradient(
      0,
      0,
      0,
      H
    );

  g.addColorStop(
    0,
    "#071326"
  );

  g.addColorStop(
    0.42,
    "#1a3560"
  );

  g.addColorStop(
    1,
    "#0a0d13"
  );

  ctx.fillStyle = g;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* CITY GLOW */

  const rg =
    ctx.createRadialGradient(
      W / 2,
      H * 0.38,
      5,
      W / 2,
      H * 0.38,
      W * 0.45
    );

  rg.addColorStop(
    0,
    "#ffe6a044"
  );

  rg.addColorStop(
    1,
    "#0000"
  );

  ctx.fillStyle = rg;

  ctx.fillRect(
    0,
    0,
    W,
    H * 0.7
  );


  /* BUILDINGS */

  ctx.fillStyle = "#080b10";

  for (let i = 0; i < 16; i++) {

    const x =
      (i < 8
        ? i * W / 8
        : (i - 8) * W / 8);

    const side =
      i < 8 ? -1 : 1;

    const h =
      35 + ((i * 47) % 80);

    ctx.fillRect(

      side < 0
        ? x
        : x + W * 0.88,

      H * 0.42 - h,

      W * 0.12,

      h + H * 0.58
    );
  }
}


/* ROAD */

function drawRoad() {

  const horizon = H * 0.39;

  const bottom = H * 0.98;


  /* ROAD */

  ctx.fillStyle = "#252a33";

  ctx.beginPath();

  ctx.moveTo(
    W / 2 - W * 0.055,
    horizon
  );

  ctx.lineTo(
    W / 2 + W * 0.055,
    horizon
  );

  ctx.lineTo(
    W / 2 + W * 0.43,
    bottom
  );

  ctx.lineTo(
    W / 2 - W * 0.43,
    bottom
  );

  ctx.closePath();

  ctx.fill();


  /* ROAD EDGES */

  ctx.strokeStyle = "#e9edf2";

  ctx.lineWidth = 3;

  for (const s of [-1, 1]) {

    ctx.beginPath();

    ctx.moveTo(
      W / 2 + s * W * 0.055,
      horizon
    );

    ctx.lineTo(
      W / 2 + s * W * 0.43,
      bottom
    );

    ctx.stroke();
  }


  /* MOVING LANE MARKINGS */

  const offset =
    (distance * 0.012) % 1;

  for (const lane of [-0.5, 0.5]) {

    for (let i = 0; i < 14; i++) {

      let z =
        (i / 14 + offset) % 1;

      let a =
        project(0, z);

      let b =
        project(
          0,
          Math.min(1, z + 0.055)
        );

      const halfA =
        (
          W * 0.055 +
          (W * 0.43 - W * 0.055) *
          (1 - z)
        ) * 0.58;

      const x =
        W / 2 +
        lane * halfA * 2;

      ctx.strokeStyle =
        "#ffffffaa";

      ctx.lineWidth =
        Math.max(
          1,
          5 * (1 - z)
        );

      ctx.beginPath();

      ctx.moveTo(x, a.y);

      ctx.lineTo(x, b.y);

      ctx.stroke();
    }
  }
}


/* PLAYER */

function drawPlayer() {

  const p =
    project(
      targetLane,
      0.015
    );

  const y =
    p.y - jump;

  const s =
    Math.max(
      0.75,
      Math.min(1.25, W / 420)
    );

  ctx.save();

  ctx.translate(
    p.x,
    y
  );

  ctx.scale(s, s);


  /* SHADOW */

  ctx.fillStyle = "#0008";

  ctx.beginPath();

  ctx.ellipse(
    0,
    20,
    34,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* BODY */

  ctx.fillStyle = "#e51b23";

  ctx.fillRect(
    -18,
    -55,
    36,
    50
  );


  /* LEGS */

  ctx.fillStyle = "#202634";

  ctx.fillRect(
    -14,
    -6,
    10,
    28
  );

  ctx.fillRect(
    4,
    -6,
    10,
    28
  );


  /* HEAD */

  ctx.fillStyle = "#f1c7a8";

  ctx.beginPath();

  ctx.arc(
    0,
    -72,
    18,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* HAIR */

  ctx.fillStyle = "#111";

  ctx.fillRect(
    -15,
    -87,
    30,
    10
  );


  /* JC */

  ctx.fillStyle = "#fff";

  ctx.font =
    "bold 9px Arial";

  ctx.textAlign = "center";

  ctx.fillText(
    "JC",
    0,
    -28
  );

  ctx.restore();
}


/* COINS + OBSTACLES */

function drawObject(o) {

  const p =
    project(
      o.lane,
      o.z
    );

  ctx.save();

  ctx.translate(
    p.x,
    p.y
  );

  ctx.scale(
    p.scale,
    p.scale
  );


  if (o.type === "coin") {

    o.rot += 0.02;

    ctx.rotate(o.rot);

    ctx.fillStyle =
      "#ffd43b";

    ctx.strokeStyle =
      "#fff1a3";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
      0,
      -25,
      17,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();

    ctx.fillStyle =
      "#9a6500";

    ctx.font =
      "bold 16px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "$",
      0,
      -20
    );

  } else {

    /* OBSTACLE */

    ctx.fillStyle =
      "#f01f2f";

    ctx.fillRect(
      -23,
      -52,
      46,
      52
    );

    ctx.fillStyle =
      "#ffdd43";

    ctx.fillRect(
      -17,
      -43,
      34,
      7
    );

    ctx.fillRect(
      -17,
      -27,
      34,
      7
    );

    ctx.fillStyle =
      "#20242c";

    ctx.fillRect(
      -27,
      -7,
      54,
      10
    );
  }

  ctx.restore();
}


/* GAME UPDATE */

function update(dt) {

  /*
    FAST LANE RESPONSE
  */

  playerLane +=
    (
      targetLane -
      playerLane
    ) *
    Math.min(
      1,
      dt * 30
    );


  /* JUMP */

  if (jump > 0 || vy > 0) {

    vy -= dt * 1800;

    jump += vy * dt;

    if (jump <= 0) {

      jump = 0;
      vy = 0;

    }
  }


  /*
    GAME SPEED

    Increase this value if
    you want the game much faster.
  */

  speed += dt * 0.08;

  const worldSpeed =
    0.55 * speed;

  distance +=
    worldSpeed * dt;


  /* MOVE OBJECTS */

  for (const o of objects) {

    o.z -=
      worldSpeed * dt;

  }


  /* COLLISIONS */

  for (const o of objects) {

    if (
      o.hit ||
      o.z > 0.09 ||
      o.z < 0
    ) continue;


    if (
      Math.abs(
        o.lane -
        playerLane
      ) < 0.38
    ) {

      if (
        o.type === "coin"
      ) {

        o.hit = true;

        coins++;

        score += 100;

      }

      else if (
        jump < 45
      ) {

        endGame();

        return;
      }
    }
  }


  /* REMOVE OLD OBJECTS */

  objects =
    objects.filter(
      o => o.z > -0.08
    );


  /* SPAWN NEW OBJECTS */

  if (
    objects.length < 20
  ) {

    spawn(
      1.05 +
      Math.random() * 0.25
    );
  }


  /* SCORE */

  score +=
    Math.floor(
      dt * speed * 12
    );


  updateHUD();
}


/* HUD UPDATE */

function updateHUD() {

  scoreEl.textContent =
    score;

  coinsEl.textContent =
    coins;

  speedEl.textContent =
    speed.toFixed(1) + "x";
}


/* RENDER */

function render() {

  drawBackground();

  drawRoad();

  objects
    .sort(
      (a, b) =>
        b.z - a.z
    )
    .forEach(
      drawObject
    );

  drawPlayer();
}


/* GAME LOOP */

function loop(t) {

  const dt =
    Math.min(
      0.035,
      (t - last) / 1000 || 0
    );

  last = t;

  if (running) {

    update(dt);

  }

  render();

  requestAnimationFrame(
    loop
  );
}


/* START */

function start() {

  reset();

  running = true;

  gameOver = false;

  message.style.display =
    "none";
}


/* GAME OVER */

function endGame() {

  running = false;

  gameOver = true;

  message.innerHTML = `

    <div class="card">

      <div class="big-logo">
        JC
      </div>

      <h1>
        RUN OVER
      </h1>

      <h2>
        SCORE: ${score}
      </h2>

      <p>
        Coins collected:
        ${coins}
      </p>

      <button id="startBtn">
        RUN AGAIN
      </button>

    </div>
  `;

  message.style.display =
    "grid";

  document
    .getElementById(
      "startBtn"
    )
    .onclick = start;
}


/* LANE MOVEMENT */

function move(dir) {

  if (!running)
    return;

  targetLane =
    Math.max(
      -1,
      Math.min(
        1,
        targetLane + dir
      )
    );
}


/* JUMP */

function doJump() {

  if (!running)
    return;

  if (jump === 0) {

    vy = 760;

  }
}


/* BUTTONS */

document
  .getElementById("leftBtn")
  .onclick = () => move(-1);

document
  .getElementById("rightBtn")
  .onclick = () => move(1);

document
  .getElementById("jumpBtn")
  .onclick = doJump;

startBtn.onclick = start;


/* SWIPE CONTROLS */

let sx = 0;
let sy = 0;

canvas.addEventListener(
  "touchstart",
  e => {

    const t =
      e.changedTouches[0];

    sx = t.clientX;
    sy = t.clientY;

  },
  {
    passive: true
  }
);


canvas.addEventListener(
  "touchend",
  e => {

    const t =
      e.changedTouches[0];

    const dx =
      t.clientX - sx;

    const dy =
      t.clientY - sy;


    if (
      Math.max(
        Math.abs(dx),
        Math.abs(dy)
      ) < 25
    ) {

      doJump();

      return;
    }


    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      move(
        dx > 0
          ? 1
          : -1
      );

    }

    else if (
      dy < 0
    ) {

      doJump();

    }

  },
  {
    passive: true
  }
);


/* KEYBOARD */

addEventListener(
  "keydown",
  e => {

    if (
      e.key === "ArrowLeft" ||
      e.key === "a"
    ) {

      move(-1);

    }

    if (
      e.key === "ArrowRight" ||
      e.key === "d"
    ) {

      move(1);

    }

    if (
      e.key === "ArrowUp" ||
      e.key === " " ||
      e.key === "w"
    ) {

      doJump();

    }

    if (
      e.key === "Enter" &&
      !running
    ) {

      start();

    }

  }
);


/* INITIALIZE */

reset();

requestAnimationFrame(
  loop
);
