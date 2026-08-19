/**
 * Diagrama Interactivo 2D/3D SVG para Muro a 1 Cara (M1C)
 * Divide la visualización en dos diagramas coordinados:
 * 1. Izquierda: Vista General del Muro, Escuadra y Diagrama Dinámico de Presiones (H, Pmax, Hlim, Batache).
 * 2. Derecha: Detalle a Gran Escala del Anclaje a 45º, Placa, Cono de Rotura de Hormigón y Cotas, centrado verticalmente en el marco.
 */

export class DiagramMuro1Cara {
  constructor(container, onValueChange) {
    this.container = container;
    this.onValueChange = onValueChange; // Callback para cambios bidireccionales

    this.values = {
      H: 9,              // m
      PresionMax: 25,    // kN/m2
      PespecificoHorm: 25, // kN/m3
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
    const {
      H = 9,
      PresionMax = 25,
      PespecificoHorm = 25,
      AnchoBatache = 2,
      NumAnclajes = 4,
      hef = 440,
      ca1 = 500,
      ca2 = 1500,
      ca3 = 200,
      ca4 = 900
    } = this.values;

    // ==========================================
    // 1. CÁLCULOS GEOMÉTRICOS PARA DIAGRAMA IZQUIERDO (VISTA GENERAL)
    // ==========================================
    const leftW = 340;
    const leftH = 390;

    const leftGroundY = 280;
    const leftWallX = 145;
    const leftWallW = 11;
    
    // Reescalado dinámico con foco central
    const leftWallH = Math.min(240, Math.max(160, 140 + (H / 12) * 100));
    const leftWallTop = leftGroundY - leftWallH;

    const gamma_h = PespecificoHorm > 0 ? PespecificoHorm : 25;
    const Hlim = Math.min(PresionMax / gamma_h, H);
    const hlimRatio = Math.min(1, Math.max(0.04, Hlim / H));
    const hlimPx = leftWallH * hlimRatio;
    const leftHlimY = leftWallTop + hlimPx;

    const leftPressureW = Math.min(110, Math.max(32, 28 + (PresionMax / 60) * 72));

    // Flechas de empuje en vista general
    const numArrowsLeft = 6;
    let arrowsLeftSvg = '';
    for (let i = 0; i < numArrowsLeft; i++) {
      const arrowY = leftGroundY - 14 - (i * (leftWallH - 28) / (numArrowsLeft - 1));
      let curW = leftPressureW;
      if (arrowY < leftHlimY) {
        const triFactor = Math.max(0.06, (arrowY - leftWallTop) / Math.max(1, (leftHlimY - leftWallTop)));
        curW = leftPressureW * triFactor;
      }
      arrowsLeftSvg += `<line x1="${leftWallX - curW}" y1="${arrowY}" x2="${leftWallX - 3}" y2="${arrowY}" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrowM1C)" />\n`;
    }

    const cotaXLeft = Math.max(18, leftWallX - leftPressureW - 25);

    // Mini anclaje en vista general
    const miniAnchorStartX = leftWallX + leftWallW;
    const miniAnchorStartY = leftGroundY;
    const miniAnchorLen = 65;
    const miniAnchorEndX = miniAnchorStartX - miniAnchorLen * Math.cos(Math.PI / 4);
    const miniAnchorEndY = miniAnchorStartY + miniAnchorLen * Math.sin(Math.PI / 4);

    // ==========================================
    // 2. CÁLCULOS GEOMÉTRICOS PARA DIAGRAMA DERECHO (DETALLE CENTRADO VERTICALMENTE)
    // ==========================================
    const rightW = 340;
    const rightH = 390;

    // Centrado vertical: cota del terreno en Y = 135
    const detailGroundY = 135;
    const detailAnchorStartX = 215;
    const detailAnchorStartY = detailGroundY;

    const detailAnchorLen = 165; // Gran escala
    const detailAnchorEndX = detailAnchorStartX - detailAnchorLen * Math.cos(Math.PI / 4);
    const detailAnchorEndY = detailAnchorStartY + detailAnchorLen * Math.sin(Math.PI / 4);

    // Placa de anclaje final (ancho 24px perpendicular a 45º)
    const plateHalf = 11;
    const plateP1 = { x: detailAnchorEndX - plateHalf, y: detailAnchorEndY - plateHalf };
    const plateP2 = { x: detailAnchorEndX + plateHalf, y: detailAnchorEndY + plateHalf };

    // Cono de rotura a gran escala
    const coneTopLeftX = plateP1.x;
    const coneBottomRightX = detailAnchorStartX + 65;
    const coneBottomRightY = detailAnchorEndY - 15;

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; width: 100%; height: 100%;">
        
        <!-- 1. BLOQUE IZQUIERDO: VISTA GENERAL MURO Y EMPUJE -->
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
          
          <!-- Cuadro de texto exterior en minúsculas -->
          <div style="display: flex; justify-content: center; margin-bottom: 0.5rem;">
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 6px; padding: 0.35rem 0.9rem; font-size: 0.82rem; font-weight: 700; color: #f8fafc; letter-spacing: 0.02em; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              Vista General Muro
            </div>
          </div>

          <!-- Marco del Dibujo con fondo infinito de hormigón -->
          <div style="position: relative; flex: 1; min-height: 380px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
            <svg viewBox="0 0 ${leftW} ${leftH}" style="width: 100%; height: 100%;" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="concreteGradM1C_L" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#3b485d" />
                  <stop offset="100%" stop-color="#1e2736" />
                </linearGradient>

                <linearGradient id="wallGradM1C_L" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#c8102e" stop-opacity="0.85" />
                  <stop offset="100%" stop-color="#990b22" stop-opacity="0.95" />
                </linearGradient>

                <linearGradient id="pressureGradM1C_L" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#0284c7" stop-opacity="0.7" />
                </linearGradient>

                <pattern id="diagHatchM1C_L" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" stroke-width="1.5" opacity="0.4" />
                </pattern>

                <marker id="arrowM1C" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                </marker>
              </defs>

              <!-- 1. Terreno / Zapata infinita -->
              <polygon points="0,${leftGroundY} ${leftW},${leftGroundY} ${leftW},${leftH} 0,${leftH}" fill="url(#concreteGradM1C_L)" stroke="none" />
              <polygon points="0,${leftGroundY} ${leftW},${leftGroundY} ${leftW},${leftH} 0,${leftH}" fill="url(#diagHatchM1C_L)" />
              <!-- Línea de cota 0 / superficie del terreno -->
              <line x1="0" y1="${leftGroundY}" x2="${leftW}" y2="${leftGroundY}" stroke="#64748b" stroke-width="2" />

              <!-- Mini Cono y Anclaje -->
              <polygon points="${miniAnchorEndX - 5},${leftGroundY} ${miniAnchorEndX - 5},${miniAnchorEndY - 5} ${miniAnchorEndX + 5},${miniAnchorEndY + 5} ${miniAnchorStartX + 25},${miniAnchorEndY - 5} ${miniAnchorStartX},${leftGroundY}" fill="rgba(239, 68, 68, 0.22)" stroke="none" />
              <line x1="${miniAnchorStartX}" y1="${miniAnchorStartY}" x2="${miniAnchorEndX}" y2="${miniAnchorEndY}" stroke="#f59e0b" stroke-width="3" />
              <line x1="${miniAnchorEndX - 5}" y1="${miniAnchorEndY - 5}" x2="${miniAnchorEndX + 5}" y2="${miniAnchorEndY + 5}" stroke="#ffffff" stroke-width="3" />

              <!-- Encofrado Panel Vertical -->
              <rect x="${leftWallX}" y="${leftWallTop}" width="${leftWallW}" height="${leftWallH}" rx="2" fill="url(#wallGradM1C_L)" stroke="#ffffff" stroke-width="1.2" />

              <!-- Escuadra M1C -->
              <polygon points="${leftWallX + leftWallW},${leftWallTop + leftWallH * 0.12} ${leftWallX + leftWallW + leftWallH * 0.45},${leftGroundY} ${leftWallX + leftWallW},${leftGroundY}" fill="rgba(200,16,46,0.18)" stroke="#c8102e" stroke-width="2.2" />
              <line x1="${leftWallX + leftWallW}" y1="${leftWallTop + leftWallH * 0.52}" x2="${leftWallX + leftWallW + leftWallH * 0.26}" y2="${leftGroundY}" stroke="#c8102e" stroke-width="1.6" stroke-dasharray="2,2" />

              <!-- Polígono de Presiones Dinámico -->
              <polygon points="${leftWallX - leftPressureW},${leftGroundY} ${leftWallX - leftPressureW},${leftHlimY} ${leftWallX},${leftWallTop} ${leftWallX},${leftGroundY}" fill="url(#pressureGradM1C_L)" stroke="#38bdf8" stroke-width="1.6" />
              
              ${arrowsLeftSvg}

              <!-- Indicador Hlim -->
              <line x1="${leftWallX - leftPressureW - 6}" y1="${leftHlimY}" x2="${leftWallX}" y2="${leftHlimY}" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3,2" />
              <text x="${leftWallX - leftPressureW - 10}" y="${leftHlimY + 3.5}" fill="#f59e0b" font-size="9" font-weight="700" text-anchor="end">Hlim ${Hlim.toFixed(2)}m</text>

              <!-- Rótulo Pmax -->
              <text x="${leftWallX - leftPressureW / 2}" y="${leftGroundY - 10}" fill="#ffffff" font-size="9.5" font-weight="800" font-family="monospace" text-anchor="middle">Pmax ${PresionMax}k</text>

              <!-- Cota H -->
              <line x1="${cotaXLeft}" y1="${leftWallTop}" x2="${cotaXLeft}" y2="${leftGroundY}" stroke="#94a3b8" stroke-width="1" />
              <line x1="${cotaXLeft - 4}" y1="${leftWallTop}" x2="${cotaXLeft + 4}" y2="${leftWallTop}" stroke="#94a3b8" stroke-width="1" />
              <line x1="${cotaXLeft - 4}" y1="${leftGroundY}" x2="${cotaXLeft + 4}" y2="${leftGroundY}" stroke="#94a3b8" stroke-width="1" />
              <text x="${cotaXLeft - 12}" y="${(leftWallTop + leftGroundY) / 2}" fill="#f8fafc" font-size="10.5" font-weight="800" font-family="monospace" text-anchor="middle" transform="rotate(-90 ${cotaXLeft - 12} ${(leftWallTop + leftGroundY) / 2})">H = ${H} m</text>

              <!-- Ancho Batache Badge -->
              <rect x="200" y="10" width="125" height="34" rx="5" fill="rgba(15,23,42,0.88)" stroke="rgba(56,189,248,0.35)" />
              <text x="262" y="24" fill="#94a3b8" font-size="8.5" font-weight="700" text-anchor="middle">BATACHE</text>
              <text x="262" y="38" fill="#38bdf8" font-size="11" font-weight="800" font-family="monospace" text-anchor="middle">b=${AnchoBatache}m (${NumAnclajes}u)</text>
            </svg>
          </div>
        </div>

        <!-- 2. BLOQUE DERECHO: DETALLE ANCLAJE (CENTRADO VERTICALMENTE) -->
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
          
          <!-- Cuadro de texto exterior en minúsculas -->
          <div style="display: flex; justify-content: center; margin-bottom: 0.5rem;">
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 0.35rem 0.9rem; font-size: 0.82rem; font-weight: 700; color: #fde68a; letter-spacing: 0.02em; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              Detalle Anclaje
            </div>
          </div>

          <!-- Marco del Dibujo con anclaje centrado verticalmente -->
          <div style="position: relative; flex: 1; min-height: 380px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
            <svg viewBox="0 0 ${rightW} ${rightH}" style="width: 100%; height: 100%;" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="concreteGradM1C_R" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#3b485d" />
                  <stop offset="100%" stop-color="#1e2736" />
                </linearGradient>

                <pattern id="diagHatchM1C_R" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" stroke-width="1.5" opacity="0.4" />
                </pattern>

                <marker id="arrowNedM1C" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                </marker>
              </defs>

              <!-- 1. Terreno / Zapata infinita -->
              <polygon points="0,${detailGroundY} ${rightW},${detailGroundY} ${rightW},${rightH} 0,${rightH}" fill="url(#concreteGradM1C_R)" stroke="none" />
              <polygon points="0,${detailGroundY} ${rightW},${detailGroundY} ${rightW},${rightH} 0,${rightH}" fill="url(#diagHatchM1C_R)" />
              <!-- Línea de cota 0 / superficie del terreno -->
              <line x1="0" y1="${detailGroundY}" x2="${rightW}" y2="${detailGroundY}" stroke="#64748b" stroke-width="2" />

              <!-- Tramo inferior del muro / escuadra en superficie -->
              <rect x="${detailAnchorStartX - 14}" y="${detailGroundY - 45}" width="14" height="45" rx="2" fill="url(#wallGradM1C_L)" stroke="#ffffff" stroke-width="1" />
              <polygon points="${detailAnchorStartX},${detailGroundY - 35} ${detailAnchorStartX + 45},${detailGroundY} ${detailAnchorStartX},${detailGroundY}" fill="rgba(200,16,46,0.2)" stroke="#c8102e" stroke-width="1.5" />

              <!-- Cono de Hormigón a Gran Escala -->
              <polygon points="${coneTopLeftX},${detailGroundY} ${plateP1.x},${plateP1.y} ${plateP2.x},${plateP2.y} ${coneBottomRightX},${coneBottomRightY} ${detailAnchorStartX},${detailGroundY}" fill="rgba(239, 68, 68, 0.18)" stroke="none" />
              
              <!-- Líneas punteadas roja en cara vertical izquierda y base inferior -->
              <line x1="${coneTopLeftX}" y1="${detailGroundY}" x2="${plateP1.x}" y2="${plateP1.y}" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,4" />
              <line x1="${plateP2.x}" y1="${plateP2.y}" x2="${coneBottomRightX}" y2="${coneBottomRightY}" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,4" />

              <!-- Barra Tirante Anclaje a 45º (Dorada gruesa) -->
              <line x1="${detailAnchorStartX}" y1="${detailAnchorStartY}" x2="${detailAnchorEndX}" y2="${detailAnchorEndY}" stroke="#f59e0b" stroke-width="5.5" stroke-linecap="round" />
              
              <!-- Placa de anclaje final blanca -->
              <line x1="${plateP1.x}" y1="${plateP1.y}" x2="${plateP2.x}" y2="${plateP2.y}" stroke="#f8fafc" stroke-width="5.5" />

              <!-- Vector de Tracción Ned saliendo de la barra -->
              <line x1="${detailAnchorStartX}" y1="${detailAnchorStartY}" x2="${detailAnchorStartX + 50}" y2="${detailAnchorStartY - 50}" stroke="#f59e0b" stroke-width="2.5" marker-end="url(#arrowNedM1C)" />
              <text x="${detailAnchorStartX + 56}" y="${detailAnchorStartY - 46}" fill="#f59e0b" font-size="10" font-weight="800" font-family="monospace">Ned</text>

              <!-- Arco de ángulo 45º -->
              <path d="M ${detailAnchorStartX - 38} ${detailAnchorStartY} A 38 38 0 0 0 ${detailAnchorStartX - 27} ${detailAnchorStartY + 27}" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="3,2" />
              <text x="${detailAnchorStartX - 55}" y="${detailAnchorStartY + 22}" fill="#f59e0b" font-size="11" font-weight="800">45º</text>

              <!-- Cota hef a lo largo de la barra -->
              <text x="${(detailAnchorStartX + detailAnchorEndX) / 2 - 58}" y="${(detailAnchorStartY + detailAnchorEndY) / 2 + 25}" fill="#fde68a" font-size="11.5" font-weight="800" font-family="monospace">hef = ${hef} mm</text>

              <!-- Cota ca1 frontal en superficie -->
              <line x1="${detailAnchorStartX}" y1="${detailGroundY + 18}" x2="${coneTopLeftX}" y2="${detailGroundY + 18}" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="3,2" />
              <line x1="${detailAnchorStartX}" y1="${detailGroundY + 14}" x2="${detailAnchorStartX}" y2="${detailGroundY + 22}" stroke="#38bdf8" stroke-width="1.2" />
              <line x1="${coneTopLeftX}" y1="${detailGroundY + 14}" x2="${coneTopLeftX}" y2="${detailGroundY + 22}" stroke="#38bdf8" stroke-width="1.2" />
              <text x="${(detailAnchorStartX + coneTopLeftX) / 2}" y="${detailGroundY + 32}" fill="#38bdf8" font-size="10.5" font-weight="700" text-anchor="middle">ca1 = ${ca1} mm</text>

              <!-- Cota ca2 posterior en superficie -->
              <line x1="${detailAnchorStartX}" y1="${detailGroundY + 18}" x2="${detailAnchorStartX + 95}" y2="${detailGroundY + 18}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,2" />
              <line x1="${detailAnchorStartX + 95}" y1="${detailGroundY + 14}" x2="${detailAnchorStartX + 95}" y2="${detailGroundY + 22}" stroke="#94a3b8" stroke-width="1.2" />
              <text x="${detailAnchorStartX + 48}" y="${detailGroundY + 32}" fill="#94a3b8" font-size="10.5" font-weight="700" text-anchor="middle">ca2 = ${ca2} mm</text>

              <!-- Badges ca3 y ca4 laterales inferiores -->
              <rect x="25" y="${rightH - 45}" width="135" height="28" rx="5" fill="rgba(15,23,42,0.88)" stroke="rgba(148,163,184,0.3)" />
              <text x="92" y="${rightH - 27}" fill="#93c5fd" font-size="9.5" font-weight="700" text-anchor="middle">ca3 (izq) = ${ca3} mm</text>

              <rect x="180" y="${rightH - 45}" width="135" height="28" rx="5" fill="rgba(15,23,42,0.88)" stroke="rgba(148,163,184,0.3)" />
              <text x="247" y="${rightH - 27}" fill="#93c5fd" font-size="9.5" font-weight="700" text-anchor="middle">ca4 (der) = ${ca4} mm</text>
            </svg>
          </div>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
  }
}
