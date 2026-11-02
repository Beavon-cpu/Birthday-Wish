/* =========================================================
   ROMANTIC BIRTHDAY SURPRISE — script.js
   ========================================================= */

/* =========================================================
   ⭐ EDIT HERE: LOGIN CREDENTIALS
   ========================================================= */
const correctNickname ="Lil Pigeon";
const correctPassword="Peekeee";

/* =========================================================
   ⭐ EDIT HERE: BIRTHDAY LETTER MESSAGE (typewriter text)
   ========================================================= */
const birthdayMessage =
    "My Love🤧😩,\n\nToday isn't just your birthday — it's a celebration of the day the world became a little brighter, " +
    "because you were born into it. Every moment with you feels like a dream I never want to wake up from. " +
    "You are my favorite hello and my hardest goodbye. I made this little corner of the internet just for you, " +
    "filled with everything my heart wanted to say. So sit back, smile, and let me take you through it. 🤭🫠" +
    "Happy Birthday, My Favorite Gal.😘";

/* =========================================================
   TASK 2 — MAGIC RINGS ANIMATED BACKGROUND (Three.js + GLSL)
   with an automatic Canvas2D fallback so the rings are ALWAYS
   visible even if the Three.js CDN fails to load or WebGL is
   unavailable. ⭐ EDIT HERE to tweak the look.
   ========================================================= */
const MAGIC_RINGS_CONFIG = {
    color: "#ff8fab",       // primary ring color (pink)
    colorTwo: "#c9b6f5",    // secondary ring color (lavender)
    ringCount: 6,           // number of concentric rings (max 12)
    speed: 0.35,            // overall animation speed
    attenuation: 1.6,       // glow falloff sharpness
    lineThickness: 0.05,    // ring stroke thickness (uv units)
    baseRadius: 0.12,       // radius of the innermost ring (uv units)
    radiusStep: 0.075,      // radius increase per ring
    scaleRate: 0.035,       // amplitude of the pulsing/scaling animation
    opacity: 0.55,          // overall background opacity
    blur: 3,                // soft bloom/glow, in px
    noiseAmount: 0.12,      // amount of grain/noise dithering
    rotation: 0.08,         // per-ring rotation speed
    ringGap: 0.02,          // extra spacing added between rings
    fadeIn: 1.2,            // seconds each ring takes to fade in
    fadeOut: 1.0,           // seconds each ring takes to fade out
    followMouse: true,      // rings drift gently toward the cursor
    mouseInfluence: 0.12,   // how strongly the rings follow the mouse
    hoverScale: 1.08,       // scale applied while the mouse is actively moving
    parallax: 0.05,         // per-ring parallax offset strength
    clickBurst: true,       // spawn an expanding ring flash on click
};

(function initMagicRingsBackground(CONFIG) {
    const canvas = document.getElementById("magic-rings-bg");
    if (!canvas) return;

    const reducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Give the Three.js CDN script a brief window to finish loading
    // (script.js may run slightly before it lands), then decide once
    // whether to run the WebGL/GLSL path or the guaranteed-to-work
    // Canvas2D fallback.
    let attempts = 0;
    const maxAttempts = 20; // ~2s at 100ms each
    (function decideRenderer() {
        if (typeof THREE !== "undefined") {
            try {
                startThreeJsRings(canvas, CONFIG, reducedMotion);
            } catch (err) {
                console.warn("Magic Rings: Three.js path failed, using fallback.", err);
                startCanvas2DRings(canvas, CONFIG, reducedMotion);
            }
            return;
        }
        attempts++;
        if (attempts >= maxAttempts) {
            console.warn("Magic Rings: Three.js unavailable, using Canvas2D fallback.");
            startCanvas2DRings(canvas, CONFIG, reducedMotion);
            return;
        }
        setTimeout(decideRenderer, 100);
    })();
})(MAGIC_RINGS_CONFIG);

/* ---------------------------------------------------------
   PRIMARY RENDERER — Three.js + GLSL shader
   --------------------------------------------------------- */
