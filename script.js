const heroMark = document.querySelector(".hero-mark");
const balloons = Array.from(document.querySelectorAll(".balloon"));
const releaseLayer = document.querySelector(".birthday-balloons");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initSheerMotion() {
  if (!heroMark || !balloons.length) {
    return;
  }

  const tetherLayer = heroMark.querySelector(".tether-layer");
  const sheerWord = document.querySelector(".sheer-word");
  if (!tetherLayer || !sheerWord) {
    return;
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const startTime = performance.now();
  let previousFrame = startTime;
  const motionProfiles = [
    { restAngle: -0.02, stiffness: 1.48, drag: 0.36, pointerWeight: 0.58, windWeight: 0.34, windSpeed: 0.48, secondWind: 0.08, swingScale: 0.86, freeX: 12, bobScale: 0.85, rotationScale: 0.28, velocityRotation: 4.7, maxAngle: 0.46, influenceRadius: 230 },
    { restAngle: 0.012, stiffness: 2.18, drag: 0.56, pointerWeight: 0.42, windWeight: 0.2, windSpeed: 0.7, secondWind: 0.14, swingScale: 0.62, freeX: 4, bobScale: 0.42, rotationScale: 0.2, velocityRotation: 3.5, maxAngle: 0.34, influenceRadius: 190 },
    { restAngle: -0.006, stiffness: 1.72, drag: 0.43, pointerWeight: 0.75, windWeight: 0.28, windSpeed: 0.57, secondWind: 0.1, swingScale: 0.74, freeX: 8, bobScale: 0.7, rotationScale: 0.3, velocityRotation: 5.2, maxAngle: 0.42, influenceRadius: 250 },
    { restAngle: 0.018, stiffness: 2.45, drag: 0.62, pointerWeight: 0.5, windWeight: 0.16, windSpeed: 0.82, secondWind: 0.16, swingScale: 0.56, freeX: 5, bobScale: 0.55, rotationScale: 0.18, velocityRotation: 3.1, maxAngle: 0.32, influenceRadius: 205 },
    { restAngle: -0.014, stiffness: 1.32, drag: 0.32, pointerWeight: 0.88, windWeight: 0.36, windSpeed: 0.43, secondWind: 0.09, swingScale: 0.92, freeX: 14, bobScale: 1.0, rotationScale: 0.34, velocityRotation: 5.8, maxAngle: 0.5, influenceRadius: 270 },
  ];

  const states = balloons.map((balloon, index) => {
    const profile = motionProfiles[index] || motionProfiles.at(-1);
    const path = document.createElementNS(SVG_NS, "path");
    const ring = document.createElementNS(SVG_NS, "circle");
    path.classList.add("tether__line");
    ring.classList.add("tether__ring");
    ring.setAttribute("r", "6");
    tetherLayer.append(path, ring);

    return {
      balloon,
      path,
      ring,
      profile,
      baseLeft: 0,
      width: 0,
      restX: 0,
      restY: 0,
      anchorX: 0,
      anchorY: 0,
      length: 170,
      swingRadius: 120,
      angle: profile.restAngle + (index - 2) * 0.006,
      velocity: 0,
      phase: index * 1.37,
      drift: 1.05 + index * 0.16,
      delay: 120 + index * 130,
      duration: 1120 + index * 70,
    };
  });

  const pointer = {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    previousX: 0,
    previousTime: 0,
  };

  heroMark.addEventListener("pointermove", (event) => {
    const rect = heroMark.getBoundingClientRect();
    const now = performance.now();
    if (!pointer.active) {
      pointer.previousX = event.clientX - rect.left;
      pointer.previousTime = now;
    }
    const dt = Math.max(now - pointer.previousTime, 16);
    pointer.vx = (event.clientX - rect.left - pointer.previousX) / dt;
    pointer.active = true;
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.previousX = pointer.x;
    pointer.previousTime = now;
  });

  heroMark.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.vx = 0;
  });

  function measureCenters() {
    const markHeight = heroMark.offsetHeight;
    tetherLayer.setAttribute("viewBox", `0 0 ${heroMark.offsetWidth} ${markHeight}`);

    states.forEach((state) => {
      const stemX = getComputedStyle(state.balloon).getPropertyValue("--stem-x").trim();
      const stemRatio = stemX.endsWith("%") ? Number.parseFloat(stemX) / 100 : 0.5;
      state.baseLeft = sheerWord.offsetLeft + state.balloon.offsetLeft;
      state.width = state.balloon.offsetWidth;
      state.restX = state.baseLeft + state.width * stemRatio;
      state.restY = sheerWord.offsetTop + state.balloon.offsetTop + state.balloon.offsetHeight * 0.77;
      state.length = clamp((markHeight - state.restY + 42) * 0.44, markHeight * 0.18, markHeight * 0.34);
      state.swingRadius = clamp(state.length * 0.68 * state.profile.swingScale, markHeight * 0.12, markHeight * 0.28);
      state.anchorX = state.restX;
      state.anchorY = state.restY + state.length;
    });
  }

  window.addEventListener("resize", measureCenters);
  measureCenters();

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function drawTether(state, ringX, ringY, progress) {
    const curve = state.angle * state.length * 0.14 + state.velocity * 7;
    const dx = state.anchorX - ringX;
    const dy = state.anchorY - ringY;
    const c1X = ringX + dx * 0.28 + curve;
    const c1Y = ringY + dy * 0.3;
    const c2X = ringX + dx * 0.74 + curve * 0.38;
    const c2Y = ringY + dy * 0.73;

    state.path.setAttribute(
      "d",
      `M${ringX.toFixed(2)} ${ringY.toFixed(2)} C${c1X.toFixed(2)} ${c1Y.toFixed(2)} ${c2X.toFixed(2)} ${c2Y.toFixed(2)} ${state.anchorX.toFixed(2)} ${state.anchorY.toFixed(2)}`,
    );
    state.path.style.opacity = String(clamp(progress * 1.45, 0, 1));
    state.ring.setAttribute("cx", ringX.toFixed(2));
    state.ring.setAttribute("cy", ringY.toFixed(2));
    state.ring.style.opacity = String(clamp(progress * 1.45, 0, 1));
  }

  function keepFramesApart(frames) {
    const isCompact = heroMark.offsetWidth < 560;
    const minGap = isCompact ? 2 : 8;
    const edgeGap = isCompact ? 4 : 12;

    frames.forEach((frame) => {
      const rotationPad = frame.width * (isCompact ? 0.03 : 0.045);
      frame.left = frame.baseLeft + frame.translateX - rotationPad;
      frame.right = frame.baseLeft + frame.translateX + frame.width + rotationPad;
    });

    for (let index = 1; index < frames.length; index += 1) {
      const frame = frames[index];
      const previous = frames[index - 1];
      const overlap = previous.right + minGap - frame.left;

      if (overlap > 0) {
        frame.translateX += overlap;
        frame.ringX += overlap;
        frame.left += overlap;
        frame.right += overlap;
      }
    }

    const overflowRight = frames.at(-1).right - (heroMark.offsetWidth - edgeGap);
    if (overflowRight > 0) {
      frames.forEach((frame) => {
        frame.translateX -= overflowRight;
        frame.ringX -= overflowRight;
        frame.left -= overflowRight;
        frame.right -= overflowRight;
      });
    }

    const overflowLeft = edgeGap - frames[0].left;
    if (overflowLeft > 0) {
      frames.forEach((frame) => {
        frame.translateX += overflowLeft;
        frame.ringX += overflowLeft;
        frame.left += overflowLeft;
        frame.right += overflowLeft;
      });
    }
  }

  function tick(now) {
    const dt = reducedMotion ? 0 : clamp((now - previousFrame) / 1000, 0.008, 0.036);
    previousFrame = now;
    const time = now / 1000;
    const frames = [];

    states.forEach((state) => {
      const intro = reducedMotion ? 1 : clamp((now - startTime - state.delay) / state.duration, 0, 1);
      const introEase = easeOutCubic(intro);

      if (!reducedMotion) {
        const currentRingX = state.restX + Math.sin(state.angle) * state.swingRadius;
        const currentRingY = state.restY + (1 - Math.cos(state.angle)) * state.swingRadius * 0.35;
        const dx = pointer.x - currentRingX;
        const dy = pointer.y - currentRingY;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? Math.max(0, 1 - distance / state.profile.influenceRadius) : 0;
        const pointerForce = (clamp(dx / 120, -1.8, 1.8) * 4.2 + pointer.vx * 1.85) * influence * state.profile.pointerWeight;
        const windForce = Math.sin(time * state.profile.windSpeed + state.phase) * state.profile.windWeight * state.drift
          + Math.sin(time * (state.profile.windSpeed * 0.44) + state.phase * 1.9) * state.profile.secondWind;
        const liftForce = clamp(-dy / 220, -0.8, 0.8) * influence;
        const restAngle = state.profile.restAngle * introEase;
        const acceleration = -state.profile.stiffness * (state.angle - restAngle)
          - state.profile.drag * state.velocity
          + (windForce + pointerForce + liftForce) * introEase;

        state.velocity += acceleration * dt;
        state.velocity = clamp(state.velocity, -3.8, 3.8);
        state.angle += state.velocity * dt;

        if (Math.abs(state.angle) > state.profile.maxAngle) {
          state.angle = Math.sign(state.angle) * state.profile.maxAngle;
          state.velocity *= -0.32;
        }
      }

      const freeX = Math.sin(time * (0.72 + state.profile.windSpeed * 0.95) + state.phase * 1.73)
        * state.profile.freeX
        * introEase;
      const ringX = state.restX + Math.sin(state.angle) * state.swingRadius * introEase + freeX;
      const ringY = state.restY + (1 - Math.cos(state.angle)) * state.swingRadius * 0.35 * introEase;
      const bob = Math.sin(time * (0.92 + state.profile.windSpeed * 0.34) + state.phase * 1.4) * 3.8 * state.profile.bobScale * introEase;
      const rise = 74 * (1 - introEase);
      const translateX = ringX - state.restX;
      const translateY = ringY - state.restY + bob + rise;
      const rotation = ((state.angle * 180) / Math.PI * state.profile.rotationScale + state.velocity * state.profile.velocityRotation) * introEase;

      frames.push({
        state,
        baseLeft: state.baseLeft,
        width: state.width,
        ringX,
        ringY: ringY + bob + rise,
        translateX,
        translateY,
        rotation,
        intro,
        introEase,
      });
    });

    keepFramesApart(frames);

    frames.forEach((frame) => {
      frame.state.balloon.style.transform = `translate3d(${frame.translateX.toFixed(2)}px, ${frame.translateY.toFixed(2)}px, 0) rotate(${frame.rotation.toFixed(2)}deg)`;
      frame.state.balloon.style.opacity = String(clamp(frame.intro * 1.45, 0, 1));
      drawTether(frame.state, frame.ringX, frame.ringY, frame.introEase);
    });

    if (!reducedMotion) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

initSheerMotion();

function initBirthdayBalloons() {
  if (!releaseLayer || reducedMotion) {
    return;
  }

  const colors = ["#ffb2ba", "#ffd578", "#70a2df", "#3556d3", "#78c8b8", "#f34d12"];
  let burstIndex = 0;

  function makeBalloon(x, y, index) {
    const balloon = document.createElement("span");
    const size = 34 + ((burstIndex + index) % 4) * 8;
    const drift = (index - 1.5) * 42 + (Math.random() - 0.5) * 28;
    const rise = Math.min(window.innerHeight * 0.58, 420) + Math.random() * 90;
    const rotate = (Math.random() - 0.5) * 20;
    const color = colors[(burstIndex + index) % colors.length];

    balloon.className = "released-balloon";
    balloon.style.setProperty("--release-x", `${x}px`);
    balloon.style.setProperty("--release-y", `${y}px`);
    balloon.style.setProperty("--release-size", `${size}px`);
    balloon.style.setProperty("--release-color", color);
    releaseLayer.append(balloon);

    const animation = balloon.animate(
      [
        { opacity: 0, transform: "translate3d(-50%, 16px, 0) rotate(0deg)" },
        { opacity: 1, transform: `translate3d(calc(-50% + ${drift * 0.12}px), -30px, 0) rotate(${rotate * 0.28}deg)`, offset: 0.08 },
        { opacity: 1, transform: `translate3d(calc(-50% + ${drift * 0.72}px), -${rise * 0.72}px, 0) rotate(${-rotate}deg)`, offset: 0.72 },
        { opacity: 0, transform: `translate3d(calc(-50% + ${drift}px), -${rise}px, 0) rotate(${rotate}deg)` },
      ],
      {
        duration: 2600 + index * 180,
        easing: "cubic-bezier(0.2, 0.72, 0.28, 1)",
        fill: "forwards",
      },
    );

    animation.finished.then(() => balloon.remove()).catch(() => balloon.remove());
  }

  document.querySelector(".hero")?.addEventListener("pointerdown", (event) => {
    const rect = releaseLayer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let index = 0; index < 4; index += 1) {
      makeBalloon(x + (index - 1.5) * 10, y + Math.random() * 16, index);
    }

    burstIndex += 1;
  });
}

initBirthdayBalloons();
