/**
 * Neon Snake - Juego Retro-Moderno
 * Lógica del juego en Canvas HTML5
 */

// Elementos de la Interfaz (DOM)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const snakeLengthDisplay = document.getElementById('snakeLength');
const levelDisplay = document.getElementById('levelDisplay');

const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const resizeScreen = document.getElementById('resizeScreen');

const gridDimDisplay = document.getElementById('gridDim');
const levelPreview = document.getElementById('levelPreview');
const multiplierPreview = document.getElementById('multiplierPreview');
const finalScore = document.getElementById('finalScore');
const finalHighScore = document.getElementById('finalHighScore');
const newGridDim = document.getElementById('newGridDim');
const newLevelPreview = document.getElementById('newLevelPreview');
const levelSelect = document.getElementById('levelSelect');
const nicknameInput = document.getElementById('nicknameInput');
const leaderboardStart = document.getElementById('leaderboardStart');
const leaderboardPause = document.getElementById('leaderboardPause');
const leaderboardGameOver = document.getElementById('leaderboardGameOver');
const controlModeInputs = Array.from(document.querySelectorAll('input[name="mobileControlMode"]'));
const quakeModeToggle = document.getElementById('quakeModeToggle');
const controlGuideKey = document.getElementById('controlGuideKey');
const controlGuidePrimary = document.getElementById('controlGuidePrimary');
const controlGuideSecondary = document.getElementById('controlGuideSecondary');
const mobileHint = document.getElementById('mobileHint');
const mobileController = document.getElementById('mobileController');
const swipeControlMode = document.getElementById('swipeControlMode');
const joystickControlMode = document.getElementById('joystickControlMode');
const buttonsControlMode = document.getElementById('buttonsControlMode');
const joystickBase = document.getElementById('joystickBase');

// Botones
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const resumeButton = document.getElementById('resumeButton');
const resizeResumeButton = document.getElementById('resizeResumeButton');
const pauseRestartButton = document.getElementById('pauseRestartButton');
const mobilePauseButton = document.getElementById('mobilePauseButton');

// Estados del Juego
const STATES = {
    START: 'START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    RESIZED: 'RESIZED'
};
let currentState = STATES.START;

const CONTROL_MODES = {
    SWIPE: 'swipe',
    JOYSTICK: 'joystick',
    BUTTONS: 'buttons'
};
const CONTROL_MODE_STORAGE_KEY = 'neonSnakeMobileControlMode';
const QUAKE_MODE_STORAGE_KEY = 'neonSnakeQuakeMode';
const isTouchDevice = Boolean(window.BORED_DEVICE?.isTouchDevice);
let currentMobileControlMode = loadMobileControlMode();
let quakeModeEnabled = loadQuakeModePreference();

// Configuración de la Rejilla y Dimensiones
const TARGET_CELL_SIZE = 25; // Tamaño objetivo en píxeles de cada celda
let cols = 0;
let rows = 0;
let cellWidth = 0;
let cellHeight = 0;
let selectedLevel = 1;
let level = 1;
let gameSpeed = 150; // Intervalo en ms entre pasos del gusanito

// Datos del Gusanito
let snake = [];
let dir = { x: 1, y: 0 };      // Dirección actual
let nextDir = { x: 1, y: 0 };  // Siguiente dirección (evita auto-colisión rápida)

// Comida
let foodItems = [];
const MAX_FOOD_ITEMS = 4; // Tener varios puntos de colores en la ventana
let quakeWalls = [];
let quakeBonusItem = null;
let quakePenaltyItem = null;
let nextQuakeWallSpawnAt = 0;
let nextQuakeBonusSpawnAt = 0;
let nextQuakePenaltySpawnAt = 0;

// Partículas de efectos (Micro-animaciones)
let particles = [];

// Puntuación
let score = 0;
let topScores = loadTopScores();
let highScore = topScores[0]?.score || 0;
let currentNickname = 'PLAYER';
const uiHelper = window.BORED_UI;
const audio = window.BORED_AUDIO;
const i18n = window.BORED_I18N;

const COPY = {
    es: {
        common: {
            back: '◀ VOLVER', backToMenu: 'VOLVER AL MENÚ', goHome: 'IR AL HOME', score: 'PUNTOS', highScore: 'RÉCORD', level: 'NIVEL',
            nicknameMax: 'NICKNAME (MAX 10)', player: 'PLAYER', startLevel: 'NIVEL INICIAL', dimension: 'Dimensión:', top10Neon: 'TOP 10 NEON',
            gameOver: 'FIN DEL JUEGO', finalScore: 'Puntaje Final', bestScore: 'Mejor Puntaje', bestRuns: 'MEJORES PARTIDAS', playAgain: 'JUGAR DE NUEVO',
            pause: 'PAUSA', top10: 'TOP 10', resume: 'REANUDAR', restartMatch: 'REINICIAR PARTIDA', windowChanged: 'VENTANA MODIFICADA', resumeGame: 'REANUDAR JUEGO'
        },
        snake: {
            meta: { title: 'Neon Snake | Juego Retro-Moderno' },
            length: 'LARGO', selectedLevel: 'Nivel seleccionado:', multiplier: 'Multiplicador:', mobileControls: 'CONTROL MÓVIL',
            mobileControlsCopy: 'Elegí cómo querés jugar en táctil. Se guarda automáticamente y en desktop seguís usando teclado.',
            quakeModeTitle: 'QUAKE MODE', quakeModeCopy: 'Sumá muros aleatorios temporales y pickups extremos sin tocar el Snake clásico. Se guarda automáticamente.',
            quakeModeToggle: 'ACTIVAR QUAKE', quakeModeHint: 'Muros letales que desaparecen + bonus x10 temporal + item de puntaje negativo.',
            buttons: 'BOTONES', resizeCopy: 'La rejilla y el nivel han sido adaptados al nuevo tamaño.', newDimension: 'Nueva dimensión:', newLevel: 'Nuevo nivel:', swipeGrid: 'DESLIZÁ SOBRE LA GRILLA',
            emptyScores: 'Todavía no hay partidas guardadas.', levelShort: 'Nv', nicknameRequired: 'Ingresá tu nombre antes de arrancar Snake.'
        }
    },
    en: {
        common: {
            back: '◀ BACK', backToMenu: 'BACK TO MENU', goHome: 'GO HOME', score: 'SCORE', highScore: 'HIGH SCORE', level: 'LEVEL',
            nicknameMax: 'NICKNAME (MAX 10)', player: 'PLAYER', startLevel: 'START LEVEL', dimension: 'Size:', top10Neon: 'NEON TOP 10',
            gameOver: 'GAME OVER', finalScore: 'Final Score', bestScore: 'Best Score', bestRuns: 'BEST RUNS', playAgain: 'PLAY AGAIN',
            pause: 'PAUSE', top10: 'TOP 10', resume: 'RESUME', restartMatch: 'RESTART MATCH', windowChanged: 'WINDOW CHANGED', resumeGame: 'RESUME GAME'
        },
        snake: {
            meta: { title: 'Neon Snake | Retro-Modern Game' },
            length: 'LENGTH', selectedLevel: 'Selected level:', multiplier: 'Multiplier:', mobileControls: 'MOBILE CONTROLS',
            mobileControlsCopy: 'Choose how you want to play on touch. It saves automatically, and desktop still uses keyboard controls.',
            quakeModeTitle: 'QUAKE MODE', quakeModeCopy: 'Add temporary random walls and extreme pickups without touching classic Snake. It saves automatically.',
            quakeModeToggle: 'ENABLE QUAKE', quakeModeHint: 'Lethal walls that disappear + temporary x10 bonus + negative-score pickup.',
            buttons: 'BUTTONS', resizeCopy: 'The grid and level were adapted to the new size.', newDimension: 'New size:', newLevel: 'New level:', swipeGrid: 'SWIPE ON THE GRID',
            emptyScores: 'No saved runs yet.', levelShort: 'Lv', nicknameRequired: 'Enter your name before starting Snake.'
        }
    }
};

