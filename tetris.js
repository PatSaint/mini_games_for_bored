/**
 * Neon Tetris - Juego Retro-Moderno
 * Lógica del juego en Canvas HTML5
 */

// Elementos de la Interfaz (DOM)
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const linesDisplay = document.getElementById('linesDisplay');
const levelDisplay = document.getElementById('levelDisplay');

const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const resizeScreen = document.getElementById('resizeScreen');

const windowDim = document.getElementById('windowDim');
const levelPreview = document.getElementById('levelPreview');
const speedPreview = document.getElementById('speedPreview');
const finalScore = document.getElementById('finalScore');
const finalHighScore = document.getElementById('finalHighScore');
const newWindowDim = document.getElementById('newWindowDim');
const newLevelPreview = document.getElementById('newLevelPreview');
const levelSelect = document.getElementById('levelSelect');
const nicknameInput = document.getElementById('nicknameInput');
const leaderboardStart = document.getElementById('leaderboardStart');
const leaderboardPause = document.getElementById('leaderboardPause');
const leaderboardGameOver = document.getElementById('leaderboardGameOver');

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

// Configuración del Tablero (Estándar Tetris: 10x20)
const BOARD_COLS = 10;
const BOARD_ROWS = 20;
let cellSize = 30; // Se ajusta dinámicamente

// Estructura de Datos de la Matriz del Tablero (0 = vacío, de lo contrario almacena color)
let board = [];

// Tetrominoes y Colores (Aesthetic Neón)
const SHAPES = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

const COLORS = {
    'I': '#00f0ff', // Cyan
    'J': '#0066ff', // Azul
    'L': '#ff9900', // Naranja
    'O': '#ffcc00', // Amarillo
    'S': '#39ff14', // Verde
    'T': '#b026ff', // Púrpura
    'Z': '#ff073a'  // Rojo
};

const GLOWS = {
    'I': 'rgba(0, 240, 255, 0.4)',
    'J': 'rgba(0, 102, 255, 0.4)',
    'L': 'rgba(255, 153, 0, 0.4)',
    'O': 'rgba(255, 204, 0, 0.4)',
    'S': 'rgba(57, 255, 20, 0.4)',
    'T': 'rgba(176, 38, 255, 0.4)',
    'Z': 'rgba(255, 7, 58, 0.4)'
};

// Datos de Pieza Activa y Siguiente
let currentPiece = null;
let nextPiece = null;

// Puntuaciones
let score = 0;
let topScores = loadTopScores();
let highScore = topScores[0]?.score || 0;
let lines = 0;
let selectedLevel = 1;
let baseLevel = 1;
let currentLevel = 1; // Nivel actual sumando progreso de líneas
let dropInterval = 1000; // ms
let currentNickname = 'PLAYER';

// Tiempos y Ciclo
let lastDropTime = 0;
let pulsePhase = 0;
let particles = [];
let flashingRows = []; // Filas a punto de eliminarse
let flashDuration = 0; // Temporizador de animación de eliminación

highScoreDisplay.textContent = highScore;
nicknameInput.value = currentNickname;
nicknameInput.addEventListener('input', () => {
    const sanitized = sanitizeNickname(nicknameInput.value);
    if (nicknameInput.value !== sanitized) {
        nicknameInput.value = sanitized;
    }
});
renderTopScores();

function sanitizeNickname(value) {
    return (value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9ÁÉÍÓÚÜÑ _-]/gi, '')
        .trim()
        .slice(0, 10) || 'PLAYER';
}

