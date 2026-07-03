========================================================================
ARCADE HUB NEÓN - GUÍA DE DESARROLLO E INSTRUCCIONES PARA OTRAS IA
========================================================================

Este proyecto es un Arcade Hub estático y responsivo que funciona 100% offline, diseñado para abrirse directamente en cualquier navegador (PC, celular o tablet) haciendo doble clic en "index.html" sin necesidad de instalar nada ni levantar un servidor local.

------------------------------------------------------------------------
1. ESTRUCTURA DE ARCHIVOS
------------------------------------------------------------------------
* index.html          --> Lanzador/menú principal con rejilla compacta.
* snake.html/css/js   --> Juego Neon Snake (Modular).
* tetris.html/css/js  --> Juego Neon Tetris (Modular).
* *.html (Resto)      --> 8 Juegos autocontenidos en un único archivo HTML
                          (CSS en <style> y lógica en <script>) para evitar
                          CORS y facilitar su portabilidad offline:
                          - pong.html, invaders.html, minesweeper.html,
                            flappy.html, breakout.html, 2048.html,
                            asteroids.html, simon.html.

------------------------------------------------------------------------
2. PAUTAS DE DISEÑO Y AESTHETICS (ESTILO NEÓN CYBERPUNK)
------------------------------------------------------------------------
Si deseas modificar los juegos existentes o crear uno nuevo, mantén estas reglas:
* Fondo: Negro absoluto (#000000).
* Colores: Neón vibrante (Cian, Rosa, Verde, Amarillo, Púrpura).
* Efecto Glow (Resplandor):
  - CSS: `box-shadow: 0 0 10px rgba(...)`
  - Canvas 2D: `ctx.shadowBlur = 12; ctx.shadowColor = '#...';` (Limpiar shadowBlur al terminar para optimizar rendimiento).
* Tipografía: Google Fonts ("Orbitron" para títulos/HUD y "Outfit" para textos).
* Sin Audio: Los juegos están diseñados sin sonido para no requerir la carga de archivos locales adicionales (.mp3/.wav) que den errores de ruta.
* Partículas: Añadir micro-animaciones de partículas o chispas de neón en colisiones o al ganar puntos para mejorar el dinamismo visual.

------------------------------------------------------------------------
3. ADAPTABILIDAD AL TAMAÑO DE VENTANA (RESPONSIVO)
------------------------------------------------------------------------
* Redimensionamiento dinámico: Cada juego escucha al evento "resize" de la ventana para calcular dinámicamente el tamaño de sus celdas, palas o velocidades.
* Altura del Canvas: En pantallas móviles/tablets (ancho <= 768px), se debe restar 170px del alto total (window.innerHeight - 170) para dejar espacio en la parte inferior para los mandos táctiles virtuales.

------------------------------------------------------------------------
4. SISTEMA DE CONTROLES TÁCTILES MÓVILES (GAMEPAD VIRTUAL)
------------------------------------------------------------------------
Los juegos de teclado tienen un bloque HTML `#mobileController` con dos clases básicas de control táctil gestionadas en JS:
* Botones de mantener presionado (Hold): Útiles para mover naves en Space Invaders o Asteroids. Se configuran escuchando "touchstart"/"mousedown" para activar la dirección física (keys[keyCode] = true) y "touchend"/"mouseup"/"mouseleave" para desactivarla.
* Botones de pulsación simple (Click): Útiles para jugar, saltar o rotar. Escuchan "touchstart" y "mousedown" y ejecutan la función una sola vez.

------------------------------------------------------------------------
5. CÓMO AGREGAR UN JUEGO NUEVO (JUEGO Nº 11)
------------------------------------------------------------------------
1. Crea tu archivo HTML autocontenido (ej. "pacman.html") en esta carpeta.
2. Agrega la tarjeta de acceso rápido en index.html copiando una existente:
   <a href="pacman.html" class="game-card">
       <div class="card-glow"></div>
       <div class="game-emoji">🍒</div>
       <h3>NEON PACMAN</h3>
       <p>Come fantasmas neón</p>
   </a>
3. Asegúrate de incluir el botón de retorno en tu HTML:
   <a href="index.html" class="back-btn">◀ VOLVER</a>
4. Copia la estructura del gamepad virtual táctil de "invaders.html" o "asteroids.html" si tu nuevo juego requiere botones direccionales para móviles.
========================================================================
