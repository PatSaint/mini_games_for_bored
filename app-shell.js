(function () {
    const isTouchDevice = window.matchMedia?.('(pointer: coarse)')?.matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/mac/i.test(navigator.platform) && navigator.maxTouchPoints > 1);
    const mode = isTouchDevice ? 'touch' : 'desktop';

    window.BORED_DEVICE = { isTouchDevice, isStandalone, isIOS, mode };
    document.documentElement.dataset.inputMode = mode;

    const installState = {
        deferredPrompt: null,
        slots: []
    };

    function ensureSharedStyles() {
        if (document.getElementById('bored-app-shell-styles')) return;
        const style = document.createElement('style');
        style.id = 'bored-app-shell-styles';
        style.textContent = `
            .back-btn {
                z-index: 180 !important;
            }
            .branding {
                z-index: 170 !important;
            }
            .nickname-warning {
                margin-top: 8px;
                font-size: 12px;
                line-height: 1.4;
                color: #ff6b9a;
                text-align: left;
            }
            .input-invalid {
                border-color: #ff007f !important;
                box-shadow: 0 0 0 1px rgba(255, 0, 127, 0.55), 0 0 14px rgba(255, 0, 127, 0.22) !important;
            }
            .install-slot {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: stretch;
            }
            .install-btn {
                width: 100%;
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,.18);
                background: rgba(255,255,255,.04);
                color: #fff;
                font: 700 12px 'Orbitron', sans-serif;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: .2s ease;
            }
            .install-btn:hover { border-color: rgba(0,240,255,.85); color: #00f0ff; box-shadow: 0 0 12px rgba(0,240,255,.22); }
            .install-btn[hidden], .install-msg[hidden] { display: none !important; }
            .install-msg {
                font-size: 12px;
                line-height: 1.45;
                color: rgba(255,255,255,.68);
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    function applyAdaptiveContent() {
        document.querySelectorAll('[data-device-show]').forEach((element) => {
            element.hidden = element.dataset.deviceShow !== mode;
        });

        document.querySelectorAll('[data-touch-text], [data-desktop-text]').forEach((element) => {
            const nextText = isTouchDevice ? element.dataset.touchText : (element.dataset.desktopText || element.textContent);
            if (typeof nextText === 'string' && nextText.length) {
                element.textContent = nextText;
            }
        });

        document.querySelectorAll('[data-touch-html], [data-desktop-html]').forEach((element) => {
            const nextHtml = isTouchDevice ? element.dataset.touchHtml : (element.dataset.desktopHtml || element.innerHTML);
            if (typeof nextHtml === 'string' && nextHtml.length) {
                element.innerHTML = nextHtml;
            }
        });
    }

    function normalizeNickname(value) {
        return String(value || '')
            .toUpperCase()
            .replace(/[^A-Z0-9ÁÉÍÓÚÜÑ _-]/gi, '')
            .trim()
            .slice(0, 10);
    }

    function ensureNicknameWarning(input) {
        if (!input) return null;
        let warning = input.parentElement?.querySelector?.('.nickname-warning');
        if (warning) return warning;
        warning = document.createElement('p');
        warning.className = 'nickname-warning';
        warning.hidden = true;
        input.insertAdjacentElement('afterend', warning);
        return warning;
    }

    function clearNicknameWarning(input) {
        if (!input) return;
        input.classList.remove('input-invalid');
        const warning = ensureNicknameWarning(input);
        if (!warning) return;
        warning.hidden = true;
        warning.textContent = '';
    }

    function showNicknameWarning(input, message = 'Ingresá tu nick para jugar.') {
        if (!input) return;
        const warning = ensureNicknameWarning(input);
        input.classList.add('input-invalid');
        if (warning) {
            warning.hidden = false;
            warning.textContent = message;
        }
    }

    function attachNicknameValidation(input, options = {}) {
        if (!input || input.dataset.nicknameBound === 'true') return;
        const onChange = typeof options.onChange === 'function' ? options.onChange : null;
        ensureNicknameWarning(input);
        input.dataset.nicknameBound = 'true';
        input.addEventListener('input', () => {
            const sanitized = normalizeNickname(input.value);
            if (input.value !== sanitized) {
                input.value = sanitized;
            }
            if (sanitized) {
                clearNicknameWarning(input);
            }
            onChange?.(sanitized);
        });
    }

    function requireNickname(input, options = {}) {
        const sanitized = normalizeNickname(input?.value);
        if (!sanitized) {
            showNicknameWarning(input, options.message || 'Ingresá tu nick para jugar.');
            input?.focus?.();
            return null;
        }
        input.value = sanitized;
        clearNicknameWarning(input);
        return sanitized;
    }

    window.BORED_UI = {
        normalizeNickname,
        attachNicknameValidation,
        requireNickname,
        showNicknameWarning,
        clearNicknameWarning
    };

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioState = {
        ctx: null,
        master: null,
        unlocked: false,
        loops: new Map(),
        lastPlayed: new Map()
    };
    const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const CUE_DEFS = {
        gameStart: { notes: ['C5', 'E5', 'G5'], durations: [0.08, 0.08, 0.16], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 180 },
        snakeStart: { notes: ['C5', 'E5', 'G5'], durations: [0.08, 0.08, 0.16], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 200 },
        snakeEat: { notes: ['E5', 'A5'], durations: [0.06, 0.12], gap: 0.01, wave: 'triangle', volume: 0.05, throttleMs: 55 },
        snakeDeath: { notes: ['G4', 'E4', 'C4'], durations: [0.08, 0.1, 0.2], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 300 },
        tetrisRotate: { notes: ['E5'], durations: [0.06], wave: 'square', volume: 0.04, throttleMs: 45 },
        tetrisDrop: { notes: ['D4', 'A3'], durations: [0.05, 0.12], gap: 0.01, wave: 'square', volume: 0.05, throttleMs: 90 },
        tetrisLineClear: { notes: ['C5', 'E5', 'G5', 'C6'], durations: [0.07, 0.07, 0.07, 0.16], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 140 },
        tetrisLevelUp: { notes: ['G4', 'C5', 'E5', 'G5'], durations: [0.08, 0.08, 0.08, 0.18], gap: 0.02, wave: 'triangle', volume: 0.06, throttleMs: 220 },
        tetrisGameOver: { notes: ['E4', 'C4', 'A3'], durations: [0.08, 0.12, 0.24], gap: 0.04, wave: 'sawtooth', volume: 0.06, throttleMs: 300 },
        tetrisLoop: { notes: [['E4', 'B4'], ['G4'], ['A4', 'C5'], ['G4']], durations: [0.16, 0.12, 0.16, 0.12], gap: 0.08, wave: 'triangle', volume: 0.028, throttleMs: 120 },
        pongPaddleHit: { notes: ['A4'], durations: [0.05], wave: 'square', volume: 0.04, throttleMs: 50 },
        pongScore: { notes: ['C5', 'G4'], durations: [0.07, 0.14], gap: 0.03, wave: 'triangle', volume: 0.055, throttleMs: 180 },
        pongWin: { notes: ['C5', 'E5', 'G5', 'C6'], durations: [0.08, 0.08, 0.08, 0.2], gap: 0.02, wave: 'triangle', volume: 0.06, throttleMs: 300 },
        pongLose: { notes: ['G4', 'D4', 'A3'], durations: [0.08, 0.1, 0.2], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 300 },
        invadersShoot: { notes: ['C6'], durations: [0.05], wave: 'square', volume: 0.035, throttleMs: 70 },
        invadersAlienHit: { notes: ['A4', 'C5'], durations: [0.04, 0.08], gap: 0.01, wave: 'square', volume: 0.045, throttleMs: 45 },
        invadersExplosion: { notes: ['F3', 'C3'], durations: [0.08, 0.16], gap: 0.02, wave: 'sawtooth', volume: 0.055, throttleMs: 120 },
        invadersWaveClear: { notes: ['C5', 'E5', 'G5', 'B5'], durations: [0.08, 0.08, 0.08, 0.2], gap: 0.02, wave: 'triangle', volume: 0.06, throttleMs: 220 },
        invadersGameOver: { notes: ['D4', 'Bb3', 'F3'], durations: [0.08, 0.12, 0.24], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 320 },
        invadersLoop: { notes: ['E3', 'G3', 'D3', 'F3'], durations: [0.1, 0.1, 0.1, 0.1], gap: 0.1, wave: 'square', volume: 0.022, throttleMs: 100 },
        minesReveal: { notes: ['C5'], durations: [0.05], wave: 'triangle', volume: 0.035, throttleMs: 75 },
        minesFlag: { notes: ['G4', 'C5'], durations: [0.05, 0.08], gap: 0.01, wave: 'triangle', volume: 0.04, throttleMs: 80 },
        minesExplosion: { notes: ['C4', 'G3', 'C3'], durations: [0.05, 0.08, 0.2], gap: 0.02, wave: 'sawtooth', volume: 0.065, throttleMs: 250 },
        minesWin: { notes: ['E5', 'G5', 'C6'], durations: [0.08, 0.08, 0.18], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 250 },
        flappyFlap: { notes: ['A4', 'D5'], durations: [0.04, 0.08], gap: 0.01, wave: 'triangle', volume: 0.045, throttleMs: 70 },
        flappyScore: { notes: ['E5', 'A5'], durations: [0.05, 0.12], gap: 0.01, wave: 'triangle', volume: 0.05, throttleMs: 100 },
        flappyCrash: { notes: ['E4', 'C4', 'A3'], durations: [0.08, 0.1, 0.22], gap: 0.02, wave: 'sawtooth', volume: 0.06, throttleMs: 250 },
        breakoutPaddleHit: { notes: ['G4'], durations: [0.05], wave: 'square', volume: 0.04, throttleMs: 50 },
        breakoutBrickHit: { notes: ['C5'], durations: [0.05], wave: 'triangle', volume: 0.04, throttleMs: 45 },
        breakoutPowerup: { notes: ['C5', 'E5', 'A5'], durations: [0.06, 0.06, 0.16], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 120 },
        breakoutLose: { notes: ['F4', 'C4', 'G3'], durations: [0.08, 0.1, 0.22], gap: 0.02, wave: 'sawtooth', volume: 0.06, throttleMs: 220 },
        breakoutWin: { notes: ['C5', 'E5', 'G5', 'C6'], durations: [0.08, 0.08, 0.08, 0.2], gap: 0.02, wave: 'triangle', volume: 0.06, throttleMs: 260 },
        breakoutLoop: { notes: [['C4', 'G4'], ['E4'], ['A4'], ['G4']], durations: [0.14, 0.1, 0.14, 0.1], gap: 0.08, wave: 'triangle', volume: 0.022, throttleMs: 100 },
        lifeToggle: { notes: ['D5'], durations: [0.05], wave: 'triangle', volume: 0.035, throttleMs: 55 },
        lifeTick: { notes: ['A4'], durations: [0.04], wave: 'square', volume: 0.025, throttleMs: 120 },
        lifeCompletion: { notes: ['C5', 'E5', 'G5'], durations: [0.08, 0.08, 0.18], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 240 },
        lifeExtinction: { notes: ['G4', 'Eb4', 'C4'], durations: [0.08, 0.1, 0.2], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 260 },
        asteroidsThrust: { notes: ['A2'], durations: [0.06], wave: 'sawtooth', volume: 0.022, throttleMs: 90 },
        asteroidsShoot: { notes: ['E5'], durations: [0.05], wave: 'square', volume: 0.035, throttleMs: 70 },
        asteroidsSplit: { notes: ['C4', 'G4'], durations: [0.05, 0.1], gap: 0.01, wave: 'square', volume: 0.05, throttleMs: 80 },
        asteroidsExplode: { notes: ['F3', 'C3'], durations: [0.08, 0.16], gap: 0.02, wave: 'sawtooth', volume: 0.06, throttleMs: 140 },
        asteroidsWin: { notes: ['C5', 'E5', 'G5', 'C6'], durations: [0.08, 0.08, 0.08, 0.2], gap: 0.02, wave: 'triangle', volume: 0.06, throttleMs: 260 },
        asteroidsGameOver: { notes: ['D4', 'A3', 'F3'], durations: [0.08, 0.1, 0.22], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 300 },
        asteroidsLoop: { notes: ['A2', 'C3', 'E3', 'C3'], durations: [0.1, 0.1, 0.12, 0.1], gap: 0.08, wave: 'sawtooth', volume: 0.02, throttleMs: 100 },
        simonGreen: { notes: ['C4'], durations: [0.2], wave: 'triangle', volume: 0.05, throttleMs: 80 },
        simonRed: { notes: ['E4'], durations: [0.2], wave: 'triangle', volume: 0.05, throttleMs: 80 },
        simonYellow: { notes: ['G4'], durations: [0.2], wave: 'triangle', volume: 0.05, throttleMs: 80 },
        simonBlue: { notes: ['C5'], durations: [0.2], wave: 'triangle', volume: 0.05, throttleMs: 80 },
        simonSuccess: { notes: ['C5', 'E5', 'G5'], durations: [0.08, 0.08, 0.18], gap: 0.02, wave: 'triangle', volume: 0.055, throttleMs: 180 },
        simonFail: { notes: ['G4', 'D4', 'A3'], durations: [0.08, 0.1, 0.22], gap: 0.03, wave: 'sawtooth', volume: 0.06, throttleMs: 260 }
    };
    const LOOP_DEFS = {
        tetrisLoop: { cue: 'tetrisLoop', intervalMs: 1700 },
        invadersLoop: { cue: 'invadersLoop', intervalMs: 1400 },
        breakoutLoop: { cue: 'breakoutLoop', intervalMs: 1500 },
        asteroidsLoop: { cue: 'asteroidsLoop', intervalMs: 1300 }
    };

    function noteToFrequency(note) {
        if (typeof note === 'number' && Number.isFinite(note)) return note;
        const match = String(note || '').trim().match(/^([A-Ga-g])([#b]?)(-?\d)$/);
        if (!match) return null;
        const [, letterRaw, accidental, octaveRaw] = match;
        const letter = letterRaw.toUpperCase();
        const octave = Number(octaveRaw);
        let semitone = NOTE_INDEX[letter];
        if (accidental === '#') semitone += 1;
        if (accidental === 'b') semitone -= 1;
        const midi = (octave + 1) * 12 + semitone;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function ensureAudioContext() {
        if (!AudioContextCtor) return null;
        if (!audioState.ctx) {
            audioState.ctx = new AudioContextCtor();
            audioState.master = audioState.ctx.createGain();
            audioState.master.gain.value = 0.75;
            audioState.master.connect(audioState.ctx.destination);
        }
        return audioState.ctx;
    }

    function unlockAudio() {
        const ctx = ensureAudioContext();
        if (!ctx) return false;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        audioState.unlocked = true;
        return true;
    }

    function playVoice(ctx, frequency, startAt, duration, cue) {
        if (!frequency || duration <= 0) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const attack = cue.attack ?? 0.008;
        const release = cue.release ?? 0.12;
        const peak = cue.volume ?? 0.05;
        const endAt = startAt + duration + release;
        osc.type = cue.wave || 'triangle';
        osc.frequency.setValueAtTime(frequency, startAt);
        filter.type = cue.filterType || 'lowpass';
        filter.frequency.setValueAtTime(cue.filterFrequency || Math.max(900, frequency * 5), startAt);
        filter.Q.value = cue.filterQ || 0.4;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), startAt + attack);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.7), startAt + Math.max(attack + 0.01, duration * 0.65));
        gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioState.master);
        osc.start(startAt);
        osc.stop(endAt + 0.01);
    }

    function playCue(cueName) {
        const cue = CUE_DEFS[cueName];
        const ctx = ensureAudioContext();
        if (!cue || !ctx) return false;
        const nowMs = performance.now();
        const throttleMs = cue.throttleMs ?? 0;
        const last = audioState.lastPlayed.get(cueName) || 0;
        if (throttleMs && nowMs - last < throttleMs) return false;
        audioState.lastPlayed.set(cueName, nowMs);
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        let cursor = ctx.currentTime + 0.01;
        const notes = cue.notes || [];
        notes.forEach((step, index) => {
            const duration = cue.durations?.[index] ?? cue.duration ?? 0.12;
            const voices = Array.isArray(step) ? step : [step];
            voices.forEach((voice) => playVoice(ctx, noteToFrequency(voice), cursor, duration, cue));
            cursor += duration + (cue.gap ?? 0.015);
        });
        return true;
    }

    function stopLoop(loopName) {
        const loop = audioState.loops.get(loopName);
        if (!loop) return;
        clearTimeout(loop.timeoutId);
        audioState.loops.delete(loopName);
    }

    function startLoop(loopName) {
        const config = LOOP_DEFS[loopName];
        if (!config || audioState.loops.has(loopName)) return false;
        const run = () => {
            playCue(config.cue);
            const active = audioState.loops.get(loopName);
            if (!active) return;
            active.timeoutId = window.setTimeout(run, config.intervalMs);
        };
        audioState.loops.set(loopName, { timeoutId: window.setTimeout(run, 80) });
        return true;
    }

    function stopAllLoops() {
        Array.from(audioState.loops.keys()).forEach(stopLoop);
    }

    ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, unlockAudio, { passive: true, capture: true });
    });

    window.BORED_AUDIO = {
        supported: Boolean(AudioContextCtor),
        cues: CUE_DEFS,
        unlock: unlockAudio,
        play: playCue,
        startLoop,
        stopLoop,
        stopAllLoops
    };

    function getInstallMessage() {
        if (isStandalone) {
            return 'Ya la tenés instalada. Abrila como app cuando quieras.';
        }
        if (installState.deferredPrompt) {
            return isTouchDevice
                ? 'Instalala y abrila como acceso directo, sin barras del navegador.'
                : 'Instalala para abrirla como app independiente desde tu escritorio.';
        }
        if (isIOS && isTouchDevice) {
            return 'En Safari: Compartir → Agregar a pantalla de inicio.';
        }
        return 'Si tu navegador no ofrece instalar, usá su menú para crear un acceso directo.';
    }

    function renderInstallState() {
        const message = getInstallMessage();

        installState.slots.forEach(({ button, feedback }) => {
            feedback.textContent = message;
            feedback.hidden = false;

            if (isStandalone) {
                button.hidden = true;
                return;
            }

            if (installState.deferredPrompt) {
                button.hidden = false;
                button.disabled = false;
                button.textContent = 'INSTALAR APP';
                button.dataset.installMode = 'prompt';
                return;
            }

            button.hidden = false;
            button.disabled = false;
            button.textContent = isIOS && isTouchDevice ? 'CÓMO INSTALAR' : 'AGREGAR ACCESO DIRECTO';
            button.dataset.installMode = 'guide';
        });
    }

    async function handleInstallClick(button, feedback) {
        if (button.dataset.installMode === 'prompt' && installState.deferredPrompt) {
            const promptEvent = installState.deferredPrompt;
            installState.deferredPrompt = null;
            promptEvent.prompt();
            try {
                await promptEvent.userChoice;
            } catch (_) {
                // no-op
            }
            renderInstallState();
            return;
        }

        feedback.textContent = getInstallMessage();
        feedback.hidden = false;
    }

    function setupInstallSlots() {
        ensureSharedStyles();
        installState.slots = Array.from(document.querySelectorAll('[data-install-slot]')).map((slot) => {
            slot.classList.add('install-slot');

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'install-btn';
            button.hidden = true;

            const feedback = document.createElement('p');
            feedback.className = 'install-msg';
            feedback.hidden = true;

            button.addEventListener('click', () => handleInstallClick(button, feedback));

            slot.appendChild(button);
            slot.appendChild(feedback);

            return { slot, button, feedback };
        });

        renderInstallState();
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(() => {
                // no-op: PWA install should fail soft on static hosting
            });
        }, { once: true });
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installState.deferredPrompt = event;
        renderInstallState();
    });

    window.addEventListener('appinstalled', () => {
        installState.deferredPrompt = null;
        renderInstallState();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyAdaptiveContent();
            setupInstallSlots();
        }, { once: true });
    } else {
        applyAdaptiveContent();
        setupInstallSlots();
    }

    registerServiceWorker();
})();