function loadTopScores() {
    try {
        const parsed = JSON.parse(localStorage.getItem('neonTetrisTop10') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveTopScore() {
    if (score <= 0) return;
    topScores.push({ nick: currentNickname, score, level: currentLevel, lines });
    topScores = topScores
        .sort((a, b) => b.score - a.score || b.lines - a.lines || b.level - a.level || a.nick.localeCompare(b.nick))
        .slice(0, 10);
    localStorage.setItem('neonTetrisTop10', JSON.stringify(topScores));
    highScore = topScores[0]?.score || 0;
    highScoreDisplay.textContent = highScore;
    renderTopScores();
}

function renderTopScores() {
    const markup = topScores.length
        ? topScores.map((entry, index) => `
            <div class="leaderboard-row">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.nick} · Nv ${entry.level}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `).join('')
        : '<div class="leaderboard-empty">Todavía no hay partidas guardadas.</div>';

    [leaderboardStart, leaderboardPause, leaderboardGameOver].forEach((target) => {
        if (target) target.innerHTML = markup;
    });
}

// --- SISTEMA DE RESOLUCIÓN Y TAMAÑO DE VENTANA ---

function updateLayoutDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Altura y ancho disponibles para el lienzo principal
    const padding = 60;
    let availHeight = height - 120; // Espacio libre vertical
    
    // Si el mando táctil está visible, restamos su altura para el canvas
    if (width <= 768) {
        availHeight -= 170; // 150px del mando + 20px margen
    }
    
    // Determinar ancho disponible según modo móvil vs escritorio
    let availWidth;
    if (width > 768) {
        availWidth = width * 0.45; // Máximo 45% del ancho de pantalla en escritorio
    } else {
        availWidth = width - 40;   // Casi pantalla completa en móvil
    }
    
    // Calcular el tamaño óptimo de celda para mantener la relación 10:20 (ancho:alto)
    const sizeByHeight = Math.floor(availHeight / BOARD_ROWS);
    const sizeByWidth = Math.floor(availWidth / BOARD_COLS);
    cellSize = Math.max(16, Math.min(sizeByHeight, sizeByWidth));
    
    // Ajustar el canvas
    canvas.width = cellSize * BOARD_COLS;
    canvas.height = cellSize * BOARD_ROWS;
    
    updateGameSpeed();
    
    // Previsualización de dimensiones en los textos
    const dimText = `${width} x ${height}`;
    windowDim.textContent = dimText;
    levelPreview.textContent = currentLevel;
    newWindowDim.textContent = dimText;
    newLevelPreview.textContent = currentLevel;
}

function applySelectedLevel() {
    selectedLevel = Number(levelSelect.value || 1);
    baseLevel = selectedLevel;
    updateGameSpeed();
    levelPreview.textContent = selectedLevel;
    newLevelPreview.textContent = selectedLevel;
    speedPreview.textContent = `${dropInterval} ms`;
}

function updateGameSpeed() {
    // El nivel de juego es el nivel base de ventana más 1 por cada 10 líneas hechas
    currentLevel = baseLevel + Math.floor(lines / 10);
    currentLevel = Math.min(10, currentLevel); // Clampear a nivel 10 como máximo
    
    levelDisplay.textContent = currentLevel;
    
    // Intervalo de caída: nivel 1 es 1000ms, nivel 10 es 100ms
    dropInterval = Math.max(100, 1000 - (currentLevel - 1) * 100);
    speedPreview.textContent = `${dropInterval} ms`;
}

// Inicializar dimensiones
updateLayoutDimensions();
levelSelect.addEventListener('change', applySelectedLevel);

// Evento de cambio de tamaño
window.addEventListener('resize', () => {
    if (currentState === STATES.PLAYING) {
        currentState = STATES.RESIZED;
        updateLayoutDimensions();
        showScreen(resizeScreen);
    } else if (currentState === STATES.PAUSED) {
        updateLayoutDimensions();
    } else {
        updateLayoutDimensions();
    }
});

// --- CLASES Y ESTRUCTURA DE PIEZAS ---

class Piece {
    constructor(type) {
        this.type = type;
        this.matrix = SHAPES[type].map(row => [...row]);
        this.color = COLORS[type];
        this.glow = GLOWS[type];
        
        // Posicionar en el centro superior
        this.x = Math.floor((BOARD_COLS - this.matrix[0].length) / 2);
        this.y = this.type === 'I' ? -1 : 0; // Ajustar I un poco más arriba
    }
}

function getRandomPiece() {
    const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Piece(randomType);
}

// --- CONTROLES DE TECLADO ---

const CONTROLS = {
    'ArrowLeft': () => movePiece(-1, 0),
    'KeyA': () => movePiece(-1, 0),
    'ArrowRight': () => movePiece(1, 0),
    'KeyD': () => movePiece(1, 0),
    'ArrowDown': () => { movePiece(0, 1); score += 1; scoreDisplay.textContent = score; }, // Caída suave
    'KeyS': () => { movePiece(0, 1); score += 1; scoreDisplay.textContent = score; },
    'ArrowUp': () => rotatePiece(),
    'KeyW': () => rotatePiece(),
    'Space': () => hardDrop()
};

window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    
    if (currentState === STATES.PLAYING) {
        // Si estamos animando borrado de fila, no permitir movimientos
        if (flashingRows.length > 0) return;
        
        const action = CONTROLS[e.code];
        if (action) action();
        
        if (e.code === 'Escape' || e.code === 'KeyP') {
            pauseGame();
        }
    } 
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
    }
});