function startThreeJsRings(canvas, CONFIG, reducedMotion) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.style.filter = `blur(${CONFIG.blur}px)`;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    function hexToVec3(hex) {
        const c = new THREE.Color(hex);
        return new THREE.Vector3(c.r, c.g, c.b);
    }

    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColor: { value: hexToVec3(CONFIG.color) },
        uColorTwo: { value: hexToVec3(CONFIG.colorTwo) },
        uRingCount: { value: CONFIG.ringCount },
        uSpeed: { value: CONFIG.speed },
        uAttenuation: { value: CONFIG.attenuation },
        uLineThickness: { value: CONFIG.lineThickness },
        uBaseRadius: { value: CONFIG.baseRadius },
        uRadiusStep: { value: CONFIG.radiusStep },
        uScaleRate: { value: CONFIG.scaleRate },
        uOpacity: { value: CONFIG.opacity },
        uNoiseAmount: { value: CONFIG.noiseAmount },
        uRotation: { value: CONFIG.rotation },
        uRingGap: { value: CONFIG.ringGap },
        uFadeIn: { value: CONFIG.fadeIn },
        uFadeOut: { value: CONFIG.fadeOut },
        uFollowMouse: { value: CONFIG.followMouse ? 1 : 0 },
        uMouseInfluence: { value: CONFIG.mouseInfluence },
        uHoverScale: { value: 1.0 },
        uParallax: { value: CONFIG.parallax },
        uBurstActive: { value: 0 },
        uBurstTime: { value: 0 },
        uBurstPos: { value: new THREE.Vector2(0, 0) },
    };

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform vec3 uColor;
        uniform vec3 uColorTwo;
        uniform float uRingCount;
        uniform float uSpeed;
        uniform float uAttenuation;
        uniform float uLineThickness;
        uniform float uBaseRadius;
        uniform float uRadiusStep;
        uniform float uScaleRate;
        uniform float uOpacity;
        uniform float uNoiseAmount;
        uniform float uRotation;
        uniform float uRingGap;
        uniform float uFadeIn;
        uniform float uFadeOut;
        uniform float uFollowMouse;
        uniform float uMouseInfluence;
        uniform float uHoverScale;
        uniform float uParallax;
        uniform float uBurstActive;
        uniform float uBurstTime;
        uniform vec2 uBurstPos;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
            float aspect = uResolution.x / max(uResolution.y, 1.0);
            vec2 uv = vUv * 2.0 - 1.0;
            uv.x *= aspect;

            vec2 center = vec2(0.0);
            if (uFollowMouse > 0.5) {
                center += uMouse * uMouseInfluence;
            }

            vec3 color = vec3(0.0);
            float alpha = 0.0;
            float cycle = max(uFadeIn + uFadeOut + 1.2, 0.2);
            float denom = max(uRingCount - 1.0, 1.0);

            for (int i = 0; i < 12; i++) {
                float fi = float(i);
                float ringMask = step(fi, uRingCount - 0.5);

                vec2 ringCenter = center + uMouse * uParallax * (fi / max(uRingCount, 1.0));

                float angle = uRotation * uTime + fi * 0.35;
                float ca = cos(angle);
                float sa = sin(angle);
                mat2 rot = mat2(ca, sa, -sa, ca);
                vec2 p = rot * (uv - ringCenter);

                float r = length(p);
                float radius = (uBaseRadius + fi * (uRadiusStep + uRingGap)) * uHoverScale;
                radius += sin(uTime * uSpeed + fi * 1.7) * uScaleRate;

                float dist = abs(r - radius);
                float line = smoothstep(uLineThickness, 0.0, dist);
                line = pow(clamp(line, 0.0, 1.0), uAttenuation);

                float phase = mod(uTime * 0.3 + fi * 0.55, cycle);
                float envelope = smoothstep(0.0, max(uFadeIn, 0.001), phase);
                envelope *= 1.0 - smoothstep(cycle - max(uFadeOut, 0.001), cycle, phase);
                line *= envelope * ringMask;

                float mixT = fi / denom;
                vec3 ringColor = mix(uColor, uColorTwo, mixT);

                color += ringColor * line;
                alpha += line;
            }

            if (uBurstActive > 0.5) {
                vec2 bp = uBurstPos;
                bp.x *= aspect;
                float br = length(uv - bp);
                float burstRadius = uBurstTime * 1.8;
                float burstLine = smoothstep(uLineThickness * 2.5, 0.0, abs(br - burstRadius));
                float burstFade = clamp(1.0 - uBurstTime, 0.0, 1.0);
                vec3 burstColor = mix(uColor, uColorTwo, 0.5);
                color += burstColor * burstLine * burstFade;
                alpha += burstLine * burstFade;
            }

            float grain = (hash(vUv * uResolution.xy + uTime) - 0.5) * uNoiseAmount;
            alpha = clamp(alpha + grain * alpha, 0.0, 1.0);
            alpha *= uOpacity;

            gl_FragColor = vec4(color, alpha);
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    let targetMouse = { x: 0, y: 0 };
    let currentMouse = { x: 0, y: 0 };
    let targetScale = 1;
    let currentScale = 1;
    let lastMoveTime = 0;

    window.addEventListener("mousemove", (e) => {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
        targetScale = CONFIG.hoverScale;
        lastMoveTime = performance.now();
    }, { passive: true });

    let burstActive = false;
    let burstStart = 0;
    const burstDuration = 1.1;

    if (CONFIG.clickBurst) {
        window.addEventListener("click", (e) => {
            burstActive = true;
            burstStart = clock.getElapsedTime();
            uniforms.uBurstPos.value.set(
                (e.clientX / window.innerWidth) * 2 - 1,
                -((e.clientY / window.innerHeight) * 2 - 1)
            );
        }, { passive: true });
    }

    function handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
    }
    window.addEventListener("resize", handleResize);

    handleResize();
    renderer.render(scene, camera);

    function animate() {
        const elapsed = clock.getElapsedTime();
        uniforms.uTime.value = elapsed;

        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.06;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.06;
        uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);

        if (performance.now() - lastMoveTime > 250) targetScale = 1;
        currentScale += (targetScale - currentScale) * 0.08;
        uniforms.uHoverScale.value = currentScale;

        if (burstActive) {
            const t = clock.getElapsedTime() - burstStart;
            uniforms.uBurstTime.value = t;
            uniforms.uBurstActive.value = 1;
            if (t > burstDuration) burstActive = false;
        } else {
            uniforms.uBurstActive.value = 0;
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    if (!reducedMotion) {
        animate();
    }
}

/* ---------------------------------------------------------
   FALLBACK RENDERER — pure Canvas2D
   Kicks in automatically if Three.js/WebGL is unavailable,
   so the rings are ALWAYS visible.
   --------------------------------------------------------- */
