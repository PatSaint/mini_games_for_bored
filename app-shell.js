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