// Eventos de botones
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

// --- ACCIONES DEL JUEGO ---

function startGame() {
    currentNickname = sanitizeNickname(nicknameInput.value);
    nicknameInput.value = currentNickname;
    // Vaciar tablero
    board = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(0));
    
    // Reiniciar puntuaciones
    score = 0;
    lines = 0;
    scoreDisplay.textContent = score;
    linesDisplay.textContent = lines;
    
    applySelectedLevel();
    updateLayoutDimensions();
    
    // Generar piezas iniciales
    currentPiece = getRandomPiece();
    nextPiece = getRandomPiece();
    
    particles = [];
    flashingRows = [];
    
    currentState = STATES.PLAYING;
    hideOverlay();
    
    drawNextPiece();
    lastDropTime = performance.now();
}

function pauseGame() {
    renderTopScores();
    currentState = STATES.PAUSED;
    showScreen(pauseScreen);
}

function resumeGame() {
    currentState = STATES.PLAYING;
    hideOverlay();
    lastDropTime = performance.now();
}

function resumeGameAfterResize() {
    currentState = STATES.PLAYING;
    hideOverlay();
    lastDropTime = performance.now();
}

function gameOver() {
    currentState = STATES.GAMEOVER;
    saveTopScore();
    
    finalScore.textContent = score;
    finalHighScore.textContent = highScore;
    
    renderTopScores();
    showScreen(gameOverScreen);
}

function showScreen(screen) {
    overlay.classList.remove('hidden');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    resizeScreen.classList.add('hidden');
    
    screen.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

// --- FÍSICA Y COLISIONES ---

function checkCollision(xOffset, yOffset, matrix = currentPiece.matrix) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
                const targetX = currentPiece.x + c + xOffset;
                const targetY = currentPiece.y + r + yOffset;
                
                // Límites laterales o de fondo
                if (targetX < 0 || targetX >= BOARD_COLS || targetY >= BOARD_ROWS) {
                    return true;
                }
                
                // Chocar con piezas estáticas del tablero (solo si está dentro de la cuadrícula superior)
                if (targetY >= 0 && board[targetY][targetX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function movePiece(dx, dy) {
    if (!checkCollision(dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

function rotatePiece() {
    const originalMatrix = currentPiece.matrix;
    const size = currentPiece.matrix.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));
    
    // Rotar 90 grados horaria
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            rotated[c][size - 1 - r] = originalMatrix[r][c];
        }
    }
    
    // Intentar aplicar rotación con un sistema simple de Wall Kick (desplazamientos)
    const kicks = [0, -1, 1, -2, 2];
    for (let dx of kicks) {
        if (!checkCollision(dx, 0, rotated)) {
            currentPiece.matrix = rotated;
            currentPiece.x += dx;
            return;
        }
    }
}

function hardDrop() {
    let droppedLines = 0;
    while (!checkCollision(0, 1)) {
        currentPiece.y += 1;
        droppedLines++;
    }
    score += droppedLines * 2;
    scoreDisplay.textContent = score;
    
    lockPiece();
}

function lockPiece() {
    // Fijar la pieza en la matriz del tablero
    for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
                const boardY = currentPiece.y + r;
                const boardX = currentPiece.x + c;
                
                // Si bloqueamos una parte por encima del tablero superior: Fin del juego
                if (boardY < 0) {
                    gameOver();
                    return;
                }
                board[boardY][boardX] = currentPiece.color;
            }
        }
    }
    
    // Comprobar filas completadas
    checkLines();
    
    // Si no estamos animando la eliminación de filas, generar siguiente pieza de inmediato
    if (flashingRows.length === 0) {
        spawnNext();
    }
}