function startCanvas2DRings(canvas, CONFIG, reducedMotion) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.filter = `blur(${CONFIG.blur}px)`;

    function hexToRgb(hex) {
        const h = hex.replace("#", "");
        const bigint = parseInt(h, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }
    const c1 = hexToRgb(CONFIG.color);
    const c2 = hexToRgb(CONFIG.colorTwo);
    function lerpColor(t) {
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `${r},${g},${b}`;
    }

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
        w = window.innerWidth;
        h = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    window.addEventListener("mousemove", (e) => {
        targetX = (e.clientX - w / 2) * CONFIG.mouseInfluence;
        targetY = (e.clientY - h / 2) * CONFIG.mouseInfluence;
    }, { passive: true });

    let burst = null;
    if (CONFIG.clickBurst) {
        window.addEventListener("click", (e) => {
            burst = { x: e.clientX, y: e.clientY, t: 0 };
        }, { passive: true });
    }

    const minDim = () => Math.min(w, h);

    function drawFrame(time) {
        ctx.clearRect(0, 0, w, h);

        if (CONFIG.followMouse) {
            mouseX += (targetX - mouseX) * 0.06;
            mouseY += (targetY - mouseY) * 0.06;
        }

        const cx = w / 2 + mouseX;
        const cy = h / 2 + mouseY;
        const t = time / 1000;
        const cycle = Math.max(CONFIG.fadeIn + CONFIG.fadeOut + 1.2, 0.2);

        for (let i = 0; i < CONFIG.ringCount; i++) {
            const px = cx + mouseX * CONFIG.parallax * (i / Math.max(CONFIG.ringCount, 1));
            const py = cy + mouseY * CONFIG.parallax * (i / Math.max(CONFIG.ringCount, 1));

            let radius = (CONFIG.baseRadius + i * (CONFIG.radiusStep + CONFIG.ringGap)) * minDim();
            radius += Math.sin(t * CONFIG.speed + i * 1.7) * CONFIG.scaleRate * minDim();

            const phase = (t * 0.3 + i * 0.55) % cycle;
            let envelope = Math.min(1, phase / Math.max(CONFIG.fadeIn, 0.001));
            const fadeOutStart = cycle - Math.max(CONFIG.fadeOut, 0.001);
            if (phase > fadeOutStart) {
                envelope *= Math.max(0, 1 - (phase - fadeOutStart) / Math.max(CONFIG.fadeOut, 0.001));
            }

            const mixT = i / Math.max(CONFIG.ringCount - 1, 1);
            const rgb = lerpColor(mixT);
            const noiseJitter = (Math.random() - 0.5) * CONFIG.noiseAmount;
            const alpha = Math.max(0, envelope * CONFIG.opacity + noiseJitter * 0.05);

            ctx.beginPath();
            ctx.arc(px, py, Math.max(radius, 0), 0, Math.PI * 2);
            ctx.lineWidth = Math.max(CONFIG.lineThickness * minDim(), 1);
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
            ctx.stroke();
        }

        if (burst) {
            burst.t += 1 / 60;
            const burstRadius = burst.t * minDim() * 0.9;
            const burstFade = Math.max(0, 1 - burst.t);
            if (burstFade > 0) {
                ctx.beginPath();
                ctx.arc(burst.x, burst.y, burstRadius, 0, Math.PI * 2);
                ctx.lineWidth = Math.max(CONFIG.lineThickness * minDim() * 1.5, 1);
                ctx.strokeStyle = `rgba(${lerpColor(0.5)}, ${burstFade * 0.9})`;
                ctx.stroke();
            } else {
                burst = null;
            }
        }

        if (!reducedMotion) {
            requestAnimationFrame(drawFrame);
        }
    }

    requestAnimationFrame(drawFrame);
}

/* =========================================================
   MOBILE VIEWPORT FIX
   Mobile browsers change the visible viewport height as their
   address bar / home-indicator show or hide, but 100vh doesn't
   account for that — which is what was hiding the floating
   buttons and clipping full-screen photos below the fold. This
   keeps a --app-height custom property in sync with the real,
   currently-visible height at all times.
   ========================================================= */
function setAppHeight() {
    document.documentElement.style.setProperty("--app-height", window.innerHeight + "px");
}
setAppHeight();
window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", () => setTimeout(setAppHeight, 250));
if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setAppHeight);
}

/* =========================================================
   GLOBAL HELPERS
   ========================================================= */
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
    $all(".screen").forEach((s) => s.classList.remove("active-screen"));
    const target = $(`#${id}`);
    if (target) target.classList.add("active-screen");
    if (typeof syncFloatingNextBtn === "function") syncFloatingNextBtn();
    if (typeof syncFloatingBackBtn === "function") syncFloatingBackBtn();
}

/* =========================================================
   FLOATING HEARTS (continuous ambient background)
   ========================================================= */
const heartsContainer = $("#floating-hearts-container");
const heartEmojis = ["❤️", "💕", "💗", "💖", "💘", "💞"];

function spawnFloatingHeart() {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    const startX = Math.random() * 100;
    const drift = (Math.random() * 140 - 70) + "px";
    const duration = 6 + Math.random() * 6;
    const size = 1 + Math.random() * 1.4;

    heart.style.left = startX + "vw";
    heart.style.setProperty("--drift", drift);
    heart.style.animationDuration = duration + "s";
    heart.style.fontSize = size + "rem";

    heartsContainer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
}
setInterval(spawnFloatingHeart, 700);

/* =========================================================
   SPARKLES (ambient twinkle)
   ========================================================= */
const sparklesContainer = $("#sparkles-container");

function spawnSparkle() {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "vw";
    sparkle.style.top = Math.random() * 100 + "vh";
    sparklesContainer.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2300);
}
setInterval(spawnSparkle, 480);

/* =========================================================
   SHOOTING STARS
   ========================================================= */
const starsContainer = $("#shooting-stars-container");

function spawnShootingStar() {
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.left = 60 + Math.random() * 35 + "vw";
    star.style.top = Math.random() * 40 + "vh";
    starsContainer.appendChild(star);
    setTimeout(() => star.remove(), 2500);
}
setInterval(spawnShootingStar, 2600);

/* =========================================================
   COVER SCREEN — extra petal/sparkle burst ambience
   ========================================================= */
const coverPetalEmojis = ["🌸", "✨", "💗", "💫"];
function spawnCoverPetal() {
    const loginScreen = $("#login-screen");
    if (!loginScreen || !loginScreen.classList.contains("active-screen")) return;
    const petal = document.createElement("span");
    petal.className = "cover-petal";
    petal.textContent = coverPetalEmojis[Math.floor(Math.random() * coverPetalEmojis.length)];
    petal.style.left = Math.random() * 100 + "vw";
    petal.style.animationDuration = (7 + Math.random() * 5) + "s";
    petal.style.fontSize = (1 + Math.random() * 1) + "rem";
    loginScreen.appendChild(petal);
    setTimeout(() => petal.remove(), 12500);
}
setInterval(spawnCoverPetal, 1100);

/* =========================================================
   1. LOGIN SCREEN LOGIC
   ========================================================= */
