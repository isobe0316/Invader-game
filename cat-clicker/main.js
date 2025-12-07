// Game State
let gameState = {
    niboshi: 0,
    clickPower: 1,
    xp: 0,
    level: 1,
    catForm: "normal", // normal, king, chubby, wild
    stats: { luxury: 0, snack: 0, wild: 0 },
    unlockedCats: ["normal"],
    combo: 0,
    maxCombo: 0,
    comboTimer: null,
};

// Configuration
const CONFIG = {
    comboTimeout: 2000,
    levels: [
        { xp: 100, name: "子猫" },
        { xp: 500, name: "成猫" },
        { xp: 2000, name: "ボス猫" },
    ],
    cats: {
        normal: { name: "黒猫", icon: "🐱" },
        king: { name: "王様猫", icon: "👑" },
        chubby: { name: "おデブ猫", icon: "🐷" },
        wild: { name: "ワイルド猫", icon: "🦁" },
    },
    food: [
        { id: "snack", name: "おやつ", cost: 10, xp: 5, stat: "snack" },
        { id: "tuna", name: "マグロ", cost: 100, xp: 60, stat: "wild" },
        { id: "premium", name: "高級缶詰", cost: 500, xp: 350, stat: "luxury" },
    ],
};

// Elements
const els = {
    niboshi: document.getElementById("niboshi-count"),
    gameArea: document.getElementById("game-area"),
    laser: document.getElementById("laser-point"),
    catContainer: document.querySelector(".cat-container"),
    catWrapper: document.getElementById("main-cat"),
    catName: document.getElementById("cat-name"),
    catLevel: document.getElementById("cat-level"),
    growthBar: document.getElementById("growth-bar"),
    foodList: document.getElementById("food-list"),
    comboDisplay: document.getElementById("combo-display"),
    comboCount: document.getElementById("combo-count"),
    comboMultiplier: document.getElementById("combo-multiplier"),
    collectionBtn: document.getElementById("collection-btn"),
    collectionModal: document.getElementById("collection-modal"),
    closeModal: document.getElementById("close-modal"),
    collectionGrid: document.getElementById("collection-grid"),
};