function spawnNext() {
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    
    // Si la nueva pieza colisiona al nacer: Fin de juego
    if (checkCollision(0, 0)) {
        gameOver();
    }
    
    drawNextPiece();
}

function checkLines() {
    flashingRows = [];
    
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
        const rowFilled = board[r].every(cell => cell !== 0);
        if (rowFilled) {
            flashingRows.push(r);
        }
    }
    
    if (flashingRows.length > 0) {
        flashDuration = 15; // 15 frames de destello (unos 250ms)
        // Crear chispas de neón en las filas eliminadas
        flashingRows.forEach(r => createLineParticles(r));
    }
}

function clearFlashingRows() {
    // Eliminar las filas de la matriz
    flashingRows.sort((a, b) => a - b).forEach(r => {
        board.splice(r, 1);
        board.unshift(Array(BOARD_COLS).fill(0));
    });
    
    // Calcular puntaje
    const lineCount = flashingRows.length;
    lines += lineCount;
    linesDisplay.textContent = lines;
    
    // Tabla clásica de puntos de Tetris multiplicada por nivel
    const pointTable = [0, 100, 300, 500, 800];
    score += (pointTable[lineCount] || 800) * currentLevel;
    scoreDisplay.textContent = score;
    
    // Actualizar velocidad según total de líneas
    updateGameSpeed();
    
    flashingRows = [];
    
    // Generar nueva pieza
    spawnNext();
}

// --- EFECTOS DE PARTÍCULAS ---

function createLineParticles(row) {
    const yCenter = row * cellSize + cellSize / 2;
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const color = board[row][Math.floor(x / cellSize)] || '#ffffff';
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 4.0;
        
        particles.push({
            x: x,
            y: yCenter,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5, // Leve deriva hacia arriba
            color: color,
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 3
        });
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
    // Cuadrícula cibernética fina
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    
    for (let c = 0; c <= BOARD_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, canvas.height);
        ctx.stroke();
    }
    
    for (let r = 0; r <= BOARD_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(canvas.width, r * cellSize);
        ctx.stroke();
    }
}

function drawBlock(x, y, color, targetCtx = ctx, size = cellSize) {
    const px = x * size;
    const py = y * size;
    
    targetCtx.save();
    
    // Rectángulo redondeado
    targetCtx.fillStyle = color;
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = 1;
    
    // Dibujar bloque
    const cornerRadius = size * 0.2;
    targetCtx.beginPath();
    targetCtx.roundRect(px + 1.5, py + 1.5, size - 3, size - 3, cornerRadius);
    targetCtx.fill();
    
    // Brillo blanco en esquina superior para aspecto 3D
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    targetCtx.beginPath();
    targetCtx.arc(px + size * 0.35, py + size * 0.35, size * 0.12, 0, Math.PI * 2);
    targetCtx.fill();
    
    targetCtx.restore();
}

function drawBoard() {
    for (let r = 0; r < BOARD_ROWS; r++) {
        // Si la fila está parpadeando para eliminarse, la pintamos con brillo blanco
        const isFlashing = flashingRows.includes(r);
        
        for (let c = 0; c < BOARD_COLS; c++) {
            const cellColor = board[r][c];
            if (cellColor !== 0) {
                if (isFlashing && Math.floor(flashDuration / 3) % 2 === 0) {
                    // Parpadeo blanco
                    drawBlock(c, r, '#ffffff');
                } else {
                    drawBlock(c, r, cellColor);
                }
            }
        }
    }
}