const loginForm = $("#login-form");
const loginError = $("#login-error");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nickname = $("#nickname-input").value.trim();
    const password = $("#password-input").value.trim();

    if (nickname === correctNickname && password === correctPassword) {
        loginError.textContent = "";
        showScreen("loading-screen");
        startLoadingSequence();
        attemptAutoplay();
    } else {
        loginError.textContent = "Oops love, that's not your secret nickname 🤭";
        $(".login-card").style.animation = "none";
        requestAnimationFrame(() => {
            $(".login-card").style.animation = "shake 0.5s ease";
        });
    }
});

/* small shake keyframe injected dynamically */
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}`;
document.head.appendChild(shakeStyle);

/* =========================================================
   2. LOADING SCREEN LOGIC
   ========================================================= */
function startLoadingSequence() {
    const bar = $("#progress-bar");
    bar.style.width = "0%";
    let progress = 0;
    const totalDuration = 4000;
    const stepTime = 50;
    const steps = totalDuration / stepTime;
    const increment = 100 / steps;

    const interval = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                // NEW: loading now leads into the "For You" flower page,
                // which then leads into the heartfelt letter.
                navStack.push("login");
                enterForYou();
            }, 400);
        }
        bar.style.width = progress + "%";
    }, stepTime);
}

/* =========================================================
   NAVIGATION HISTORY (powers the new Back button)
   Each animated page/stage has: a timer bucket (cleared on
   leave, forwards or backwards) and an enter*() function that
   resets it to its original state before showing it. This
   guarantees the Back button always works cleanly, with no
   leaked timers and no duplicated listeners.
   ========================================================= */
let navStack = [];

const foryouTimers = [];
const imgSeqTimers = { 1: [], 2: [] };
const cakeTimers = [];
const wishesTimers = [];
const closingTimers = [];
let typewriterTimerId = null;

let foryouReady = false;
const imgReady = { 1: false, 2: false };
let cakeReady = false;

function clearTimerBucket(bucket) {
    bucket.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
    });
    bucket.length = 0;
}

function clearAllActiveTimers() {
    clearTimerBucket(foryouTimers);
    clearTimerBucket(imgSeqTimers[1]);
    clearTimerBucket(imgSeqTimers[2]);
    clearTimerBucket(cakeTimers);
    clearTimerBucket(wishesTimers);
    clearTimerBucket(closingTimers);
    if (typewriterTimerId) {
        clearTimeout(typewriterTimerId);
        typewriterTimerId = null;
    }
}

function goBack() {
    if (navStack.length === 0) return;
    clearAllActiveTimers();
    const prevKey = navStack.pop();
    switch (prevKey) {
        case "login":
            showScreen("login-screen");
            break;
        case "foryou":
            enterForYou();
            break;
        case "message":
            enterMessage();
            break;
        case "gift1":
            enterGifts(1);
            break;
        case "gift2":
            enterGifts(2);
            break;
        case "gift3":
            enterGifts(3);
            break;
        case "wishes":
            enterWishes();
            break;
        default:
            break;
    }
    syncFloatingNextBtn();
    syncFloatingBackBtn();
}

/* =========================================================
   NEW: "FOR YOU" FLOWER PAGE
   ========================================================= */
function resetForYouPage() {
    clearTimerBucket(foryouTimers);
    foryouReady = false;
    const big = $("#big-flower");
    if (big) big.classList.remove("active", "pulsing");
    const container = $("#small-flowers-container");
    if (container) container.innerHTML = "";
    const trigger = $("#foryou-btn");
    if (trigger) trigger.style.display = "";
}

function enterForYou() {
    resetForYouPage();
    showScreen("foryou-screen");
}

function pickFlowerOrigin() {
    // Weighted toward the full top edge (including upper-right) for denser,
    // more natural top-down coverage, while still keeping some corner rain.
    if (Math.random() < 0.45) {
        return { x: (Math.random() * 130 - 15) + "vw", y: "-15vh" };
    }
    const corners = [
        { x: "-15vw", y: "-15vh" },
        { x: "115vw", y: "-15vh" },
        { x: "-15vw", y: "115vh" },
        { x: "115vw", y: "115vh" },
    ];
    return corners[Math.floor(Math.random() * corners.length)];
}

function spawnSmallFlower(container) {
    const origin = pickFlowerOrigin();
    const span = document.createElement("span");
    span.className = "small-flower";
    span.textContent = Math.random() < 0.5 ? "🌸" : "🌺";
    const ex = (2 + Math.random() * 96) + "vw";
    const ey = (2 + Math.random() * 96) + "vh";
    span.style.setProperty("--sx", origin.x);
    span.style.setProperty("--sy", origin.y);
    span.style.setProperty("--ex", ex);
    span.style.setProperty("--ey", ey);
    span.style.animationDelay = (Math.random() * 1.1) + "s";
    span.style.fontSize = (1 + Math.random() * 1.6) + "rem";
    container.appendChild(span);

    span.addEventListener("animationend", function onEnd(e) {
        if (e.animationName === "flowerRainIn") {
            span.classList.add("settled");
            span.removeEventListener("animationend", onEnd);
        }
    });
}

function startSmallFlowerRain() {
    const container = $("#small-flowers-container");
    if (!container) return;
    container.innerHTML = "";
    // Denser coverage; scaled down a bit on small phones for performance.
    const count = window.innerWidth < 600 ? 46 : 70;
    for (let i = 0; i < count; i++) {
        spawnSmallFlower(container);
    }
    const readyTimer = setTimeout(() => {
        foryouReady = true;
        syncFloatingNextBtn();
    }, 10000);
    foryouTimers.push(readyTimer);
}

function startForYouSequence() {
    const trigger = $("#foryou-btn");
    const big = $("#big-flower");
    if (!big) return;
    if (trigger) trigger.style.display = "none";

    big.classList.add("active");

    const zoomDoneTimer = setTimeout(() => {
        big.classList.add("pulsing");
        const stage1Timer = setTimeout(() => {
            big.classList.remove("pulsing");
            startSmallFlowerRain();
        }, 3000);
        foryouTimers.push(stage1Timer);
    }, 1800);
    foryouTimers.push(zoomDoneTimer);
}

const foryouBtn = $("#foryou-btn");
if (foryouBtn) foryouBtn.addEventListener("click", startForYouSequence);

const foryouContinueBtn = $("#foryou-continue-btn");
if (foryouContinueBtn) {
    foryouContinueBtn.addEventListener("click", () => {
        if (!foryouReady) return;
        navStack.push("foryou");
        enterMessage();
    });
}

/* =========================================================
   3. TYPEWRITER MESSAGE
   ========================================================= */
function startTypewriter() {
    const target = $("#typewriter-text");
    target.textContent = "";
    let i = 0;
    const speed = 28;

    function typeChar() {
        if (i < birthdayMessage.length) {
            target.textContent += birthdayMessage.charAt(i);
            i++;
            typewriterTimerId = setTimeout(typeChar, speed);
        } else {
            typewriterTimerId = null;
        }
    }
    typeChar();
}

function enterMessage() {
    if (typewriterTimerId) {
        clearTimeout(typewriterTimerId);
        typewriterTimerId = null;
    }
    $("#typewriter-text").textContent = "";
    showScreen("message-screen");
    startTypewriter();
}

$("#continue-btn").addEventListener("click", () => {
    navStack.push("message");
    enterGifts(1);
});

/* =========================================================
   4. GIFTS SECTION LOGIC
   ========================================================= */
function resetImageStage(n) {
    clearTimerBucket(imgSeqTimers[n]);
    imgReady[n] = false;
    const box = $(`#gift-box-${n}`);
    const reveal = $(`#gift-reveal-${n}`);
    if (box) box.classList.remove("opened");
    if (reveal) reveal.classList.remove("revealed", "img-fullscreen", "img-half", "img-sliding", "page-flip-out");
    const openBtn = $(`#gift-stage-${n} .open-gift-btn`);
    const nextBtn = $(`#gift-stage-${n} .next-gift-btn`);
    if (openBtn) openBtn.style.display = "inline-block";
    if (nextBtn) nextBtn.style.display = "none";
}

