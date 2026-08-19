/**
 * Diagrama Interactivo 2D/3D SVG para Muro a 1 Cara (M1C)
 * Representa el encofrado vertical M1C, la zapata, el empuje de hormigón y el anclaje a 45º
 */

export class DiagramMuro1Cara {
  constructor(container, onValueChange) {
    this.container = container;
    this.onValueChange = onValueChange; // Callback para cambios bidireccionales

    this.values = {
      H: 9,              // m
      PresionMax: 25,    // kN/m2
      AnchoBatache: 2,   // m
      NumAnclajes: 4,    // ud
      hef: 440,          // mm
      ca1: 500,          // mm
      ca2: 1500,         // mm
      ca3: 200,          // mm
      ca4: 900           // mm
    };

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.render();
  }

  updateValues(newValues) {
    Object.assign(this.values, newValues);
    this.render();
  }

  render() {
    const { H, PresionMax, AnchoBatache, hef, ca1, ca2, ca3, ca4 } = this.values;

    const svgWidth = 600;
    const svgHeight = 440;

    // Dimensions for the drawing
    const groundY = 320;
    const wallX = 240;
    const wallW = 12.5; // 1/4 of previous 50px width
    const wallH = 240; // Represents H
    const wallTop = groundY - wallH;

    // 45 deg anchor in footing (pointing down-left / opposite direction)
    const anchorStartX = wallX + wallW;
    const anchorStartY = groundY;
    const anchorLenPx = 110;
    const anchorEndX = anchorStartX - anchorLenPx * Math.cos(Math.PI / 4);
    const anchorEndY = anchorStartY + anchorLenPx * Math.sin(Math.PI / 4);

    const svg = `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
        
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; height: auto; max-height: 420px;" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="concreteGradM1C" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#3b485d" />
              <stop offset="100%" stop-color="#1e2736" />
            </linearGradient>

            <linearGradient id="wallGradM1C" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#c8102e" stop-opacity="0.85" />
              <stop offset="100%" stop-color="#990b22" stop-opacity="0.95" />
            </linearGradient>

            <linearGradient id="pressureGradM1C" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#0284c7" stop-opacity="0.7" />
            </linearGradient>

            <pattern id="diagHatchM1C" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" stroke-width="1.5" opacity="0.4" />
            </pattern>

            <marker id="arrowM1C" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>

            <marker id="arrowRedM1C" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          <!-- 1. Zapata / Terreno (Footing Slab) -->
          <polygon points="60,${groundY} 540,${groundY} 540,${svgHeight - 15} 60,${svgHeight - 15}" fill="url(#concreteGradM1C)" stroke="#64748b" stroke-width="2" />
          <polygon points="60,${groundY} 540,${groundY} 540,${svgHeight - 15} 60,${svgHeight - 15}" fill="url(#diagHatchM1C)" />

          <!-- 2. Cono de Hormigón a 45º (Rotura: cara izquierda vertical y cara derecha inclinada) -->
          <polygon points="${anchorEndX - 8},${groundY} ${anchorEndX - 8},${anchorEndY - 8} ${anchorEndX + 8},${anchorEndY + 8} ${anchorStartX + 50},${groundY}" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" />

          <!-- 3. Encofrado Muro a 1 Cara (M1C Vertical Panel & Escuadra) -->
          <rect x="${wallX}" y="${wallTop}" width="${wallW}" height="${wallH}" rx="3" fill="url(#wallGradM1C)" stroke="#ffffff" stroke-width="1.5" />
          
          <!-- Escuadra M1C (Diagonal Brace Structure) -->
          <polygon points="${wallX + wallW},${wallTop + 40} ${wallX + wallW + 110},${groundY} ${wallX + wallW},${groundY}" fill="rgba(200,16,46,0.15)" stroke="#c8102e" stroke-width="2.5" />
          <line x1="${wallX + wallW}" y1="${wallTop + 130}" x2="${wallX + wallW + 65}" y2="${groundY}" stroke="#c8102e" stroke-width="2" stroke-dasharray="2,2" />

          <!-- 4. Diagrama de Presiones de Hormigón Fresco (Izquierda del encofrado) -->
          <!-- Triangular + Rectangular Pressure Polygon -->
          <polygon points="${wallX - 90},${groundY} ${wallX - 90},${wallTop + 70} ${wallX},${wallTop} ${wallX},${groundY}" fill="url(#pressureGradM1C)" stroke="#38bdf8" stroke-width="1.5" />
          
          <!-- Pressure force arrows (6 arrows strictly contained within the blue contour) -->
          <line x1="${wallX - 90}" y1="${groundY - 20}" x2="${wallX - 3}" y2="${groundY - 20}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />
          <line x1="${wallX - 90}" y1="${groundY - 55}" x2="${wallX - 3}" y2="${groundY - 55}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />
          <line x1="${wallX - 90}" y1="${groundY - 90}" x2="${wallX - 3}" y2="${groundY - 90}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />
          <line x1="${wallX - 90}" y1="${groundY - 130}" x2="${wallX - 3}" y2="${groundY - 130}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />
          <line x1="${wallX - 77}" y1="${wallTop + 60}" x2="${wallX - 3}" y2="${wallTop + 60}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />
          <line x1="${wallX - 32}" y1="${wallTop + 25}" x2="${wallX - 3}" y2="${wallTop + 25}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />

          <text x="${wallX - 45}" y="${groundY - 105}" fill="#ffffff" font-size="10" font-weight="800" font-family="monospace" text-anchor="middle">Pmax ${PresionMax} kN/m²</text>

          <!-- 5. Barra Tirante Anclaje a 45º (Inclinada hacia la izquierda bajo zapata) -->
          <line x1="${anchorStartX}" y1="${anchorStartY}" x2="${anchorEndX}" y2="${anchorEndY}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
          <!-- Placa de anclaje final (Línea blanca perpendicular a la barra) -->
          <line x1="${anchorEndX - 8}" y1="${anchorEndY - 8}" x2="${anchorEndX + 8}" y2="${anchorEndY + 8}" stroke="#e2e8f0" stroke-width="4" />
          
          <!-- Angle arc 45º -->
          <path d="M ${anchorStartX - 30} ${anchorStartY} A 30 30 0 0 0 ${anchorStartX - 21} ${anchorStartY + 21}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2" />
          <text x="${anchorStartX - 46}" y="${anchorStartY + 18}" fill="#f59e0b" font-size="10" font-weight="700">45º</text>

          <!-- 6. Cotas de Geometría y Bordes -->
          <!-- Altura H -->
          <line x1="${wallX - 130}" y1="${wallTop}" x2="${wallX - 130}" y2="${groundY}" stroke="#94a3b8" stroke-width="1" />
          <line x1="${wallX - 135}" y1="${wallTop}" x2="${wallX - 125}" y2="${wallTop}" stroke="#94a3b8" stroke-width="1" />
          <line x1="${wallX - 135}" y1="${groundY}" x2="${wallX - 125}" y2="${groundY}" stroke="#94a3b8" stroke-width="1" />
          <text x="${wallX - 150}" y="${(wallTop + groundY) / 2}" fill="#f8fafc" font-size="11" font-weight="800" font-family="monospace" text-anchor="middle" transform="rotate(-90 ${wallX - 150} ${(wallTop + groundY) / 2})">H = ${H} m</text>

          <!-- Longitud hef -->
          <text x="${(anchorStartX + anchorEndX) / 2 - 45}" y="${(anchorStartY + anchorEndY) / 2 + 18}" fill="#fde68a" font-size="10" font-weight="800" font-family="monospace">hef = ${hef} mm</text>

          <!-- Borde ca1 frontal -->
          <line x1="${anchorStartX}" y1="${groundY + 15}" x2="${anchorEndX - 8}" y2="${groundY + 15}" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2,2" />
          <text x="${(anchorStartX + anchorEndX - 8) / 2}" y="${groundY + 28}" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">ca1 = ${ca1} mm</text>

          <!-- Borde ca2 posterior -->
          <line x1="${anchorStartX}" y1="${groundY + 15}" x2="${anchorStartX + 120}" y2="${groundY + 15}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" />
          <text x="${anchorStartX + 60}" y="${groundY + 28}" fill="#94a3b8" font-size="10" font-weight="700" text-anchor="middle">ca2 = ${ca2} mm</text>

          <!-- Ancho Batache label -->
          <rect x="420" y="30" width="150" height="40" rx="6" fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.3)" />
          <text x="495" y="48" fill="#94a3b8" font-size="9" font-weight="700" text-anchor="middle">ANCHO BATACHE</text>
          <text x="495" y="63" fill="#38bdf8" font-size="12" font-weight="800" font-family="monospace" text-anchor="middle">b = ${AnchoBatache} m (${this.values.NumAnclajes} anclajes)</text>
        </svg>

      </div>
    `;

    this.container.innerHTML = svg;
  }
}
