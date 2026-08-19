/**
 * Diagrama Interactivo 2D/3D SVG para Muro a 1 Cara (M1C)
 * Divide la visualización en 3 esquemas coordinados:
 * 1. Columna Izquierda: Vista General del Muro (con altura perfectamente alineada con la base de Planta Anclajes).
 * 2. Columna Derecha - Superior: Detalle Anclaje (Sección a 45º) con el suelo en el centro vertical y Badges Interactivos para ca1, ca2 y hef.
 * 3. Columna Derecha - Inferior: Planta Anclajes de lado a lado con las puntas de las flechas de cota tocando exactamente las líneas discontinuas de referencia.
 */

import { globalUnits } from '../engine/units.js';

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

    // Si un input del diagrama tiene el foco, actualizamos los demás sin re-renderizar para no perder el cursor
    const activeEl = document.activeElement;
    if (activeEl && activeEl.classList.contains('diag-inp') && this.container.contains(activeEl)) {
      ['ca1', 'ca2', 'ca3', 'ca4', 'hef'].forEach(k => {
        const inp = this.container.querySelector(`#diag_m1c_${k}`);
        if (inp && inp !== activeEl) {
          inp.value = globalUnits.toDisplayLength(this.values[k]);
        }
      });
      const inpB = this.container.querySelector('#diag_m1c_AnchoBatache');
      if (inpB && inpB !== activeEl) {
        inpB.value = this.values.AnchoBatache;
      }
      return;
    }

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

    const unitLabels = globalUnits.getUnitLabels();
    const unitLen = unitLabels.length;
    const unitStep = unitLabels.lengthStep;

    const ca1Display = globalUnits.toDisplayLength(ca1);
    const ca2Display = globalUnits.toDisplayLength(ca2);
    const ca3Display = globalUnits.toDisplayLength(ca3);
    const ca4Display = globalUnits.toDisplayLength(ca4);
    const hefDisplay = globalUnits.toDisplayLength(hef);

    const toPct = (val, max) => `${((val / max) * 100).toFixed(2)}%`;

    // ==========================================
    // 1. CÁLCULOS GEOMÉTRICOS PARA DIAGRAMA IZQUIERDO (VISTA GENERAL ALINEADA)
    // ==========================================
    const leftW = 360;
    const leftH = 460;

    const leftGroundY = 325;
    const leftWallX = 145;
    const leftWallW = 12;
    
    const leftWallH = Math.min(270, Math.max(160, 150 + (H / 12) * 110));
    const leftWallTop = leftGroundY - leftWallH;

    const gamma_h = PespecificoHorm > 0 ? PespecificoHorm : 25;
    const Hlim = Math.min(PresionMax / gamma_h, H);
    const hlimRatio = Math.min(1, Math.max(0.04, Hlim / H));
    const hlimPx = leftWallH * hlimRatio;
    const leftHlimY = leftWallTop + hlimPx;

    const leftPressureW = Math.min(115, Math.max(35, 30 + (PresionMax / 60) * 75));

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

    // Cota H a la derecha del muro y de la escuadra
    const escuadraFootX = leftWallX + leftWallW + leftWallH * 0.45;
    const cotaXRight = Math.min(340, Math.max(285, escuadraFootX + 22));

    // Mini anclaje en vista general
    const miniAnchorStartX = leftWallX + leftWallW;
    const miniAnchorStartY = leftGroundY;
    const miniAnchorLen = 65;
    const miniAnchorEndX = miniAnchorStartX - miniAnchorLen * Math.cos(Math.PI / 4);
    const miniAnchorEndY = miniAnchorStartY + miniAnchorLen * Math.sin(Math.PI / 4);

    // ==========================================
    // 2. CÁLCULOS GEOMÉTRICOS PARA DIAGRAMA 2 (DETALLE SECCIÓN ANCLAJE)
    // ==========================================
    const secW = 460;
    const secH = 220;

    const secGroundY = 110;
    const secAnchorStartX = 275;
    const secAnchorStartY = secGroundY;

    const secAnchorLen = 115;
    const secAnchorEndX = secAnchorStartX - secAnchorLen * Math.cos(Math.PI / 4);
    const secAnchorEndY = secAnchorStartY + secAnchorLen * Math.sin(Math.PI / 4);

    const secPlateHalf = 10;
    const secPlateP1 = { x: secAnchorEndX - secPlateHalf, y: secAnchorEndY - secPlateHalf };
    const secPlateP2 = { x: secAnchorEndX + secPlateHalf, y: secAnchorEndY + secPlateHalf };

    const secConeTopLeftX = secPlateP1.x;
    const secConeBottomRightX = secAnchorStartX + 52;
    const secConeBottomRightY = secAnchorEndY - 10;

    const secTopDimY = secGroundY - 22;
    const secCa2EndX = secAnchorStartX + 95;

    const ca1BadgeX = (secConeTopLeftX + secAnchorStartX) / 2;
    const ca1BadgeY = secTopDimY - 14;

    const ca2BadgeX = (secAnchorStartX + secCa2EndX) / 2;
    const ca2BadgeY = secTopDimY - 14;

    const hefBadgeX = (secAnchorStartX + secAnchorEndX) / 2 - 38;
    const hefBadgeY = (secAnchorStartY + secAnchorEndY) / 2 + 8;

    // ==========================================
    // 3. CÁLCULOS GEOMÉTRICOS PARA DIAGRAMA 3 (PLANTA ANCLAJES ANCHO COMPLETO)
    // ==========================================
    const planW = 460;
    const planH = 250;

    const planWallY = 108;
    const group1Center = 135;
    const group2Center = 325;

    const rod1L = 115;
    const rod1R = 155;
    const rod2L = 305;
    const rod2R = 345;

    // Inputs superiores ca4 y ca3 (y = 18)
    const ca4BadgeX = (rod1R + rod2L) / 2; // 230
    const ca4BadgeY = 18;

    const ca3BadgeX = (group2Center + rod2R) / 2; // 335
    const ca3BadgeY = 18;

    // Cotas superiores (y = 38)
    const planDimY = 38;

    const plateY = 70;
    const anchorEndY = 186;

    // Cota inferior para Ancho de Batache (y = 222)
    const planBatacheY = 222;
    const batacheLeftX = 30;
    const batacheRightX = 430;
    const batacheBadgeX = (batacheLeftX + batacheRightX) / 2;
    const batacheBadgeY = 222;

    const html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; width: 100%; align-items: stretch;">
        
        <!-- 1. COLUMNA IZQUIERDA: VISTA GENERAL MURO Y EMPUJE (Alineado con el final de Planta Anclajes) -->
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
          
          <div style="display: flex; justify-content: center; margin-bottom: 0.4rem; height: 28px; align-items: center;">
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 6px; padding: 0.3rem 0.85rem; font-size: 0.80rem; font-weight: 700; color: #f8fafc; letter-spacing: 0.02em; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              Vista General Muro
            </div>
          </div>

          <div style="position: relative; flex: 1; height: calc(100% - 35px); min-height: 490px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
            <svg viewBox="0 0 ${leftW} ${leftH}" style="width: 100%; height: 100%;" preserveAspectRatio="none">
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
              <line x1="0" y1="${leftGroundY}" x2="${leftW}" y2="${leftGroundY}" stroke="#64748b" stroke-width="2" />

              <!-- Mini Cono y Anclaje -->
              <polygon points="${miniAnchorEndX - 5},${leftGroundY} ${miniAnchorEndX - 5},${miniAnchorEndY - 5} ${miniAnchorEndX + 5},${miniAnchorEndY + 5} ${miniAnchorStartX + 25},${miniAnchorEndY - 5} ${miniAnchorStartX},${leftGroundY}" fill="rgba(239, 68, 68, 0.22)" stroke="none" />
              <line x1="${miniAnchorStartX}" y1="${miniAnchorStartY}" x2="${miniAnchorEndX}" y2="${miniAnchorEndY}" stroke="#f59e0b" stroke-width="3.5" />
              <line x1="${miniAnchorEndX - 5}" y1="${miniAnchorEndY - 5}" x2="${miniAnchorEndX + 5}" y2="${miniAnchorEndY + 5}" stroke="#ffffff" stroke-width="3.5" />

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
              <text x="${leftWallX - leftPressureW - 10}" y="${leftHlimY + 3.5}" fill="#f59e0b" font-size="9.5" font-weight="700" text-anchor="end">Hlim ${Hlim.toFixed(2)}m</text>

              <!-- Rótulo Pmax -->
              <text x="${leftWallX - leftPressureW / 2}" y="${leftGroundY - 10}" fill="#ffffff" font-size="10" font-weight="800" font-family="monospace" text-anchor="middle">Pmax ${PresionMax}k</text>

              <!-- Cota H a la derecha del dibujo -->
              <line x1="${cotaXRight}" y1="${leftWallTop}" x2="${cotaXRight}" y2="${leftGroundY}" stroke="#94a3b8" stroke-width="1.2" />
              <line x1="${cotaXRight - 4}" y1="${leftWallTop}" x2="${cotaXRight + 4}" y2="${leftWallTop}" stroke="#94a3b8" stroke-width="1.2" />
              <line x1="${cotaXRight - 4}" y1="${leftGroundY}" x2="${cotaXRight + 4}" y2="${leftGroundY}" stroke="#94a3b8" stroke-width="1.2" />
              <text x="${cotaXRight + 14}" y="${(leftWallTop + leftGroundY) / 2}" fill="#f8fafc" font-size="11" font-weight="800" font-family="monospace" text-anchor="middle" transform="rotate(90 ${cotaXRight + 14} ${(leftWallTop + leftGroundY) / 2})">H = ${H} m</text>

              <!-- Ancho Batache Badge en la esquina superior izquierda -->
              <rect x="15" y="10" width="125" height="34" rx="5" fill="rgba(15,23,42,0.88)" stroke="rgba(56,189,248,0.35)" />
              <text x="77" y="24" fill="#94a3b8" font-size="8.5" font-weight="700" text-anchor="middle">BATACHE</text>
              <text x="77" y="38" fill="#38bdf8" font-size="11" font-weight="800" font-family="monospace" text-anchor="middle">b=${AnchoBatache}m (${NumAnclajes}u)</text>
            </svg>
          </div>
        </div>

        <!-- 2. COLUMNA DERECHA: DETALLE SECCIÓN (ARRIBA) Y PLANTA ANCLAJES (ABAJO) -->
        <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
          
          <!-- BLOQUE 2: DETALLE ANCLAJE (SECCIÓN A 45º) -->
          <div style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; justify-content: center; margin-bottom: 0.4rem; height: 28px; align-items: center;">
              <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; padding: 0.3rem 0.85rem; font-size: 0.80rem; font-weight: 700; color: #fde68a; letter-spacing: 0.02em; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                Detalle Anclaje
              </div>
            </div>

            <div style="position: relative; height: 220px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
              <svg viewBox="0 0 ${secW} ${secH}" style="width: 100%; height: 100%;" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="concreteGradM1C_Sec" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#3b485d" />
                    <stop offset="100%" stop-color="#1e2736" />
                  </linearGradient>

                  <pattern id="diagHatchM1C_Sec" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" stroke-width="1.5" opacity="0.4" />
                  </pattern>

                  <marker id="arrowNedM1C_Sec" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>

                  <marker id="dimArrowStartM1C_Sec" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id="dimArrowEndM1C_Sec" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                </defs>

                <!-- Terreno / Zapata infinita -->
                <polygon points="0,${secGroundY} ${secW},${secGroundY} ${secW},${secH} 0,${secH}" fill="url(#concreteGradM1C_Sec)" stroke="none" />
                <polygon points="0,${secGroundY} ${secW},${secGroundY} ${secW},${secH} 0,${secH}" fill="url(#diagHatchM1C_Sec)" />
                <line x1="0" y1="${secGroundY}" x2="${secW}" y2="${secGroundY}" stroke="#64748b" stroke-width="2" />

                <!-- Muro y Escuadra superior -->
                <rect x="${secAnchorStartX - 13}" y="${secGroundY - 45}" width="13" height="45" rx="2" fill="url(#wallGradM1C_L)" stroke="#ffffff" stroke-width="1" />
                <polygon points="${secAnchorStartX},${secGroundY - 36} ${secAnchorStartX + 42},${secGroundY} ${secAnchorStartX},${secGroundY}" fill="rgba(200,16,46,0.2)" stroke="#c8102e" stroke-width="1.6" />

                <!-- Cono de Hormigón -->
                <polygon points="${secConeTopLeftX},${secGroundY} ${secPlateP1.x},${secPlateP1.y} ${secPlateP2.x},${secPlateP2.y} ${secConeBottomRightX},${secConeBottomRightY} ${secAnchorStartX},${secGroundY}" fill="rgba(239, 68, 68, 0.18)" stroke="none" />
                <line x1="${secConeTopLeftX}" y1="${secGroundY}" x2="${secPlateP1.x}" y2="${secPlateP1.y}" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3" />
                <line x1="${secPlateP2.x}" y1="${secPlateP2.y}" x2="${secConeBottomRightX}" y2="${secConeBottomRightY}" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3" />

                <!-- Barra Anclaje 45º (Dorada y Blanca) -->
                <line x1="${secAnchorStartX}" y1="${secAnchorStartY}" x2="${secAnchorEndX}" y2="${secAnchorEndY}" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />
                <line x1="${secPlateP1.x}" y1="${secPlateP1.y}" x2="${secPlateP2.x}" y2="${secPlateP2.y}" stroke="#f8fafc" stroke-width="5" />

                <!-- Vector Ned -->
                <line x1="${secAnchorStartX}" y1="${secAnchorStartY}" x2="${secAnchorStartX + 52}" y2="${secAnchorStartY - 52}" stroke="#f59e0b" stroke-width="2.2" marker-end="url(#arrowNedM1C_Sec)" />
                <text x="${secAnchorStartX + 58}" y="${secAnchorStartY - 47}" fill="#f59e0b" font-size="10" font-weight="800" font-family="monospace">Ned</text>

                <!-- Arco 45º -->
                <path d="M ${secAnchorStartX - 30} ${secAnchorStartY} A 30 30 0 0 0 ${secAnchorStartX - 21} ${secAnchorStartY + 21}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2" />
                <text x="${secAnchorStartX - 45}" y="${secAnchorStartY + 16}" fill="#f59e0b" font-size="10" font-weight="800">45º</text>

                <!-- Cotas estilo ingeniería ca1 y ca2 -->
                <line x1="${secConeTopLeftX}" y1="${secGroundY}" x2="${secConeTopLeftX}" y2="${secTopDimY - 8}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" />
                <line x1="${secAnchorStartX}" y1="${secGroundY}" x2="${secAnchorStartX}" y2="${secTopDimY - 8}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" />
                <line x1="${secCa2EndX}" y1="${secGroundY}" x2="${secCa2EndX}" y2="${secTopDimY - 8}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" />

                <line x1="${secConeTopLeftX}" y1="${secTopDimY}" x2="${secAnchorStartX}" y2="${secTopDimY}" stroke="#38bdf8" stroke-width="1.4" marker-start="url(#dimArrowStartM1C_Sec)" marker-end="url(#dimArrowEndM1C_Sec)" />
                <line x1="${secAnchorStartX}" y1="${secTopDimY}" x2="${secCa2EndX}" y2="${secTopDimY}" stroke="#38bdf8" stroke-width="1.4" marker-start="url(#dimArrowStartM1C_Sec)" marker-end="url(#dimArrowEndM1C_Sec)" />
              </svg>

              <!-- Badges Interactivos Sección -->
              <div id="badge_m1c_ca1" class="param-badge-overlay" style="position: absolute; left: ${toPct(ca1BadgeX, secW)}; top: ${toPct(ca1BadgeY, secH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge">
                  <span class="badge-lbl">ca,1</span>
                  <input type="number" id="diag_m1c_ca1" class="diag-inp" min="50" max="5000" step="${unitStep}" value="${ca1Display}" />
                  <span class="badge-unit">${unitLen}</span>
                </div>
              </div>

              <div id="badge_m1c_ca2" class="param-badge-overlay" style="position: absolute; left: ${toPct(ca2BadgeX, secW)}; top: ${toPct(ca2BadgeY, secH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge">
                  <span class="badge-lbl">ca,2</span>
                  <input type="number" id="diag_m1c_ca2" class="diag-inp" min="50" max="5000" step="${unitStep}" value="${ca2Display}" />
                  <span class="badge-unit">${unitLen}</span>
                </div>
              </div>

              <div id="badge_m1c_hef" class="param-badge-overlay" style="position: absolute; left: ${toPct(hefBadgeX, secW)}; top: ${toPct(hefBadgeY, secH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge highlight-ha">
                  <span class="badge-lbl">hef</span>
                  <input type="number" id="diag_m1c_hef" class="diag-inp" min="50" max="5000" step="${unitStep}" value="${hefDisplay}" />
                  <span class="badge-unit">${unitLen}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- BLOQUE 3: DETALLE EN PLANTA (CON FLECHAS TOCANDO EXACTAMENTE LAS LÍNEAS DISCONTINUAS) -->
          <div style="display: flex; flex-direction: column; width: 100%;">
            <div style="display: flex; justify-content: center; margin-bottom: 0.4rem; height: 28px; align-items: center;">
              <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 6px; padding: 0.3rem 0.85rem; font-size: 0.80rem; font-weight: 700; color: #bae6fd; letter-spacing: 0.02em; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                Planta Anclajes
              </div>
            </div>

            <div style="position: relative; height: 250px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at center, #1a2234 0%, #0d121d 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.15);">
              <svg viewBox="0 0 ${planW} ${planH}" style="width: 100%; height: 100%;" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="concreteGradM1C_Plan" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#3b485d" />
                    <stop offset="100%" stop-color="#1e2736" />
                  </linearGradient>

                  <pattern id="diagHatchM1C_Plan" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" stroke-width="1.5" opacity="0.4" />
                  </pattern>

                  <!-- Marcadores con la punta EXACTA en refX=0 y refX=10 -->
                  <marker id="dimArrowStartM1C_Plan" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id="dimArrowEndM1C_Plan" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                </defs>

                <!-- Fondo Losa Hormigón en Planta (De lado a lado) -->
                <polygon points="0,0 ${planW},0 ${planW},${planH} 0,${planH}" fill="url(#concreteGradM1C_Plan)" stroke="none" />
                <polygon points="0,0 ${planW},0 ${planW},${planH} 0,${planH}" fill="url(#diagHatchM1C_Plan)" />

                <!-- Eje Central del Grupo Derecho (Dashed Axis Line) -->
                <line x1="${group2Center}" y1="26" x2="${group2Center}" y2="200" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="8,4,2,4" opacity="0.85" />

                <!-- ================= ANCLAJES (BARRAS AMARILLAS Y PLACAS BLANCAS) ================= -->
                <!-- Grupo 1 Izquierda: 2 barras de anclaje amarillas con placa blanca -->
                <!-- Barra 1.1 -->
                <line x1="${rod1L}" y1="${plateY}" x2="${rod1L}" y2="${anchorEndY}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />
                <line x1="${rod1L - 10}" y1="${plateY}" x2="${rod1L + 10}" y2="${plateY}" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round" />
                
                <!-- Barra 1.2 -->
                <line x1="${rod1R}" y1="${plateY}" x2="${rod1R}" y2="${anchorEndY}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />
                <line x1="${rod1R - 10}" y1="${plateY}" x2="${rod1R + 10}" y2="${plateY}" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round" />

                <!-- Grupo 2 Derecha: 2 barras de anclaje amarillas con placa blanca -->
                <!-- Barra 2.1 -->
                <line x1="${rod2L}" y1="${plateY}" x2="${rod2L}" y2="${anchorEndY}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />
                <line x1="${rod2L - 10}" y1="${plateY}" x2="${rod2L + 10}" y2="${plateY}" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round" />

                <!-- Barra 2.2 -->
                <line x1="${rod2R}" y1="${plateY}" x2="${rod2R}" y2="${anchorEndY}" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />
                <line x1="${rod2R - 10}" y1="${plateY}" x2="${rod2R + 10}" y2="${plateY}" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round" />

                <!-- ================= ENCOFRADO HORIZONTAL ROJO (DE LADO A LADO) ================= -->
                <rect x="0" y="${planWallY}" width="${planW}" height="14" rx="2" fill="url(#wallGradM1C_L)" stroke="#ffffff" stroke-width="1.2" />

                <!-- ================= ESCUADRA BASE (UPN ROJOS Y PLACAS REPARTO) ================= -->
                <!-- Grupo 1 -->
                <rect x="${group1Center - 10}" y="122" width="8" height="85" fill="#c8102e" stroke="#990b22" stroke-width="1" />
                <rect x="${group1Center + 2}" y="122" width="8" height="85" fill="#c8102e" stroke="#990b22" stroke-width="1" />
                <rect x="${group1Center - 28}" y="146" width="56" height="24" rx="2" fill="#451a03" stroke="#78350f" stroke-width="1.2" />
                <polygon points="${rod1L - 4},154 ${rod1L + 4},150 ${rod1L + 4},162 ${rod1L - 4},166" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
                <polygon points="${rod1R - 4},154 ${rod1R + 4},150 ${rod1R + 4},162 ${rod1R - 4},166" fill="#facc15" stroke="#ca8a04" stroke-width="1" />

                <!-- Grupo 2 -->
                <rect x="${group2Center - 10}" y="122" width="8" height="85" fill="#c8102e" stroke="#990b22" stroke-width="1" />
                <rect x="${group2Center + 2}" y="122" width="8" height="85" fill="#c8102e" stroke="#990b22" stroke-width="1" />
                <rect x="${group2Center - 28}" y="146" width="56" height="24" rx="2" fill="#451a03" stroke="#78350f" stroke-width="1.2" />
                <polygon points="${rod2L - 4},154 ${rod2L + 4},150 ${rod2L + 4},162 ${rod2L - 4},166" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
                <polygon points="${rod2R - 4},154 ${rod2R + 4},150 ${rod2R + 4},162 ${rod2R - 4},166" fill="#facc15" stroke="#ca8a04" stroke-width="1" />

                <!-- ================= COTAS SUPERIORES EN PLANTA (ca3 y ca4) ================= -->
                <!-- Líneas de extensión vertical hacia arriba (Sobrepasan 10px la línea de cota) -->
                <line x1="${rod1R}" y1="${plateY - 2}" x2="${rod1R}" y2="${planDimY - 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" stroke-dasharray="3,2" />
                <line x1="${rod2L}" y1="${plateY - 2}" x2="${rod2L}" y2="${planDimY - 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" stroke-dasharray="3,2" />
                <line x1="${group2Center}" y1="26" x2="${group2Center}" y2="${planDimY - 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" />
                <line x1="${rod2R}" y1="${plateY - 2}" x2="${rod2R}" y2="${planDimY - 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" stroke-dasharray="3,2" />

                <!-- Línea de cota ca4 (Puntas tocan exactamente rod1R y rod2L) -->
                <line x1="${rod1R}" y1="${planDimY}" x2="${rod2L}" y2="${planDimY}" stroke="#38bdf8" stroke-width="1.4" marker-start="url(#dimArrowStartM1C_Plan)" marker-end="url(#dimArrowEndM1C_Plan)" />
                <text x="${ca4BadgeX}" y="${planDimY + 14}" fill="#94a3b8" font-size="8.5" font-weight="700" font-family="monospace" text-anchor="middle">ca4 ≤ 1.5 hef</text>

                <!-- Línea de cota ca3 (Puntas tocan exactamente group2Center y rod2R) -->
                <line x1="${group2Center}" y1="${planDimY}" x2="${rod2R}" y2="${planDimY}" stroke="#38bdf8" stroke-width="1.4" marker-start="url(#dimArrowStartM1C_Plan)" marker-end="url(#dimArrowEndM1C_Plan)" />
                <text x="${ca3BadgeX}" y="${planDimY + 14}" fill="#94a3b8" font-size="8.5" font-weight="700" font-family="monospace" text-anchor="middle">ca3 ≤ 1.5 hef</text>

                <!-- ================= COTA INFERIOR ANCHO DE BATACHE (b) ================= -->
                <!-- Líneas de extensión vertical hacia abajo (Sobrepasan 10px la línea de cota) -->
                <line x1="${batacheLeftX}" y1="120" x2="${batacheLeftX}" y2="${planBatacheY + 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" stroke-dasharray="3,2" />
                <line x1="${batacheRightX}" y1="120" x2="${batacheRightX}" y2="${planBatacheY + 10}" stroke="rgba(148, 163, 184, 0.45)" stroke-width="1" stroke-dasharray="3,2" />

                <!-- Línea de cota b (Puntas tocan exactamente batacheLeftX y batacheRightX) -->
                <line x1="${batacheLeftX}" y1="${planBatacheY}" x2="${batacheRightX}" y2="${planBatacheY}" stroke="#38bdf8" stroke-width="1.4" marker-start="url(#dimArrowStartM1C_Plan)" marker-end="url(#dimArrowEndM1C_Plan)" />
              </svg>

              <!-- Badges Interactivos Planta (ca4 y ca3 arriba) -->
              <div id="badge_m1c_ca4" class="param-badge-overlay" style="position: absolute; left: ${toPct(ca4BadgeX, planW)}; top: ${toPct(ca4BadgeY, planH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge">
                  <span class="badge-lbl">ca,4</span>
                  <input type="number" id="diag_m1c_ca4" class="diag-inp" min="50" max="5000" step="${unitStep}" value="${ca4Display}" />
                  <span class="badge-unit">${unitLen}</span>
                </div>
              </div>

              <div id="badge_m1c_ca3" class="param-badge-overlay" style="position: absolute; left: ${toPct(ca3BadgeX, planW)}; top: ${toPct(ca3BadgeY, planH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge">
                  <span class="badge-lbl">ca,3</span>
                  <input type="number" id="diag_m1c_ca3" class="diag-inp" min="50" max="5000" step="${unitStep}" value="${ca3Display}" />
                  <span class="badge-unit">${unitLen}</span>
                </div>
              </div>

              <!-- Badge Interactivo Inferior: Ancho de Batache b -->
              <div id="badge_m1c_b" class="param-badge-overlay" style="position: absolute; left: ${toPct(batacheBadgeX, planW)}; top: ${toPct(batacheBadgeY, planH)}; transform: translate(-50%, -50%);">
                <div class="mini-input-badge highlight-ha">
                  <span class="badge-lbl">b</span>
                  <input type="number" id="diag_m1c_AnchoBatache" class="diag-inp" min="0.5" max="10" step="0.1" value="${AnchoBatache}" />
                  <span class="badge-unit">m</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const inputs = this.container.querySelectorAll('.diag-inp');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const id = inp.id.replace('diag_m1c_', '');
        const raw = parseFloat(inp.value) || 0;
        let valSI = raw;
        if (id !== 'AnchoBatache') {
          valSI = globalUnits.fromDisplayLength(raw);
        }
        this.values[id] = valSI;
        if (this.onValueChange) {
          this.onValueChange(id, valSI);
        }
      });
    });
  }
}