function resetCakeStage() {
    clearTimerBucket(cakeTimers);
    cakeReady = false;
    const box = $("#gift-box-3");
    const reveal = $("#gift-reveal-3");
    if (box) box.classList.remove("opened");
    if (reveal) reveal.classList.remove("revealed", "img-fullscreen", "cake-cut-flash");
    const openBtn = $("#gift-stage-3 .open-gift-btn");
    if (openBtn) openBtn.style.display = "inline-block";
    const celebrateBtn = $("#celebrate-btn");
    const cutBtn = $("#cut-cake-btn");
    const finalBtn = $("#final-surprise-btn");
    if (celebrateBtn) celebrateBtn.style.display = "none";
    if (cutBtn) cutBtn.style.display = "none";
    if (finalBtn) finalBtn.style.display = "none";
    const message = $("#cake-message");
    if (message) message.style.display = "none";

    // Remove any in-flight celebration effects and the cake-cutting overlay
    const balloonLayer = $("#celebration-balloons");
    if (balloonLayer) balloonLayer.innerHTML = "";
    const flowerLayer = $("#celebration-flowers");
    if (flowerLayer) flowerLayer.innerHTML = "";
    if (cakeCutOverlayEl) {
        cakeCutOverlayEl.remove();
        cakeCutOverlayEl = null;
    }
    const revealImg = document.querySelector("#gift-reveal-3 .cake-wrap img");
    if (revealImg) revealImg.style.opacity = "";
    const flame = document.querySelector("#gift-reveal-3 .candle-flame");
    if (flame) flame.style.opacity = "";
}

function resetGiftStage(n) {
    if (n === 3) {
        resetCakeStage();
    } else {
        resetImageStage(n);
    }
}

function enterGifts(stageNum) {
    resetGiftStage(1);
    resetGiftStage(2);
    resetGiftStage(3);
    $all(".gift-stage").forEach((stage) => (stage.dataset.active = "false"));
    $(`#gift-stage-${stageNum}`).dataset.active = "true";
    showScreen("gifts-screen");
}

function startImageSequence(n) {
    const reveal = $(`#gift-reveal-${n}`);
    if (!reveal) return;
    reveal.classList.add("img-fullscreen");

    const holdTimer = setTimeout(() => {
        reveal.classList.remove("img-fullscreen");
        reveal.classList.add("img-half", "img-sliding");
        const slideTimer = setTimeout(() => {
            imgReady[n] = true;
            const nextBtn = $(`#gift-stage-${n} .next-gift-btn`);
            if (nextBtn) nextBtn.style.display = "inline-block";
            syncFloatingNextBtn();
        }, 10000);
        imgSeqTimers[n].push(slideTimer);
    }, 10000);
    imgSeqTimers[n].push(holdTimer);
}

/* ---- NEW: full-screen celebration — balloons + falling flowers together ---- */
function launchCelebrationBalloons() {
    const container = $("#celebration-balloons");
    if (!container) return;
    container.innerHTML = "";
    const count = window.innerWidth < 600 ? 22 : 36;
    for (let i = 0; i < count; i++) {
        const balloon = document.createElement("span");
        balloon.className = "celebration-balloon";
        balloon.textContent = "🎈";
        balloon.style.left = (Math.random() * 96) + "vw";
        const dur = 4 + Math.random() * 3;
        balloon.style.animationDuration = dur + "s";
        balloon.style.animationDelay = (Math.random() * 1.4) + "s";
        balloon.style.fontSize = (1.6 + Math.random() * 1.8) + "rem";
        balloon.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
        balloon.style.filter = `hue-rotate(${Math.floor(Math.random() * 80)}deg)`;
        container.appendChild(balloon);
        const cleanup = setTimeout(() => balloon.remove(), (dur + 1.4) * 1000 + 300);
        cakeTimers.push(cleanup);
    }
}