// Sound Manager
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const Sound = {
    playTone: (freq, type, duration) => {
        if (audioCtx.state === "suspended") audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    hit: () => Sound.playTone(1200, "triangle", 0.1),
    eat: () => Sound.playTone(400, "square", 0.2),
    levelup: () => {
        Sound.playTone(600, "sine", 0.1);
        setTimeout(() => Sound.playTone(800, "sine", 0.1), 100);
        setTimeout(() => Sound.playTone(1200, "sine", 0.2), 200);
    },
};

// Game Logic
function init() {
    loadGame();
    renderShop();
    updateDisplay();
    setupLaser();
    setupCollection();
    startGameLoop();
}

// Laser Action Logic
let mousePos = { x: 0, y: 0 };
let catPos = { x: 0, y: 0 }; // Relative to center

function setupLaser() {
    els.gameArea.addEventListener("mousemove", (e) => {
        const rect = els.gameArea.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;

        // Update Laser Visual
        els.laser.style.left = `${mousePos.x}px`;
        els.laser.style.top = `${mousePos.y}px`;
        els.laser.classList.remove("hidden");
    });

    els.gameArea.addEventListener("mouseleave", () => {
        els.laser.classList.add("hidden");
    });
}

function startGameLoop() {
    // Spawn mice
    setInterval(() => {
        if (document.hidden) return;
        spawnMouse();
    }, 1000);

    // Update Cat Movement (60fps)
    requestAnimationFrame(updateCatMovement);
}

function updateCatMovement() {
    if (!els.laser.classList.contains("hidden")) {
        // Move cat towards laser
        const rect = els.gameArea.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Target position (relative to center)
        const targetX = mousePos.x - centerX;
        const targetY = mousePos.y - centerY;

        // Lerp for smooth movement
        catPos.x += (targetX - catPos.x) * 0.05;
        catPos.y += (targetY - catPos.y) * 0.05;

        els.catContainer.style.left = `calc(50% + ${catPos.x}px)`;
        els.catContainer.style.top = `calc(50% + ${catPos.y}px)`;

        checkCollisions();
    }
    requestAnimationFrame(updateCatMovement);
}

function checkCollisions() {
    const mice = document.querySelectorAll(".mouse-target");
    const catRect = els.catWrapper.getBoundingClientRect();

    mice.forEach(mouse => {
        const mouseRect = mouse.getBoundingClientRect();

        // Simple AABB collision
        if (
            catRect.left < mouseRect.right &&
            catRect.right > mouseRect.left &&
            catRect.top < mouseRect.bottom &&
            catRect.bottom > mouseRect.top
        ) {
            catchMouse(mouse);
        }
    });
}

function spawnMouse() {
    if (document.querySelectorAll(".mouse-target").length >= 5) return;
    const mouse = document.createElement("div");
    mouse.className = "mouse-target";
    mouse.textContent = "🐁";
    const rect = els.gameArea.getBoundingClientRect();
    mouse.style.left = `${Math.random() * (rect.width - 40)}px`;
    mouse.style.top = `${Math.random() * (rect.height - 40)}px`;
    els.gameArea.appendChild(mouse);
    setTimeout(() => { if (mouse.parentNode) mouse.remove(); }, 3000);
}

function catchMouse(mouse) {
    Sound.hit();
    mouse.remove();

    // Combo
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    clearTimeout(gameState.comboTimer);
    gameState.comboTimer = setTimeout(() => {
        gameState.combo = 0;
        updateDisplay();
    }, CONFIG.comboTimeout);

    // Reward
    const multiplier = 1 + Math.floor(gameState.combo / 5) * 0.5;
    const gain = Math.floor(10 * multiplier);
    gameState.niboshi += gain;
    gameState.stats.wild += 1; // Hunting increases wild stat

    showFloatingText(mouse.getBoundingClientRect().left, mouse.getBoundingClientRect().top, `+${gain}`);
    updateDisplay();
}

// Nurturing & Evolution
function buyFood(foodId) {
    const food = CONFIG.food.find((f) => f.id === foodId);
    if (!food) return;

    if (gameState.niboshi >= food.cost) {
        gameState.niboshi -= food.cost;
        gameState.xp += food.xp;
        gameState.stats[food.stat] += food.xp; // Increase specific stat
        Sound.eat();

        els.catWrapper.classList.add("eating");
        setTimeout(() => els.catWrapper.classList.remove("eating"), 500);

        checkLevelUp();
        updateDisplay();
        saveGame();
    }
}

function checkLevelUp() {
    const nextLevel = CONFIG.levels[gameState.level - 1];
    if (!nextLevel) return;

    if (gameState.xp >= nextLevel.xp) {
        gameState.level++;
        gameState.xp = 0;
        Sound.levelup();
        evolveCat();
        alert(`猫がレベルアップ！ ${gameState.catForm}になりました！`);
    }
}

function evolveCat() {
    // Determine form based on stats
    const { luxury, snack, wild } = gameState.stats;
    let newForm = "normal";

    if (gameState.level >= 2) {
        const maxStat = Math.max(luxury, snack, wild);
        if (maxStat === luxury) newForm = "king";
        else if (maxStat === snack) newForm = "chubby";
        else if (maxStat === wild) newForm = "wild";
    }

    gameState.catForm = newForm;
    if (!gameState.unlockedCats.includes(newForm)) {
        gameState.unlockedCats.push(newForm);
    }
    updateCatAppearance();
}

function updateCatAppearance() {
    els.catWrapper.className = "cat-wrapper";
    els.catWrapper.classList.add(gameState.catForm);

    // Update Name
    const catConfig = CONFIG.cats[gameState.catForm];
    els.catName.textContent = catConfig ? catConfig.name : "猫";
}

// Collection
function setupCollection() {
    els.collectionBtn.addEventListener("click", () => {
        renderCollection();
        els.collectionModal.classList.remove("hidden");
    });
    els.closeModal.addEventListener("click", () => {
        els.collectionModal.classList.add("hidden");
    });
}

function renderCollection() {
    els.collectionGrid.innerHTML = "";
    Object.keys(CONFIG.cats).forEach(key => {
        const cat = CONFIG.cats[key];
        const isUnlocked = gameState.unlockedCats.includes(key);
        const div = document.createElement("div");
        div.className = `collection-item ${isUnlocked ? "unlocked" : ""}`;
        div.innerHTML = `
      <span class="collection-icon">${isUnlocked ? cat.icon : "❓"}</span>
      <span class="collection-name">${isUnlocked ? cat.name : "???"}</span>
    `;
        els.collectionGrid.appendChild(div);
    });
}

// Utils
function showFloatingText(x, y, text) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function updateDisplay() {
    els.niboshi.textContent = gameState.niboshi;
    els.catLevel.textContent = gameState.level;

    if (gameState.combo > 1) {
        els.comboDisplay.classList.remove("hidden");
        els.comboCount.textContent = gameState.combo;
        els.comboMultiplier.textContent = `x${(1 + Math.floor(gameState.combo / 5) * 0.5).toFixed(1)}`;
    } else {
        els.comboDisplay.classList.add("hidden");
    }

    const currentLevelConfig = CONFIG.levels[gameState.level - 1];
    if (currentLevelConfig) {
        const percentage = Math.min(100, (gameState.xp / currentLevelConfig.xp) * 100);
        els.growthBar.style.width = `${percentage}%`;
    } else {
        els.growthBar.style.width = "100%";
    }

    document.querySelectorAll(".buy-btn").forEach((btn) => {
        const cost = parseInt(btn.dataset.cost);
        btn.disabled = gameState.niboshi < cost;
    });
}

function renderShop() {
    els.foodList.innerHTML = "";
    CONFIG.food.forEach((item) => {
        const div = document.createElement("div");
        div.className = "shop-item";
        div.innerHTML = `
      <div class="shop-item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-desc">XP +${item.xp} (${item.stat})</span>
      </div>
      <button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">
        ${item.cost} 🐟
      </button>
    `;
        div.querySelector("button").addEventListener("click", () => buyFood(item.id));
        els.foodList.appendChild(div);
    });
}

function saveGame() {
    localStorage.setItem("catClickerSave_v3", JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem("catClickerSave_v3");
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState = { ...gameState, ...parsed };
        gameState.combo = 0;
    }
    updateCatAppearance();
}

setInterval(saveGame, 5000);
init();