function drawActivePiece() {
    if (!currentPiece) return;
    
    ctx.save();
    // Añadir sombra neón a la pieza activa
    ctx.shadowBlur = 12 + Math.sin(pulsePhase) * 4;
    ctx.shadowColor = currentPiece.color;
    
    for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
                const drawY = currentPiece.y + r;
                // No pintar fuera del tablero superior
                if (drawY >= 0) {
                    drawBlock(currentPiece.x + c, drawY, currentPiece.color);
                }
            }
        }
    }
    ctx.restore();
}

function drawGhostPiece() {
    if (!currentPiece) return;
    
    // Calcular dónde caería
    let ghostY = currentPiece.y;
    while (!checkCollision(0, ghostY - currentPiece.y + 1)) {
        ghostY++;
    }
    
    // No dibujar si el fantasma coincide con la posición de la pieza activa
    if (ghostY === currentPiece.y) return;
    
    // Dibujar borde translúcido
    ctx.save();
    ctx.strokeStyle = currentPiece.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.25;
    
    for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
                const drawY = ghostY + r;
                if (drawY >= 0) {
                    const px = (currentPiece.x + c) * cellSize;
                    const py = drawY * cellSize;
                    const cornerRadius = cellSize * 0.2;
                    ctx.beginPath();
                    ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, cornerRadius);
                    ctx.stroke();
                }
            }
        }
    }
    ctx.restore();
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    
    const size = nextPiece.matrix.length;
    const nCellSize = 16;
    
    // Calcular offsets para centrar
    const totalW = size * nCellSize;
    const startX = (nextCanvas.width - totalW) / 2;
    const startY = (nextCanvas.height - totalW) / 2;
    
    nextCtx.save();
    // Sombras neón
    nextCtx.shadowBlur = 10;
    nextCtx.shadowColor = nextPiece.color;
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (nextPiece.matrix[r][c] !== 0) {
                const px = startX + c * nCellSize;
                const py = startY + r * nCellSize;
                const rSize = nCellSize - 2;
                
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.beginPath();
                nextCtx.roundRect(px, py, rSize, rSize, rSize * 0.2);
                nextCtx.fill();
            }
        }
    }
    nextCtx.restore();
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

// --- CICLO PRINCIPAL (Game Loop) ---

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    // Pulso constante
    pulsePhase += 0.08;
    
    // Limpieza
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    if (currentState === STATES.PLAYING) {
        if (flashingRows.length > 0) {
            // Manejar animación de destello de filas eliminadas
            flashDuration--;
            if (flashDuration <= 0) {
                clearFlashingRows();
            }
        } else {
            // Caída periódica según la velocidad del intervalo
            const elapsed = currentTime - lastDropTime;
            if (elapsed >= dropInterval) {
                if (!movePiece(0, 1)) {
                    lockPiece();
                }
                lastDropTime = currentTime - (elapsed % dropInterval);
            }
        }
    }
    
    // Las partículas y elementos se actualizan/dibujan siempre a 60 FPS
    updateParticles();
    
    drawBoard();
    if (currentState === STATES.PLAYING && flashingRows.length === 0) {
        drawGhostPiece();
        drawActivePiece();
    }
    drawParticles();
}

// Arrancar bucle
requestAnimationFrame(gameLoop);

// --- VÍNCULOS DE CONTROL TÁCTIL (MOVIL) ---
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');
const btnRotate = document.getElementById('btnRotate');
const btnDrop = document.getElementById('btnDrop');

const bindTouchAction = (btn, action) => {
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentState === STATES.PLAYING && flashingRows.length === 0) {
            action();
        }
    });
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (currentState === STATES.PLAYING && flashingRows.length === 0) {
            action();
        }
    });
};

bindTouchAction(btnLeft, () => movePiece(-1, 0));
bindTouchAction(btnRight, () => movePiece(1, 0));
bindTouchAction(btnDown, () => {
    movePiece(0, 1);
    score += 1;
    scoreDisplay.textContent = score;
});
bindTouchAction(btnRotate, () => rotatePiece());
bindTouchAction(btnDrop, () => hardDrop());