function launchCelebrationFlowers() {
    const container = $("#celebration-flowers");
    if (!container) return;
    container.innerHTML = "";
    const count = window.innerWidth < 600 ? 40 : 70;
    for (let i = 0; i < count; i++) {
        const flower = document.createElement("span");
        flower.className = "falling-flower";
        flower.textContent = Math.random() < 0.5 ? "🌸" : "🌺";
        flower.style.left = (Math.random() * 100) + "vw";
        const dur = 4 + Math.random() * 4;
        const delay = Math.random() * 2.5;
        flower.style.setProperty("--fdrift", (Math.random() * 30 - 15) + "vw");
        flower.style.animationDuration = dur + "s";
        flower.style.animationDelay = delay + "s";
        flower.style.fontSize = (0.9 + Math.random() * 1.3) + "rem";
        container.appendChild(flower);
        const cleanup = setTimeout(() => flower.remove(), (dur + delay + 0.3) * 1000);
        cakeTimers.push(cleanup);
    }
}

/* ---- NEW: real cake-cutting animation, built from the actual cake image ---- */
let cakeCutOverlayEl = null;

function animateCakeCutting() {
    const revealImg = document.querySelector("#gift-reveal-3 .cake-wrap img");
    const cakeWrap = document.querySelector("#gift-reveal-3 .cake-wrap");
    const reveal = $("#gift-reveal-3");
    if (!revealImg || !cakeWrap || !reveal) return;

    const rect = cakeWrap.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.className = "cake-cut-overlay";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    document.body.appendChild(overlay);
    cakeCutOverlayEl = overlay;

    const sliceCount = 6;
    const src = revealImg.getAttribute("src");
    const travel = Math.max(rect.width, rect.height) * 0.35;
    const toRad = (deg) => (deg * Math.PI) / 180;

    for (let i = 0; i < sliceCount; i++) {
        const startDeg = i * (360 / sliceCount) - 90;
        const endDeg = startDeg + (360 / sliceCount);
        const midDeg = (startDeg + endDeg) / 2;
        const p1x = 50 + 150 * Math.cos(toRad(startDeg));
        const p1y = 50 + 150 * Math.sin(toRad(startDeg));
        const p2x = 50 + 150 * Math.cos(toRad(endDeg));
        const p2y = 50 + 150 * Math.sin(toRad(endDeg));
        const dx = Math.cos(toRad(midDeg)) * travel;
        const dy = Math.sin(toRad(midDeg)) * travel;

        const slice = document.createElement("div");
        slice.className = "cake-slice-piece";
        slice.style.backgroundImage = `url("${src}")`;
        slice.style.backgroundSize = `${rect.width}px ${rect.height}px`;
        slice.style.clipPath = `polygon(50% 50%, ${p1x}% ${p1y}%, ${p2x}% ${p2y}%)`;
        slice.style.setProperty("--dx", dx + "px");
        slice.style.setProperty("--dy", dy + "px");
        slice.style.setProperty("--rot", (Math.random() * 30 - 15).toFixed(1) + "deg");
        slice.style.transitionDelay = (i * 60) + "ms";
        overlay.appendChild(slice);
    }

    revealImg.style.opacity = "0";
    const flame = document.querySelector("#gift-reveal-3 .candle-flame");
    if (flame) flame.style.opacity = "0";

    reveal.classList.add("cake-cut-flash");
    const flashTimer = setTimeout(() => reveal.classList.remove("cake-cut-flash"), 600);
    cakeTimers.push(flashTimer);

    const cutTimer = setTimeout(() => {
        overlay.querySelectorAll(".cake-slice-piece").forEach((s) => s.classList.add("cut"));
    }, 80);
    cakeTimers.push(cutTimer);

    const messageTimer = setTimeout(() => {
        const message = $("#cake-message");
        if (message) message.style.display = "block";
        const readyTimer = setTimeout(() => {
            cakeReady = true;
            const finalBtn = $("#final-surprise-btn");
            if (finalBtn) finalBtn.style.display = "inline-block";
            syncFloatingNextBtn();
        }, 6000);
        cakeTimers.push(readyTimer);
    }, 900);
    cakeTimers.push(messageTimer);
}

function startCakeSequence() {
    const reveal = $("#gift-reveal-3");
    if (!reveal) return;
    reveal.classList.add("img-fullscreen");

    const holdTimer = setTimeout(() => {
        reveal.classList.remove("img-fullscreen");
        const celebrateBtn = $("#celebrate-btn");
        if (celebrateBtn) celebrateBtn.style.display = "inline-block";
        syncFloatingNextBtn();
    }, 4000);
    cakeTimers.push(holdTimer);
}

$all(".open-gift-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const giftNum = btn.dataset.gift;
        const box = $(`#gift-box-${giftNum}`);
        const reveal = $(`#gift-reveal-${giftNum}`);

        box.classList.add("opened");
        spawnSparkleBurst($(`#gift-stage-${giftNum}`));

        setTimeout(() => {
            reveal.classList.add("revealed");
            btn.style.display = "none";

            if (giftNum === "3") {
                startCakeSequence();
            } else {
                startImageSequence(giftNum);
            }
            syncFloatingNextBtn();
            syncFloatingBackBtn();
        }, 500);
    });
});

$all(".next-gift-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const stageEl = btn.closest(".gift-stage");
        const currentStage = stageEl.id.replace("gift-stage-", "");
        const nextId = btn.dataset.next;
        const reveal = $(`#gift-reveal-${currentStage}`);

        if (reveal) reveal.classList.add("page-flip-out");

        const flipTimer = setTimeout(() => {
            navStack.push(`gift${currentStage}`);
            enterGifts(parseInt(nextId, 10));
        }, 750);
        imgSeqTimers[currentStage] ? imgSeqTimers[currentStage].push(flipTimer) : null;
    });
});