i18n?.registerTranslations('snake', COPY, applyLanguage);

// Variables de Control del Bucle de Juego
let lastTickTime = 0;
let baseHue = 0; // Para el arcoíris animado del gusanito
let pulseAnimationTime = 0; // Para la comida pulsante

const QUAKE_SETTINGS = {
    wallSpawnMinMs: 3200,
    wallSpawnMaxMs: 5200,
    wallLifeMinMs: 3800,
    wallLifeMaxMs: 7600,
    wallMaxCount: 18,
    bonusLifeMinMs: 3000,
    bonusLifeMaxMs: 5000,
    bonusRespawnMinMs: 5500,
    bonusRespawnMaxMs: 9000,
    penaltyRespawnMinMs: 2800,
    penaltyRespawnMaxMs: 5200
};

// Inicializar el récord en pantalla
highScoreDisplay.textContent = highScore;
nicknameInput.value = currentNickname;
uiHelper?.attachNicknameValidation(nicknameInput);
renderTopScores();

function sanitizeNickname(value) {
    return uiHelper?.normalizeNickname(value) || '';
}

function normalizeControlMode(value) {
    return Object.values(CONTROL_MODES).includes(value) ? value : CONTROL_MODES.SWIPE;
}

function loadMobileControlMode() {
    try {
        return normalizeControlMode(localStorage.getItem(CONTROL_MODE_STORAGE_KEY));
    } catch {
        return CONTROL_MODES.SWIPE;
    }
}