$("#celebrate-btn").addEventListener("click", () => {
    $("#celebrate-btn").style.display = "none";
    launchCelebrationBalloons();
    launchCelebrationFlowers();
    launchConfetti();
    const cutBtn = $("#cut-cake-btn");
    const showCutBtnTimer = setTimeout(() => {
        if (cutBtn) cutBtn.style.display = "inline-block";
        syncFloatingNextBtn();
    }, 5000);
    cakeTimers.push(showCutBtnTimer);
});

$("#cut-cake-btn").addEventListener("click", () => {
    $("#cut-cake-btn").style.display = "none";
    animateCakeCutting();
    syncFloatingNextBtn();
});

$("#final-surprise-btn").addEventListener("click", () => {
    // Make the cake (and any leftover celebration effects) disappear immediately
    if (cakeCutOverlayEl) {
        cakeCutOverlayEl.remove();
        cakeCutOverlayEl = null;
    }
    const balloonLayer = $("#celebration-balloons");
    if (balloonLayer) balloonLayer.innerHTML = "";
    const flowerLayer = $("#celebration-flowers");
    if (flowerLayer) flowerLayer.innerHTML = "";

    navStack.push("gift3");
    enterWishes();
});

function spawnSparkleBurst(el) {
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
        const sparkle = document.createElement("span");
        sparkle.className = "sparkle";
        sparkle.style.left = rect.left + Math.random() * rect.width + "px";
        sparkle.style.top = rect.top + Math.random() * rect.height + "px";
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2300);
    }
}

/* =========================================================
   CONFETTI EXPLOSION (canvas based)
   ========================================================= */
const confettiCanvas = $("#confetti-canvas");
const ctx = confettiCanvas.getContext("2d");
function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const confettiColors = ["#ff8fab", "#c9b6f5", "#f3d27a", "#fff7fb", "#ffb6c1"];

function launchConfetti() {
    const pieces = [];
    const count = 140;
    for (let i = 0; i < count; i++) {
        pieces.push({
            x: confettiCanvas.width / 2,
            y: confettiCanvas.height / 2,
            vx: (Math.random() - 0.5) * 14,
            vy: Math.random() * -14 - 4,
            size: 5 + Math.random() * 6,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            gravity: 0.32,
            life: 0,
            maxLife: 130 + Math.random() * 40,
        });
    }

    function animateConfetti() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        let alive = false;

        pieces.forEach((p) => {
            if (p.life > p.maxLife) return;
            alive = true;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            p.life++;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            ctx.restore();
        });

        if (alive) {
            requestAnimationFrame(animateConfetti);
        } else {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }
    animateConfetti();
}

/* =========================================================
   5. FUTURE WISHES — fade in one by one
   ========================================================= */
function resetWishes() {
    clearTimerBucket(wishesTimers);
    $all("#wishes-list li").forEach((li) => li.classList.remove("show"));
}

function animateWishes() {
    const items = $all("#wishes-list li");
    items.forEach((li) => li.classList.remove("show"));
    items.forEach((li, i) => {
        const t = setTimeout(() => li.classList.add("show"), 500 + i * 650);
        wishesTimers.push(t);
    });
}

function enterWishes() {
    resetWishes();
    showScreen("wishes-screen");
    animateWishes();
}

$("#onelast-btn").addEventListener("click", () => {
    showScreen("closing-screen");
    const closingText = $("#closing-text");
    closingText.style.animation = "none";
    requestAnimationFrame(() => {
        closingText.style.animation = "slowFadeIn 2.4s ease forwards";
    });
});

/* =========================================================
   6. CLOSING MESSAGE -> FINAL POPUP
   ========================================================= */
function closeFinalPopup() {
    const popupCard = document.querySelector("#final-popup-overlay .final-popup");
    if (popupCard) popupCard.classList.remove("blinking");
    $("#final-popup-overlay").classList.remove("show");
    bgMusic.pause();
    bgMusic.currentTime = 0;
    playPauseBtn.textContent = "▶";
    resetExperience();
    showScreen("login-screen");
}

$("#forever-btn").addEventListener("click", () => {
    $("#final-popup-overlay").classList.add("show");
    heartBurstExplosion();
    syncFloatingNextBtn();

    // "I love you endlessly" is shown for 4s, then blinks and disappears
    // automatically — music stops and the login screen returns on its own.
    const holdTimer = setTimeout(() => {
        const popupCard = document.querySelector("#final-popup-overlay .final-popup");
        if (popupCard) popupCard.classList.add("blinking");
        const blinkTimer = setTimeout(closeFinalPopup, 700);
        closingTimers.push(blinkTimer);
    }, 4000);
    closingTimers.push(holdTimer);
});

$("#close-popup-btn").addEventListener("click", () => {
    clearTimerBucket(closingTimers);
    closeFinalPopup();
});

/* =========================================================
   RESET
   ========================================================= */
function resetExperience() {
    loginForm.reset();
    loginError.textContent = "";

    clearAllActiveTimers();
    navStack = [];

    resetForYouPage();
    resetGiftStage(1);
    resetGiftStage(2);
    resetGiftStage(3);
    resetWishes();

    $all(".gift-stage").forEach((stage) => (stage.dataset.active = "false"));
    $("#gift-stage-1").dataset.active = "true";

    $("#typewriter-text").textContent = "";

    syncFloatingNextBtn();
    syncFloatingBackBtn();
}

/* =========================================================
   HEART BURST EXPLOSION EFFECT
   ========================================================= */
function heartBurstExplosion() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const emojis = ["❤️", "💕", "💖", "💗", "💘"];

    for (let i = 0; i < 26; i++) {
        const piece = document.createElement("span");
        piece.className = "heart-burst-piece";
        piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = 120 + Math.random() * 220;
        const bx = Math.cos(angle) * distance + "px";
        const by = Math.sin(angle) * distance + "px";

        piece.style.left = centerX + "px";
        piece.style.top = centerY + "px";
        piece.style.setProperty("--bx", bx);
        piece.style.setProperty("--by", by);

        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 1500);
    }
}

/* =========================================================
   MUSIC BAR CONTROLS
   ========================================================= */
const bgMusic = $("#bg-music");
const playPauseBtn = $("#play-pause-btn");
const volUpBtn = $("#vol-up-btn");
const volDownBtn = $("#vol-down-btn");

bgMusic.volume = 0.6;

let resumeOnInteractHandler = null;

function clearPendingAutoplayResume() {
    if (resumeOnInteractHandler) {
        document.removeEventListener("click", resumeOnInteractHandler);
        resumeOnInteractHandler = null;
    }
}

function attemptAutoplay() {
    clearPendingAutoplayResume();
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                playPauseBtn.textContent = "⏸";
            })
            .catch(() => {
                playPauseBtn.textContent = "▶";
                resumeOnInteractHandler = () => {
                    bgMusic.play();
                    playPauseBtn.textContent = "⏸";
                    clearPendingAutoplayResume();
                };
                document.addEventListener("click", resumeOnInteractHandler, { once: true });
            });
    }
}

function stopMusic() {
    clearPendingAutoplayResume();
    bgMusic.pause();
    bgMusic.currentTime = 0;
    playPauseBtn.textContent = "▶";
}

playPauseBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
        bgMusic.play();
        playPauseBtn.textContent = "⏸";
    } else {
        bgMusic.pause();
        playPauseBtn.textContent = "▶";
    }
});

volUpBtn.addEventListener("click", () => {
    bgMusic.volume = Math.min(1, bgMusic.volume + 0.1);
});

volDownBtn.addEventListener("click", () => {
    bgMusic.volume = Math.max(0, bgMusic.volume - 0.1);
});

window.addEventListener("beforeunload", () => {
    bgMusic.pause();
});

/* =========================================================
   FLOATING "NEXT" BUTTON (also serves as "Continue My Gal")
   ========================================================= */
const floatingNextBtn = $("#floating-next-btn");
const floatingNextLabel = $(".floating-next-label");

function getCurrentPrimaryAction() {
    const active = document.querySelector(".screen.active-screen");
    if (!active) return null;

    switch (active.id) {
        case "foryou-screen": {
            if (!foryouReady) return null;
            return { el: $("#foryou-continue-btn"), label: "Continue My Gal" };
        }

        case "message-screen":
            return { el: $("#continue-btn"), label: "Continue" };

        case "gifts-screen": {
            const stage = document.querySelector('.gift-stage[data-active="true"]');
            if (!stage) return null;
            const stageNum = stage.id.replace("gift-stage-", "");
            const openBtn = stage.querySelector(".open-gift-btn");

            if (openBtn && openBtn.style.display !== "none") {
                return { el: openBtn, label: "Open Gift" };
            }

            if (stageNum === "3") {
                const celebrateBtn = $("#celebrate-btn");
                const cutBtn = $("#cut-cake-btn");
                const finalBtn = $("#final-surprise-btn");
                if (celebrateBtn && celebrateBtn.style.display !== "none") {
                    return { el: celebrateBtn, label: "Celebrate" };
                }
                if (cutBtn && cutBtn.style.display !== "none") {
                    return { el: cutBtn, label: "Cut the Cake" };
                }
                if (finalBtn && finalBtn.style.display !== "none") {
                    return { el: finalBtn, label: "Continue My Gal" };
                }
                return null;
            }

            const nextBtn = stage.querySelector(".next-gift-btn");
            if (nextBtn && nextBtn.style.display !== "none") {
                return { el: nextBtn, label: "Continue My Gal" };
            }
            return null;
        }

        case "wishes-screen":
            return { el: $("#onelast-btn"), label: "One Last Thing" };

        case "closing-screen": {
            const popup = $("#final-popup-overlay");
            if (popup && popup.classList.contains("show")) {
                return { el: $("#close-popup-btn"), label: "Close" };
            }
            return { el: $("#forever-btn"), label: "Forever Yours" };
        }

        default:
            return null;
    }
}

function syncFloatingNextBtn() {
    if (!floatingNextBtn) return;
    const action = getCurrentPrimaryAction();
    if (action && action.el) {
        floatingNextBtn.classList.add("visible");
        if (floatingNextLabel) floatingNextLabel.textContent = action.label;
    } else {
        floatingNextBtn.classList.remove("visible");
    }
}

if (floatingNextBtn) {
    floatingNextBtn.addEventListener("click", () => {
        const action = getCurrentPrimaryAction();
        if (action && action.el) {
            floatingNextBtn.classList.add("pulse-tap");
            setTimeout(() => floatingNextBtn.classList.remove("pulse-tap"), 350);
            action.el.click();
        }
    });
}

/* =========================================================
   NEW: FLOATING "BACK" BUTTON
   Visible from the "For You" page through the second-last page
   (wishes-screen). Always resets the current page's animations
   before returning to the previous one.
   ========================================================= */
const floatingBackBtn = $("#floating-back-btn");
const BACK_ALLOWED_SCREENS = ["foryou-screen", "message-screen", "gifts-screen", "wishes-screen"];

function syncFloatingBackBtn() {
    if (!floatingBackBtn) return;
    const active = document.querySelector(".screen.active-screen");
    if (active && BACK_ALLOWED_SCREENS.includes(active.id) && navStack.length > 0) {
        floatingBackBtn.classList.add("visible");
    } else {
        floatingBackBtn.classList.remove("visible");
    }
}

if (floatingBackBtn) {
    floatingBackBtn.addEventListener("click", () => {
        floatingBackBtn.classList.add("pulse-tap");
        setTimeout(() => floatingBackBtn.classList.remove("pulse-tap"), 350);
        goBack();
    });
}

setInterval(() => {
    syncFloatingNextBtn();
    syncFloatingBackBtn();
}, 500);

/* =========================================================
   INITIAL STATE
   ========================================================= */
showScreen("login-screen");
syncFloatingNextBtn();
syncFloatingBackBtn();