function loadQuakeModePreference() {
    try {
        return localStorage.getItem(QUAKE_MODE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function saveQuakeModePreference(enabled) {
    try {
        localStorage.setItem(QUAKE_MODE_STORAGE_KEY, String(Boolean(enabled)));
    } catch {
        // no-op
    }
}

function applyQuakeModePreference(enabled, options = {}) {
    quakeModeEnabled = Boolean(enabled);
    if (quakeModeToggle) {
        quakeModeToggle.checked = quakeModeEnabled;
    }
    if (options.persist !== false) {
        saveQuakeModePreference(quakeModeEnabled);
    }
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randomInt(min, max) {
    return Math.floor(randomBetween(min, max + 1));
}

function isSameCell(a, b) {
    return a?.x === b?.x && a?.y === b?.y;
}

function isWallCell(x, y) {
    return quakeWalls.some((wall) => wall.cells.some((cell) => cell.x === x && cell.y === y));
}

function isCellOccupied(x, y, options = {}) {
    const {
        ignoreFood = false,
        ignoreBonus = false,
        ignorePenalty = false,
        ignoreWalls = false,
        ignoreSnake = false
    } = options;

    if (!ignoreSnake && snake.some((segment) => segment.x === x && segment.y === y)) return true;
    if (!ignoreFood && foodItems.some((food) => food.x === x && food.y === y)) return true;
    if (!ignoreWalls && isWallCell(x, y)) return true;
    if (!ignoreBonus && quakeBonusItem && quakeBonusItem.x === x && quakeBonusItem.y === y) return true;
    if (!ignorePenalty && quakePenaltyItem && quakePenaltyItem.x === x && quakePenaltyItem.y === y) return true;

    return false;
}

function getRandomFreeCell(options = {}) {
    const attemptsLimit = Math.max(120, cols * rows * 2);
    for (let attempts = 0; attempts < attemptsLimit; attempts++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        if (!isCellOccupied(x, y, options)) {
            return { x, y };
        }
    }
    return null;
}

function saveMobileControlMode(mode) {
    try {
        localStorage.setItem(CONTROL_MODE_STORAGE_KEY, mode);
    } catch {
        // no-op
    }
}

function setDirection(inputDir) {
    if (!inputDir || currentState !== STATES.PLAYING) return;
    if ((inputDir.x !== 0 && dir.x === 0) || (inputDir.y !== 0 && dir.y === 0)) {
        nextDir = inputDir;
    }
}

function loadTopScores() {
    try {
        const parsed = JSON.parse(localStorage.getItem('neonSnakeTop10') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveTopScore() {
    if (score <= 0) return;
    topScores.push({ nick: currentNickname, score, level });
    topScores = topScores
        .sort((a, b) => b.score - a.score || b.level - a.level || a.nick.localeCompare(b.nick))
        .slice(0, 10);
    localStorage.setItem('neonSnakeTop10', JSON.stringify(topScores));
    highScore = topScores[0]?.score || 0;
    highScoreDisplay.textContent = highScore;
    renderTopScores();
}

function renderTopScores() {
    const levelShort = i18n?.t('snake.levelShort') || 'Nv';
    const markup = topScores.length
        ? topScores.map((entry, index) => `
            <div class="leaderboard-row">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.nick} · ${levelShort} ${entry.level}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `).join('')
        : `<div class="leaderboard-empty">${i18n?.t('snake.emptyScores') || 'Todavía no hay partidas guardadas.'}</div>`;

    [leaderboardStart, leaderboardPause, leaderboardGameOver].forEach((target) => {
        if (target) target.innerHTML = markup;
    });
}

// --- SISTEMA DE RESOLUCIÓN Y TAMAÑO DE VENTANA ---

function updateGridDimensions() {
    const width = window.innerWidth;
    let height = window.innerHeight;
    
    // Si el ancho es móvil, dejamos espacio para el modo táctil activo
    if (width <= 768 && isTouchDevice && mobileController) {
        const reservedHeight = Math.ceil(mobileController.getBoundingClientRect().height || 150);
        height -= reservedHeight + 20;
    }
    
    // Adaptar canvas a resolución de pantalla
    canvas.width = width;
    canvas.height = Math.max(200, height);
    
    // Calcular columnas y filas dinámicamente
    cols = Math.max(15, Math.floor(width / TARGET_CELL_SIZE));
    rows = Math.max(12, Math.floor(canvas.height / TARGET_CELL_SIZE));
    
    // Ajustar celdas para que cubran perfectamente toda la pantalla
    cellWidth = width / cols;
    cellHeight = canvas.height / rows;
    
    // Actualizar visualizaciones del HUD y Previews
    const dimText = `${cols} x ${rows}`;
    gridDimDisplay.textContent = dimText;
    newGridDim.textContent = dimText;
    applySelectedLevel(false);
}

function applySelectedLevel(updateHud = true) {
    selectedLevel = Number(levelSelect.value || 1);
    level = selectedLevel;
    gameSpeed = Math.max(60, 170 - (selectedLevel * 10));

    if (updateHud) {
        levelDisplay.textContent = level;
    }

    levelPreview.textContent = selectedLevel;
    newLevelPreview.textContent = selectedLevel;
    multiplierPreview.textContent = `x${selectedLevel}`;
}

// Inicializar dimensiones
updateGridDimensions();
levelSelect.addEventListener('change', () => applySelectedLevel(currentState !== STATES.PLAYING));

// Evento de cambio de tamaño de pantalla
window.addEventListener('resize', () => {
    // Si estamos jugando, pausamos y mostramos la pantalla de adaptación
    if (currentState === STATES.PLAYING) {
        currentState = STATES.RESIZED;
        updateGridDimensions();
        showScreen(resizeScreen);
    } else if (currentState === STATES.PAUSED) {
        updateGridDimensions();
        levelDisplay.textContent = level;
        // Permanecer en pausa
    } else {
        updateGridDimensions();
    }
});

function getControlModeCopy(mode) {
    const activeMode = normalizeControlMode(mode);
    const lang = i18n?.lang || 'es';
    return {
        [CONTROL_MODES.SWIPE]: {
            guideKey: 'SWIPE',
            guidePrimaryTouch: lang === 'en' ? 'Swipe on the grid to change direction' : 'Deslizá sobre la grilla para cambiar de dirección',
            guideSecondaryTouch: lang === 'en' ? 'Pause button below • you can change the mode from this menu' : 'Pausa táctica abajo • podés cambiar el modo desde este menú',
            hintTouch: lang === 'en' ? 'SWIPE ON GRID • PAUSE BUTTON' : 'SWIPE EN GRILLA • BOTÓN PAUSA'
        },
        [CONTROL_MODES.JOYSTICK]: {
            guideKey: 'JOYSTICK',
            guidePrimaryTouch: lang === 'en' ? 'Drag the virtual stick and the snake resolves to 4 directions' : 'Arrastrá el stick virtual y la serpiente resuelve a 4 direcciones',
            guideSecondaryTouch: lang === 'en' ? 'Release to recenter • switch modes whenever you want' : 'Soltá para recentrar • cambiá el modo cuando quieras',
            hintTouch: lang === 'en' ? 'JOYSTICK + PAUSE' : 'JOYSTICK + PAUSA'
        },
        [CONTROL_MODES.BUTTONS]: {
            guideKey: lang === 'en' ? 'BUTTONS' : 'BOTONES',
            guidePrimaryTouch: lang === 'en' ? 'Use the classic touch d-pad to move' : 'Usá la cruceta táctil clásica para moverte',
            guideSecondaryTouch: lang === 'en' ? 'Each tap sets the next valid direction' : 'Cada toque marca la próxima dirección válida',
            hintTouch: lang === 'en' ? 'D-PAD + PAUSE' : 'CRUCETA + PAUSA'
        }
    }[activeMode];
}

function updateControlModeCopy(mode = currentMobileControlMode) {
    const copy = getControlModeCopy(mode);
    if (!copy) return;

    if (controlGuideKey) {
        controlGuideKey.textContent = isTouchDevice ? copy.guideKey : '▲ ▼ ◄ ►';
    }
    if (controlGuidePrimary) {
        controlGuidePrimary.textContent = isTouchDevice ? copy.guidePrimaryTouch : (i18n?.lang === 'en' ? 'or W A S D to move' : 'o W A S D para moverte');
    }
    if (controlGuideSecondary) {
        controlGuideSecondary.textContent = isTouchDevice
            ? copy.guideSecondaryTouch
            : (i18n?.lang === 'en' ? 'ESC pauses • on mobile you can choose swipe, joystick, or buttons' : 'ESC pausa • en móvil elegís swipe, joystick o botones');
    }
    if (mobileHint) {
        mobileHint.textContent = isTouchDevice ? copy.hintTouch : (i18n?.lang === 'en' ? 'ESC PAUSE • ARROW KEYS / WASD' : 'ESC PAUSA • TECLAS FLECHA / WASD');
    }
}

function applyLanguage(lang = i18n?.lang || 'es') {
    const subtitle = document.querySelector('#startScreen .game-subtitle');
    const restartPrompt = document.querySelector('.restart-prompt');
    const pauseInstruction = document.querySelector('.pause-instruction');
    if (subtitle) {
        if (lang === 'en') {
            subtitle.dataset.touchText = 'Enter your nick, choose the starting level, pick your mobile controls, and own the neon grid. Tap START and use PAUSE whenever you need it.';
            subtitle.dataset.desktopText = 'Enter your nick, choose the starting level, and own the neon grid. ESC pauses, and on mobile you can choose swipe, joystick, or buttons.';
        } else {
            subtitle.dataset.touchText = 'Ingresá tu nick, elegí el nivel inicial, definí tu control móvil y dominá la grilla neón. Tocá INICIAR y usá PAUSA cuando haga falta.';
            subtitle.dataset.desktopText = 'Ingresá tu nick, elegí el nivel inicial y dominá la grilla neón. ESC pausa la partida y en móvil podés elegir swipe, joystick o botones.';
        }
    }
    if (restartPrompt) {
        restartPrompt.dataset.touchHtml = lang === 'en'
            ? "Tap <span class='highlight-key'>PLAY AGAIN</span> to try again"
            : "Tocá <span class='highlight-key'>JUGAR DE NUEVO</span> para volver a intentar";
        restartPrompt.dataset.desktopHtml = lang === 'en'
            ? "Press <span class='highlight-key'>SPACE</span> to try again"
            : "Presioná <span class='highlight-key'>ESPACIO</span> para volver a intentar";
    }
    if (pauseInstruction) {
        pauseInstruction.dataset.touchHtml = lang === 'en'
            ? "Tap <span class='highlight-key'>RESUME</span> or choose your next move."
            : "Tocá <span class='highlight-key'>REANUDAR</span> o elegí tu próximo movimiento.";
        pauseInstruction.dataset.desktopHtml = lang === 'en'
            ? "Press <span class='highlight-key'>ESC</span> to continue or choose your next move."
            : "Presioná <span class='highlight-key'>ESC</span> para continuar o elegí tu próximo movimiento.";
    }
    window.BORED_UI?.applyAdaptiveContent?.();
    updateControlModeCopy(currentMobileControlMode);
}

function syncControlModeInputs(mode = currentMobileControlMode) {
    controlModeInputs.forEach((input) => {
        input.checked = input.value === mode;
    });
}

function updateMobileControlVisibility(mode = currentMobileControlMode) {
    const views = {
        [CONTROL_MODES.SWIPE]: swipeControlMode,
        [CONTROL_MODES.JOYSTICK]: joystickControlMode,
        [CONTROL_MODES.BUTTONS]: buttonsControlMode
    };

    Object.entries(views).forEach(([viewMode, element]) => {
        if (!element) return;
        const isActive = viewMode === mode;
        element.classList.toggle('hidden', !isActive);
        element.setAttribute('aria-hidden', String(!isActive));
    });
}

function applyMobileControlMode(mode, options = {}) {
    currentMobileControlMode = normalizeControlMode(mode);
    swipeState.pointerId = null;
    if (currentMobileControlMode !== CONTROL_MODES.JOYSTICK) {
        resetJoystick();
    }
    syncControlModeInputs(currentMobileControlMode);
    updateMobileControlVisibility(currentMobileControlMode);
    updateControlModeCopy(currentMobileControlMode);

    if (options.persist !== false) {
        saveMobileControlMode(currentMobileControlMode);
    }

    if (options.resize !== false) {
        updateGridDimensions();
    }
}

// --- LÓGICA DE CONTROL ---

const KEY_MAP = {
    // Flechas
    'ArrowUp': { x: 0, y: -1 },
    'ArrowDown': { x: 0, y: 1 },
    'ArrowLeft': { x: -1, y: 0 },
    'ArrowRight': { x: 1, y: 0 },
    // WASD
    'KeyW': { x: 0, y: -1 },
    'KeyS': { x: 0, y: 1 },
    'KeyA': { x: -1, y: 0 },
    'KeyD': { x: 1, y: 0 }
};

window.addEventListener('keydown', (e) => {
    // Evitar scroll con flechas y espacio
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    
    // Control de juego activo
    if (currentState === STATES.PLAYING) {
        const inputDir = KEY_MAP[e.code];
        if (inputDir) {
            setDirection(inputDir);
        }
        
        // Pausar con Escape
        if (e.code === 'Escape') {
            pauseGame();
        }
    } 
    // Empezar / Reanudar desde menús
    else if (e.code === 'Space') {
        if (currentState === STATES.START) {
            startGame();
        } else if (currentState === STATES.GAMEOVER) {
            startGame();
        } else if (currentState === STATES.PAUSED) {
            resumeGame();
        } else if (currentState === STATES.RESIZED) {
            resumeGameAfterResize();
        }
    } else if (e.code === 'Escape' && currentState === STATES.PAUSED) {
        resumeGame();
    } else if (e.code === 'Escape' && currentState === STATES.RESIZED) {
        resumeGameAfterResize();
    }
});

// Registrar eventos de clics de los botones de la interfaz
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', resumeGame);
resizeResumeButton.addEventListener('click', resumeGameAfterResize);
pauseRestartButton.addEventListener('click', startGame);
mobilePauseButton.addEventListener('click', () => {
    if (currentState === STATES.PLAYING) {
        pauseGame();
    } else if (currentState === STATES.PAUSED) {
        resumeGame();
    }
});

controlModeInputs.forEach((input) => {
    input.addEventListener('change', () => {
        if (input.checked) {
            applyMobileControlMode(input.value);
        }
    });
});

// --- ACCIONES DEL JUEGO ---

function startGame() {
    const validatedNickname = uiHelper?.requireNickname(nicknameInput, { message: i18n?.t('snake.nicknameRequired') || 'Ingresá tu nombre antes de arrancar Snake.' }) ?? sanitizeNickname(nicknameInput.value);
    if (!validatedNickname) {
        return;
    }
    currentNickname = validatedNickname;
    nicknameInput.value = currentNickname;
    applySelectedLevel();
    // Reiniciar puntuaciones y gusanito
    score = 0;
    scoreDisplay.textContent = score;
    
    // Posición inicial en el centro
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    
    snakeLengthDisplay.textContent = snake.length;
    
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    
    // Vaciar y regenerar comida
    foodItems = [];
    quakeWalls = [];
    quakeBonusItem = null;
    quakePenaltyItem = null;
    for (let i = 0; i < MAX_FOOD_ITEMS; i++) {
        spawnFood();
    }

    const now = performance.now();
    nextQuakeWallSpawnAt = now + randomBetween(QUAKE_SETTINGS.wallSpawnMinMs, QUAKE_SETTINGS.wallSpawnMaxMs);
    nextQuakeBonusSpawnAt = now + randomBetween(QUAKE_SETTINGS.bonusRespawnMinMs, QUAKE_SETTINGS.bonusRespawnMaxMs);
    nextQuakePenaltySpawnAt = now + randomBetween(800, 1800);
    
    particles = [];
    
    // Cambiar estado
    currentState = STATES.PLAYING;
    hideOverlay();
    
    // Resetear tiempos
    lastTickTime = performance.now();
    audio?.play('snakeStart');
}

function pauseGame() {
    renderTopScores();
    currentState = STATES.PAUSED;
    showScreen(pauseScreen);
}

function resumeGame() {
    currentState = STATES.PLAYING;
    hideOverlay();
    lastTickTime = performance.now();
}

function resumeGameAfterResize() {
    // Reajustar coordenadas del gusanito si quedaron fuera de la nueva rejilla
    snake.forEach(segment => {
        segment.x = (segment.x + cols) % cols;
        segment.y = (segment.y + rows) % rows;
    });
    
    // Asegurar que la comida esté dentro de los límites
    foodItems.forEach(food => {
        food.x = Math.min(food.x, cols - 1);
        food.y = Math.min(food.y, rows - 1);
    });

    normalizeQuakeEntitiesAfterResize();
    
    currentState = STATES.PLAYING;
    hideOverlay();
    lastTickTime = performance.now();
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    audio?.play('snakeDeath');
    saveTopScore();
    
    // Actualizar textos finales
    finalScore.textContent = score;
    finalHighScore.textContent = highScore;
    
    // Mostrar pantalla
    renderTopScores();
    showScreen(gameOverScreen);
}

// --- GESTIÓN DE PANTALLAS (DOM) ---

function showScreen(screenToShow) {
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    resizeScreen.classList.add('hidden');
    
    screenToShow.classList.remove('hidden');
}

// --- MECÁNICAS INTERNAS ---

function hideOverlay() {
    overlay.classList.add('hidden');
}

function spawnFood() {
    const freeCell = getRandomFreeCell();
    if (!freeCell) return;
    
    // Color aleatorio neón vibrante en HSL
    const randomHue = Math.floor(Math.random() * 360);
    const color = `hsl(${randomHue}, 100%, 55%)`;
    
    foodItems.push({
        x: freeCell.x,
        y: freeCell.y,
        color: color,
        hue: randomHue,
        pulsePhase: Math.random() * Math.PI * 2 // Desfase aleatorio para animación individual
    });
}

function spawnQuakeWall() {
    if (!quakeModeEnabled || quakeWalls.length >= QUAKE_SETTINGS.wallMaxCount) return;

    for (let attempt = 0; attempt < 40; attempt++) {
        const width = randomInt(1, 3);
        const height = randomInt(1, 2);
        const originX = randomInt(0, Math.max(0, cols - width));
        const originY = randomInt(0, Math.max(0, rows - height));
        const cells = [];
        let valid = true;

        for (let dx = 0; dx < width && valid; dx++) {
            for (let dy = 0; dy < height; dy++) {
                const x = originX + dx;
                const y = originY + dy;
                if (isCellOccupied(x, y)) {
                    valid = false;
                    break;
                }
                cells.push({ x, y });
            }
        }

        if (valid && cells.length > 0) {
            quakeWalls.push({
                cells,
                hue: randomInt(270, 330),
                bornAt: performance.now(),
                expiresAt: performance.now() + randomBetween(QUAKE_SETTINGS.wallLifeMinMs, QUAKE_SETTINGS.wallLifeMaxMs)
            });
            return;
        }
    }
}

function spawnQuakeBonusItem(currentTime) {
    if (!quakeModeEnabled || quakeBonusItem) return;
    const freeCell = getRandomFreeCell();
    if (!freeCell) return;

    quakeBonusItem = {
        ...freeCell,
        color: 'rgba(0, 240, 255, 0.95)',
        expiresAt: currentTime + randomBetween(QUAKE_SETTINGS.bonusLifeMinMs, QUAKE_SETTINGS.bonusLifeMaxMs),
        pulsePhase: Math.random() * Math.PI * 2
    };
}

function spawnQuakePenaltyItem() {
    if (!quakeModeEnabled || quakePenaltyItem) return;
    const freeCell = getRandomFreeCell();
    if (!freeCell) return;

    quakePenaltyItem = {
        ...freeCell,
        penalty: randomInt(1, 5),
        color: 'rgba(255, 7, 58, 0.95)',
        pulsePhase: Math.random() * Math.PI * 2
    };
}

function scheduleNextQuakeWall(currentTime) {
    nextQuakeWallSpawnAt = currentTime + randomBetween(QUAKE_SETTINGS.wallSpawnMinMs, QUAKE_SETTINGS.wallSpawnMaxMs);
}

function scheduleNextQuakeBonus(currentTime) {
    nextQuakeBonusSpawnAt = currentTime + randomBetween(QUAKE_SETTINGS.bonusRespawnMinMs, QUAKE_SETTINGS.bonusRespawnMaxMs);
}

function scheduleNextQuakePenalty(currentTime) {
    nextQuakePenaltySpawnAt = currentTime + randomBetween(QUAKE_SETTINGS.penaltyRespawnMinMs, QUAKE_SETTINGS.penaltyRespawnMaxMs);
}

function normalizeQuakeEntitiesAfterResize() {
    if (!quakeModeEnabled) return;

    foodItems = foodItems.filter((food, index, allFoods) => {
        const isInsideGrid = food.x >= 0 && food.x < cols && food.y >= 0 && food.y < rows;
        const overlapsSnake = snake.some((segment) => segment.x === food.x && segment.y === food.y);
        const duplicated = allFoods.findIndex((candidate) => candidate.x === food.x && candidate.y === food.y) !== index;
        return isInsideGrid && !overlapsSnake && !duplicated;
    });

    quakeWalls = quakeWalls
        .map((wall) => ({
            ...wall,
            cells: wall.cells.filter((cell) => cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows)
        }))
        .filter((wall) => wall.cells.length > 0 && wall.cells.every((cell) => !isCellOccupied(cell.x, cell.y, { ignoreWalls: true })));

    if (quakeBonusItem && isCellOccupied(quakeBonusItem.x, quakeBonusItem.y, { ignoreBonus: true })) {
        quakeBonusItem = null;
    }

    if (quakePenaltyItem && isCellOccupied(quakePenaltyItem.x, quakePenaltyItem.y, { ignorePenalty: true })) {
        quakePenaltyItem = null;
    }

    while (foodItems.length < MAX_FOOD_ITEMS) {
        spawnFood();
    }
}

function updateQuakeState(currentTime) {
    if (!quakeModeEnabled || currentState !== STATES.PLAYING) return;

    if (currentTime >= nextQuakeWallSpawnAt) {
        spawnQuakeWall();
        scheduleNextQuakeWall(currentTime);
    }

    const beforeCount = quakeWalls.length;
    quakeWalls = quakeWalls.filter((wall) => wall.expiresAt > currentTime);
    if (beforeCount !== quakeWalls.length) {
        // No-op: walls naturally disappear after their lifetime expires.
    }

    if (!quakeBonusItem && currentTime >= nextQuakeBonusSpawnAt) {
        spawnQuakeBonusItem(currentTime);
        if (!quakeBonusItem) {
            scheduleNextQuakeBonus(currentTime);
        }
    }

    if (quakeBonusItem && currentTime >= quakeBonusItem.expiresAt) {
        quakeBonusItem = null;
        scheduleNextQuakeBonus(currentTime);
    }

    if (!quakePenaltyItem && currentTime >= nextQuakePenaltySpawnAt) {
        spawnQuakePenaltyItem();
        if (!quakePenaltyItem) {
            scheduleNextQuakePenalty(currentTime);
        }
    }
}

function createEatenParticles(x, y, color) {
    // Generar chispas de neón cuando come
    const count = 12;
    // Coordenadas del píxel en el lienzo central de la celda
    const centerX = x * cellWidth + cellWidth / 2;
    const centerY = y * cellHeight + cellHeight / 2;
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 3
        });
    }
}

// --- ACTUALIZACIONES FÍSICAS ---

function updatePhysics() {
    // 1. Aplicar dirección
    dir = nextDir;
    
    // 2. Calcular nueva cabeza
    const head = snake[0];
    
    // Movimiento con envoltura de bordes de la ventana
    let newHeadX = (head.x + dir.x + cols) % cols;
    let newHeadY = (head.y + dir.y + rows) % rows;
    
    const newHead = { x: newHeadX, y: newHeadY };
    
    // 3. Verificar colisión con el propio cuerpo
    // (Omitimos el último elemento ya que se va a mover, excepto si come)
    for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            gameOver();
            return;
        }
    }

    if (quakeModeEnabled && isWallCell(newHead.x, newHead.y)) {
        gameOver();
        return;
    }
    
    // 4. Agregar nueva cabeza
    snake.unshift(newHead);
    
    // 5. Verificar colisión con la comida
    let ateFood = false;
    let consumedSpecialItem = false;
    for (let i = 0; i < foodItems.length; i++) {
        if (foodItems[i].x === newHead.x && foodItems[i].y === newHead.y) {
            ateFood = true;
            audio?.play('snakeEat');
            
            // Incrementar puntuación
            score += 10 * level;
            scoreDisplay.textContent = score;
            snakeLengthDisplay.textContent = snake.length;
            
            // Crear efecto de partículas
            createEatenParticles(foodItems[i].x, foodItems[i].y, foodItems[i].color);
            
            // Eliminar esta comida y generar otra
            foodItems.splice(i, 1);
            spawnFood();
            break; // Solo puede comer una comida por turno
        }
    }

    if (!ateFood && quakeModeEnabled && isSameCell(newHead, quakeBonusItem)) {
        consumedSpecialItem = true;
        audio?.play('snakeEat');
        score += 10;
        scoreDisplay.textContent = score;
        createEatenParticles(quakeBonusItem.x, quakeBonusItem.y, quakeBonusItem.color);
        quakeBonusItem = null;
        scheduleNextQuakeBonus(performance.now());
    }

    if (!ateFood && quakeModeEnabled && isSameCell(newHead, quakePenaltyItem)) {
        consumedSpecialItem = true;
        audio?.play('snakeEat');
        score -= quakePenaltyItem.penalty;
        scoreDisplay.textContent = score;
        createEatenParticles(quakePenaltyItem.x, quakePenaltyItem.y, quakePenaltyItem.color);
        quakePenaltyItem = null;
        scheduleNextQuakePenalty(performance.now());

        if (score < 0) {
            gameOver();
            return;
        }
    }
    
    // Si no comió comida, quitar la cola del gusanito
    if (!ateFood) {
        snake.pop();
    }

    if (consumedSpecialItem) {
        snakeLengthDisplay.textContent = snake.length;
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// --- RENDERIZACIÓN GRÁFICA (60 FPS) ---

function drawGrid() {
    // Dibujar una rejilla cibernética ultra sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= cols; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let j = 0; j <= rows; j++) {
        const y = j * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawSnake() {
    // Si el gusanito no existe por algún motivo, no dibujar
    if (snake.length === 0) return;
    
    // Incrementar baseHue para crear animación arcoíris fluida
    baseHue = (baseHue + 0.3) % 360;
    
    // Dibujar cuerpo (de la cola a la cabeza, para que la cabeza quede arriba)
    for (let i = snake.length - 1; i >= 0; i--) {
        const segment = snake[i];
        const isHead = i === 0;
        
        // Coordenadas en píxeles
        const x = segment.x * cellWidth;
        const y = segment.y * cellHeight;
        
        // El color cambia gradualmente a lo largo del cuerpo
        // Usamos HSL para hacer una transición de colores premium
        // La cabeza es más brillante y vibrante
        const hueShift = (baseHue + (i * 12)) % 360;
        const saturation = isHead ? 100 : 90;
        const lightness = isHead ? 60 : 50;
        const snakeColor = `hsl(${hueShift}, ${saturation}%, ${lightness}%)`;
        
        // Definir glow individual en canvas
        ctx.save();
        ctx.shadowBlur = isHead ? 18 : 10;
        ctx.shadowColor = snakeColor;
        ctx.fillStyle = snakeColor;
        
        if (isHead) {
            // Dibujar cabeza como un círculo ligeramente mayor
            ctx.beginPath();
            const radius = Math.min(cellWidth, cellHeight) / 2 * 0.95;
            const cx = x + cellWidth / 2;
            const cy = y + cellHeight / 2;
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Dibujar ojos en la dirección en la que avanza
            ctx.shadowBlur = 0; // Sin glow para los ojos
            ctx.fillStyle = '#000000';
            
            const eyeSize = radius * 0.22;
            const eyeOffset = radius * 0.35;
            
            // Calcular posiciones de ojos basado en la dirección
            let eye1X, eye1Y, eye2X, eye2Y;
            
            if (dir.x !== 0) { // Moviéndose horizontalmente (izq/der)
                eye1X = cx + dir.x * eyeOffset;
                eye1Y = cy - eyeOffset;
                eye2X = cx + dir.x * eyeOffset;
                eye2Y = cy + eyeOffset;
            } else { // Moviéndose verticalmente (arriba/abajo)
                eye1X = cx - eyeOffset;
                eye1Y = cy + dir.y * eyeOffset;
                eye2X = cx + eyeOffset;
                eye2Y = cy + dir.y * eyeOffset;
            }
            
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo blanco pequeño en las pupilas
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eye1X - dir.x * 0.5, eye1Y - dir.y * 0.5, eyeSize * 0.4, 0, Math.PI * 2);
            ctx.arc(eye2X - dir.x * 0.5, eye2Y - dir.y * 0.5, eyeSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Dibujar cuerpo como rectángulos redondeados encadenados
            // Disminución de tamaño hacia la cola para efecto estilizado
            const scale = 0.85 - (i / snake.length) * 0.25; 
            const w = cellWidth * scale;
            const h = cellHeight * scale;
            const ox = x + (cellWidth - w) / 2;
            const oy = y + (cellHeight - h) / 2;
            
            // Rectángulo redondeado
            const radius = Math.min(w, h) * 0.3;
            ctx.beginPath();
            ctx.roundRect(ox, oy, w, h, radius);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function drawFood() {
    // La comida pulsa con el tiempo
    pulseAnimationTime += 0.05;
    
    foodItems.forEach(food => {
        const x = food.x * cellWidth + cellWidth / 2;
        const y = food.y * cellHeight + cellHeight / 2;
        
        // Factor de pulso sinusoidal
        const pulse = Math.sin(pulseAnimationTime + food.pulsePhase) * 0.15 + 0.85;
        const baseRadius = Math.min(cellWidth, cellHeight) / 2 * 0.55;
        const radius = baseRadius * pulse;
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = food.color;
        ctx.fillStyle = food.color;
        
        // Dibujar cuerpo de la comida como estrella/círculo radiante
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Centro blanco brillante para lucir caliente/neón
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function drawQuakeWalls() {
    if (!quakeModeEnabled || quakeWalls.length === 0) return;

        quakeWalls.forEach((wall) => {
            const wallColor = `hsla(${wall.hue}, 100%, 62%, 0.95)`;
            const lifeRatio = wall.expiresAt ? Math.max(0.15, Math.min(1, (wall.expiresAt - performance.now()) / (QUAKE_SETTINGS.wallLifeMaxMs || 1))) : 1;
            wall.cells.forEach((cell) => {
                const x = cell.x * cellWidth;
                const y = cell.y * cellHeight;
                const insetX = cellWidth * 0.08;
                const insetY = cellHeight * 0.08;

            ctx.save();
            ctx.globalAlpha = lifeRatio;
            ctx.shadowBlur = 18;
            ctx.shadowColor = wallColor;
            ctx.fillStyle = 'rgba(255, 0, 127, 0.18)';
            ctx.strokeStyle = wallColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x + insetX, y + insetY, cellWidth - insetX * 2, cellHeight - insetY * 2, Math.min(cellWidth, cellHeight) * 0.18);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    });
}

function drawQuakeItems() {
    if (!quakeModeEnabled) return;

    if (quakeBonusItem) {
        const x = quakeBonusItem.x * cellWidth + cellWidth / 2;
        const y = quakeBonusItem.y * cellHeight + cellHeight / 2;
        const pulse = Math.sin(pulseAnimationTime + quakeBonusItem.pulsePhase) * 0.16 + 0.92;
        const radius = Math.min(cellWidth, cellHeight) * 0.42 * pulse;

        ctx.save();
        ctx.shadowBlur = 22;
        ctx.shadowColor = quakeBonusItem.color;
        ctx.fillStyle = quakeBonusItem.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
    }

    if (quakePenaltyItem) {
        const x = quakePenaltyItem.x * cellWidth + cellWidth / 2;
        const y = quakePenaltyItem.y * cellHeight + cellHeight / 2;
        const size = Math.min(cellWidth, cellHeight) * 0.72;

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = quakePenaltyItem.color;
        ctx.strokeStyle = quakePenaltyItem.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x - size / 2, y - size / 2, size, size, size * 0.18);
        ctx.stroke();
        ctx.restore();
    }
}

function drawParticles() {
    ctx.save();
    particles.forEach(p => {
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// --- CONTROL DEL CICLO PRINCIPAL (Game Loop) ---

function gameLoop(currentTime) {
    // Continuar ciclo siempre
    requestAnimationFrame(gameLoop);
    
    // Limpiar pantalla con negro absoluto
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar elementos estáticos / de fondo
    drawGrid();
    
    // Lógica en base al estado actual
    if (currentState === STATES.PLAYING) {
        updateQuakeState(currentTime);
        // Ejecutar un paso físico solo según la velocidad de juego
        const elapsed = currentTime - lastTickTime;
        if (elapsed >= gameSpeed) {
            updatePhysics();
            lastTickTime = currentTime - (elapsed % gameSpeed);
        }
    }
    
    // Actualizar partículas en cada frame para animación fluida a 60 FPS
    updateParticles();
    
    // Renderizado dinámico continuo a 60 FPS
    drawFood();
    drawQuakeWalls();
    drawQuakeItems();
    drawSnake();
    drawParticles();
}

// Arrancar el ciclo de animación
requestAnimationFrame(gameLoop);

// --- VÍNCULOS DE CONTROL TÁCTIL (MOVIL) ---
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

function handleTouchDirection(newDir) {
    setDirection(newDir);
}

// Bindeo de eventos táctiles y mousedown (fallback)
const bindTouchButton = (btn, direction) => {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTouchDirection(direction);
    });
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleTouchDirection(direction);
    });
};

bindTouchButton(btnUp, { x: 0, y: -1 });
bindTouchButton(btnDown, { x: 0, y: 1 });
bindTouchButton(btnLeft, { x: -1, y: 0 });
bindTouchButton(btnRight, { x: 1, y: 0 });

const swipeState = {
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
};

function isSwipeModeActive() {
    return isTouchDevice && currentMobileControlMode === CONTROL_MODES.SWIPE;
}

function handleSwipeMove(clientX, clientY) {
    const deltaX = clientX - swipeState.startX;
    const deltaY = clientY - swipeState.startY;
    const threshold = 24;

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
        return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        handleTouchDirection({ x: deltaX > 0 ? 1 : -1, y: 0 });
    } else {
        handleTouchDirection({ x: 0, y: deltaY > 0 ? 1 : -1 });
    }

    swipeState.startX = clientX;
    swipeState.startY = clientY;
}

canvas.addEventListener('pointerdown', (event) => {
    if (!isSwipeModeActive() || currentState !== STATES.PLAYING) return;
    if (event.pointerType === 'mouse') return;
    swipeState.pointerId = event.pointerId;
    swipeState.startX = event.clientX;
    swipeState.startY = event.clientY;
    swipeState.lastX = event.clientX;
    swipeState.lastY = event.clientY;
});

canvas.addEventListener('pointermove', (event) => {
    if (!isSwipeModeActive() || swipeState.pointerId !== event.pointerId) return;
    event.preventDefault();
    swipeState.lastX = event.clientX;
    swipeState.lastY = event.clientY;
    handleSwipeMove(event.clientX, event.clientY);
}, { passive: false });

function resetSwipeState(pointerId) {
    if (swipeState.pointerId !== pointerId) return;
    swipeState.pointerId = null;
}

canvas.addEventListener('pointerup', (event) => {
    if (isSwipeModeActive() && swipeState.pointerId === event.pointerId) {
        handleSwipeMove(event.clientX, event.clientY);
    }
    resetSwipeState(event.pointerId);
});

canvas.addEventListener('pointercancel', (event) => resetSwipeState(event.pointerId));

const joystickState = {
    pointerId: null,
    maxOffset: 38
};

function resetJoystick() {
    joystickState.pointerId = null;
    if (joystickBase) {
        joystickBase.style.setProperty('--stick-x', '0px');
        joystickBase.style.setProperty('--stick-y', '0px');
    }
}

function handleJoystickMove(clientX, clientY) {
    if (!joystickBase) return;
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const limitedDistance = Math.min(distance, joystickState.maxOffset);
    const angle = Math.atan2(rawY, rawX);
    const offsetX = distance ? Math.cos(angle) * limitedDistance : 0;
    const offsetY = distance ? Math.sin(angle) * limitedDistance : 0;

    joystickBase.style.setProperty('--stick-x', `${offsetX}px`);
    joystickBase.style.setProperty('--stick-y', `${offsetY}px`);

    if (distance < 18) return;

    if (Math.abs(rawX) > Math.abs(rawY)) {
        handleTouchDirection({ x: rawX > 0 ? 1 : -1, y: 0 });
    } else {
        handleTouchDirection({ x: 0, y: rawY > 0 ? 1 : -1 });
    }
}

joystickBase?.addEventListener('pointerdown', (event) => {
    if (!isTouchDevice || currentMobileControlMode !== CONTROL_MODES.JOYSTICK || currentState !== STATES.PLAYING) return;
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    joystickState.pointerId = event.pointerId;
    joystickBase.setPointerCapture?.(event.pointerId);
    handleJoystickMove(event.clientX, event.clientY);
});

joystickBase?.addEventListener('pointermove', (event) => {
    if (joystickState.pointerId !== event.pointerId || currentMobileControlMode !== CONTROL_MODES.JOYSTICK) return;
    event.preventDefault();
    handleJoystickMove(event.clientX, event.clientY);
}, { passive: false });

function releaseJoystick(pointerId) {
    if (joystickState.pointerId !== pointerId) return;
    resetJoystick();
}

joystickBase?.addEventListener('pointerup', (event) => releaseJoystick(event.pointerId));
joystickBase?.addEventListener('pointercancel', (event) => releaseJoystick(event.pointerId));

quakeModeToggle?.addEventListener('change', () => {
    applyQuakeModePreference(quakeModeToggle.checked);
});

applyMobileControlMode(currentMobileControlMode, { resize: false });
applyQuakeModePreference(quakeModeEnabled, { persist: false });
