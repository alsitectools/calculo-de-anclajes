/**
 * Renderizador Paramétrico y Dinámico del Bloque 3D de Hormigón y Cotas en SVG
 * Escala de profundidad = 1/3 de la escala de ancho y alto (S_D = S / 3).
 * Auto-centrado global adaptativo para garantizar contención total y visualización representativa.
 */

export class DiagramView {
  constructor(containerElement, onValueChange) {
    this.container = containerElement;
    this.onValueChange = onValueChange;
    this.values = {
      cal: 500,
      car: 500,
      cau: 500,
      cad: 500,
      ha: 400,
      Vsk: 30,
      Nsk: 30
    };
    this.render();
  }

  updateValues(values) {
    let changed = false;
    for (const [key, val] of Object.entries(values)) {
      if (this.values[key] !== undefined && this.values[key] !== val) {
        this.values[key] = val;
        changed = true;
      }
    }
    if (changed) {
      this.updateGeometry();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="parametric-diagram-wrapper" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; user-select: none;">
        <!-- SVG Canvas for 3D Geometry and Dimension Lines -->
        <svg id="paramSvg" viewBox="0 0 840 560" style="width: 100%; height: 100%; max-height: 520px; display: block; overflow: visible;">
          <defs>
            <!-- Concrete Textures & Gradients -->
            <linearGradient id="frontConcreteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#475569" />
              <stop offset="40%" stop-color="#334155" />
              <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>

            <linearGradient id="topConcreteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#64748b" />
              <stop offset="100%" stop-color="#94a3b8" />
            </linearGradient>

            <linearGradient id="leftConcreteGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            <!-- Metallic Cone Gradient -->
            <radialGradient id="coneMetalGrad" cx="38%" cy="38%" r="62%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="35%" stop-color="#cbd5e1" />
              <stop offset="75%" stop-color="#64748b" />
              <stop offset="100%" stop-color="#1e293b" />
            </radialGradient>

            <!-- Arrow Markers for Dimension Lines -->
            <marker id="dimArrowStart" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 2 5 L 8 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="dimArrowEnd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 2 1.5 L 8 5 L 2 8.5 z" fill="#38bdf8" />
            </marker>

            <!-- Force Arrow Heads -->
            <marker id="forceVArrowHead" viewBox="0 0 12 12" refX="6" refY="11" markerWidth="9" markerHeight="9" orient="auto">
              <path d="M 1 2 L 6 11 L 11 2 Q 6 4 1 2 z" fill="#ef4444" stroke="#991b1b" stroke-width="0.8" />
            </marker>

            <marker id="forceNArrowHead" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto">
              <path d="M 2 1 L 11 6 L 2 11 Q 4 6 2 1 z" fill="#f59e0b" stroke="#b45309" stroke-width="0.8" />
            </marker>

            <!-- Drop shadow for block -->
            <filter id="blockShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="8" dy="14" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
            </filter>
          </defs>

          <!-- Dynamic Geometry Group -->
          <g id="svgGeomGroup"></g>
        </svg>

        <!-- Floating Interactive Badges Overlay (Anchored to exact SVG points) -->
        <div id="badgesOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- Ca,l Badge -->
          <div id="badge_cal" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge">
              <span class="badge-lbl">Ca,l</span>
              <input type="number" id="diag_cal" class="diag-inp" min="50" max="5000" step="10" value="500" />
              <span class="badge-unit">mm</span>
            </div>
          </div>

          <!-- Ca,r Badge -->
          <div id="badge_car" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge">
              <span class="badge-lbl">Ca,r</span>
              <input type="number" id="diag_car" class="diag-inp" min="50" max="5000" step="10" value="500" />
              <span class="badge-unit">mm</span>
            </div>
          </div>

          <!-- Ca,u Badge -->
          <div id="badge_cau" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge">
              <span class="badge-lbl">Ca,u</span>
              <input type="number" id="diag_cau" class="diag-inp" min="50" max="5000" step="10" value="500" />
              <span class="badge-unit">mm</span>
            </div>
          </div>

          <!-- Ca,d Badge -->
          <div id="badge_cad" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge">
              <span class="badge-lbl">Ca,d</span>
              <input type="number" id="diag_cad" class="diag-inp" min="50" max="5000" step="10" value="500" />
              <span class="badge-unit">mm</span>
            </div>
          </div>

          <!-- ha Badge -->
          <div id="badge_ha" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge highlight-ha">
              <span class="badge-lbl">ha</span>
              <input type="number" id="diag_ha" class="diag-inp" min="100" max="5000" step="10" value="400" />
              <span class="badge-unit">mm</span>
            </div>
          </div>

          <!-- Vsk Badge -->
          <div id="badge_Vsk" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge force-v">
              <span class="badge-lbl">Vsk ↓</span>
              <input type="number" id="diag_Vsk" class="diag-inp" min="0" max="1000" step="1" value="30" />
              <span class="badge-unit">kN</span>
            </div>
          </div>

          <!-- Nsk Badge -->
          <div id="badge_Nsk" class="param-badge-overlay" style="position: absolute;">
            <div class="mini-input-badge force-n">
              <span class="badge-lbl">Nsk ↗</span>
              <input type="number" id="diag_Nsk" class="diag-inp" min="0" max="1000" step="1" value="30" />
              <span class="badge-unit">kN</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateGeometry();
  }

  bindEvents() {
    const inputs = this.container.querySelectorAll('.diag-inp');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const id = inp.id.replace('diag_', '');
        const val = parseFloat(inp.value) || 0;
        this.values[id] = val;
        if (this.onValueChange) {
          this.onValueChange(id, val);
        }
        this.updateGeometry();
      });
    });
  }

  generateWavyLine(p1, p2, waves = 6, roughness = 2.5) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;

    let path = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;

    for (let i = 0; i < waves; i++) {
      const t1 = (i + 0.35) / waves;
      const t2 = (i + 0.70) / waves;
      const tEnd = (i + 1) / waves;

      const sign = (i % 2 === 0) ? 1 : -1;
      const amp = roughness * sign;

      const cx1 = p1.x + dx * t1 + nx * amp;
      const cy1 = p1.y + dy * t1 + ny * amp;
      const cx2 = p1.x + dx * t2 - nx * amp;
      const cy2 = p1.y + dy * t2 - ny * amp;
      const ex = p1.x + dx * tEnd;
      const ey = p1.y + dy * tEnd;

      path += ` C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    return path;
  }

  /**
   * Recalcula la geometría paramétrica con escala de profundidad 1/3 (S_D = S / 3)
   */
  updateGeometry() {
    const { cal, car, cau, cad, ha, Vsk, Nsk } = this.values;
    const geomGroup = this.container.querySelector('#svgGeomGroup');
    if (!geomGroup) return;

    // 1. Dimensiones físicas reales del bloque
    const W_real = Math.max(cal + car, 50);
    const H_real = Math.max(cau + cad, 50);
    const D_real = Math.max(ha, 50);

    // 2. Límites del lienzo SVG (840 x 560)
    const svgW = 840;
    const svgH = 560;

    // 3. Márgenes reservados para las cotas y cajas de texto exteriores
    const marginL = 105; // Margen izq (para cota ha y cara lateral)
    const marginR = 95;  // Margen der (para cotas laterales Ca,u / Ca,d e inputs)
    const marginT = 75;  // Margen sup (para cotas superiores Ca,l / Ca,r e inputs)
    const marginB = 55;  // Margen inf (para holgura del bloque y ejes)

    const availW = svgW - marginL - marginR; // ~640px
    const availH = svgH - marginT - marginB; // ~430px

    // 4. Proyección de profundidad en perspectiva:
    // Vector unitario de profundidad (perspectiva hacia atrás-izquierda)
    const ux = 0.85;
    const uy = 0.52;

    // La escala de profundidad es exactamente 1/3 de la de ancho y alto (S_D = S / 3)
    // Demanda de espacio sin escalar:
    const depthDemandX = (D_real / 3) * ux;
    const depthDemandY = (D_real / 3) * uy;

    // 5. Cálculo del factor de escala S para encajar perfectamente en el área disponible
    const scaleX = availW / (W_real + depthDemandX);
    const scaleY = availH / (H_real + depthDemandY);
    const S = Math.min(scaleX, scaleY);

    const W_px = W_real * S;
    const H_px = H_real * S;
    const depthLen = (D_real / 3) * S;

    const depthDx = -depthLen * ux; // Desplazamiento X hacia la izquierda
    const depthDy = -depthLen * uy; // Desplazamiento Y hacia arriba

    // 6. Centrado global de la caja envolvente en el lienzo SVG
    const totalBoxW = W_px + Math.abs(depthDx);
    const totalBoxH = H_px + Math.abs(depthDy);

    // Posición del vértice superior-izquierdo de la cara frontal (P1)
    const startX = marginL + (availW - totalBoxW) / 2 + Math.abs(depthDx);
    const startY = marginT + (availH - totalBoxH) / 2 + Math.abs(depthDy);

    const fx1 = startX;
    const fx2 = startX + W_px;
    const fy1 = startY;
    const fy2 = startY + H_px;

    // 7. Posición exacta del anclaje dentro del bloque
    const anchorCenter = {
      x: fx1 + cal * S,
      y: fy1 + cau * S
    };

    // Vértices cara frontal
    const P1 = { x: fx1, y: fy1 }; // Front top-left
    const P2 = { x: fx2, y: fy1 }; // Front top-right
    const P3 = { x: fx2, y: fy2 }; // Front bottom-right
    const P4 = { x: fx1, y: fy2 }; // Front bottom-left

    // Vértices cara trasera (extrusión 3D proporcional)
    const B1 = { x: fx1 + depthDx, y: fy1 + depthDy }; // Back top-left
    const B2 = { x: fx2 + depthDx, y: fy1 + depthDy }; // Back top-right
    const B3 = { x: fx2 + depthDx, y: fy2 + depthDy }; // Back bottom-right
    const B4 = { x: fx1 + depthDx, y: fy2 + depthDy }; // Back bottom-left

    let svgHtml = '';

    // 1. CARA SUPERIOR (Top Face)
    svgHtml += `
      <polygon points="${P1.x},${P1.y} ${P2.x},${P2.y} ${B2.x},${B2.y} ${B1.x},${B1.y}" 
               fill="url(#topConcreteGrad)" stroke="#475569" stroke-width="1.5" />
    `;

    // 2. CARA LATERAL IZQUIERDA (Left Face)
    svgHtml += `
      <polygon points="${B1.x},${B1.y} ${P1.x},${P1.y} ${P4.x},${P4.y} ${B4.x},${B4.y}" 
               fill="url(#leftConcreteGrad)" stroke="#334155" stroke-width="1.5" />
    `;

    // 3. CARA FRONTAL (Front Face con bordes biselados)
    const topWavy = this.generateWavyLine(P1, P2, 6, 2.5);
    const rightWavy = this.generateWavyLine(P2, P3, 6, 2.5);
    const bottomWavy = this.generateWavyLine(P3, P4, 6, 2.5);
    const leftWavy = this.generateWavyLine(P4, P1, 6, 2.5);

    svgHtml += `
      <polygon points="${P1.x},${P1.y} ${P2.x},${P2.y} ${P3.x},${P3.y} ${P4.x},${P4.y}" 
               fill="url(#frontConcreteGrad)" stroke="#64748b" stroke-width="2" filter="url(#blockShadow)" />
      
      <path d="${topWavy}" fill="none" stroke="#94a3b8" stroke-width="1.2" opacity="0.6" />
      <path d="${leftWavy}" fill="none" stroke="#334155" stroke-width="1.2" opacity="0.6" />
      <path d="${rightWavy}" fill="none" stroke="#475569" stroke-width="1.2" opacity="0.6" />
      <path d="${bottomWavy}" fill="none" stroke="#1e293b" stroke-width="1.2" opacity="0.6" />
    `;

    // 4. LÍNEAS DE EJES DEL ANCLAJE (Dash-Dot)
    svgHtml += `
      <!-- Eje Vertical -->
      <line x1="${anchorCenter.x}" y1="${Math.max(B2.y - 20, 15)}" x2="${anchorCenter.x}" y2="${Math.min(P4.y + 30, svgH - 15)}" 
            stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="10,4,2,4" opacity="0.75" />
      
      <!-- Eje Horizontal -->
      <line x1="${Math.max(B4.x - 20, 15)}" y1="${anchorCenter.y}" x2="${Math.min(P3.x + 35, svgW - 15)}" y2="${anchorCenter.y}" 
            stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="10,4,2,4" opacity="0.75" />

      <!-- Eje de Salida Normal -->
      <line x1="${anchorCenter.x - 35}" y1="${anchorCenter.y - 20}" x2="${anchorCenter.x + 85}" y2="${anchorCenter.y + 48}" 
            stroke="#94a3b8" stroke-width="1" stroke-dasharray="6,3,1,3" opacity="0.5" />
    `;

    // 5. ANCLAJE TREPANTE Y TORNILLO HEXAGONAL
    svgHtml += `
      <ellipse cx="${anchorCenter.x}" cy="${anchorCenter.y}" rx="22" ry="22" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
      <ellipse cx="${anchorCenter.x}" cy="${anchorCenter.y}" rx="17" ry="17" fill="url(#coneMetalGrad)" stroke="#475569" stroke-width="1.5" />
      <ellipse cx="${anchorCenter.x}" cy="${anchorCenter.y}" rx="10" ry="10" fill="#090d16" />

      <!-- Cabeza de tornillo hexagonal 3D -->
      <polygon points="
        ${anchorCenter.x - 6.5},${anchorCenter.y - 3.8} 
        ${anchorCenter.x},${anchorCenter.y - 7.5} 
        ${anchorCenter.x + 6.5},${anchorCenter.y - 3.8} 
        ${anchorCenter.x + 6.5},${anchorCenter.y + 3.8} 
        ${anchorCenter.x},${anchorCenter.y + 7.5} 
        ${anchorCenter.x - 6.5},${anchorCenter.y + 3.8}
      " fill="#334155" stroke="#94a3b8" stroke-width="1.2" />
      <polygon points="
        ${anchorCenter.x - 4.5},${anchorCenter.y - 2.8} 
        ${anchorCenter.x},${anchorCenter.y - 5.5} 
        ${anchorCenter.x + 4.5},${anchorCenter.y - 2.8} 
        ${anchorCenter.x + 4.5},${anchorCenter.y + 2.8} 
        ${anchorCenter.x},${anchorCenter.y + 5.5} 
        ${anchorCenter.x - 4.5},${anchorCenter.y + 2.8}
      " fill="#1e293b" />
    `;

    // 6. LÍNEAS DE COTA (Dimension Lines)
    const dimColor = '#38bdf8';
    const extColor = 'rgba(148, 163, 184, 0.4)';

    // --- COTAS SUPERIORES (Ca,l y Ca,r) ---
    const topDimY = Math.max(Math.min(B1.y, fy1) - 26, 38);

    svgHtml += `
      <line x1="${P1.x}" y1="${P1.y}" x2="${P1.x}" y2="${topDimY - 5}" stroke="${extColor}" stroke-width="1" />
      <line x1="${anchorCenter.x}" y1="${fy1}" x2="${anchorCenter.x}" y2="${topDimY - 5}" stroke="${extColor}" stroke-width="1" />
      <line x1="${P2.x}" y1="${P2.y}" x2="${P2.x}" y2="${topDimY - 5}" stroke="${extColor}" stroke-width="1" />

      <!-- Línea de cota Ca,l -->
      <line x1="${P1.x + 2}" y1="${topDimY}" x2="${anchorCenter.x - 2}" y2="${topDimY}" 
            stroke="${dimColor}" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)" />

      <!-- Línea de cota Ca,r -->
      <line x1="${anchorCenter.x + 2}" y1="${topDimY}" x2="${P2.x - 2}" y2="${topDimY}" 
            stroke="${dimColor}" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)" />
    `;

    // --- COTAS LATERALES DERECHAS (Ca,u y Ca,d) ---
    const rightDimX = Math.min(P2.x + 48, svgW - 55);

    svgHtml += `
      <line x1="${P2.x}" y1="${P2.y}" x2="${rightDimX + 5}" y2="${P2.y}" stroke="${extColor}" stroke-width="1" />
      <line x1="${fx2}" y1="${anchorCenter.y}" x2="${rightDimX + 5}" y2="${anchorCenter.y}" stroke="${extColor}" stroke-width="1" />
      <line x1="${P3.x}" y1="${P3.y}" x2="${rightDimX + 5}" y2="${P3.y}" stroke="${extColor}" stroke-width="1" />

      <!-- Línea de cota Ca,u -->
      <line x1="${rightDimX}" y1="${P2.y + 2}" x2="${rightDimX}" y2="${anchorCenter.y - 2}" 
            stroke="${dimColor}" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)" />

      <!-- Línea de cota Ca,d -->
      <line x1="${rightDimX}" y1="${anchorCenter.y + 2}" x2="${rightDimX}" y2="${P3.y - 2}" 
            stroke="${dimColor}" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)" />
    `;

    // --- COTA DE ESPESOR ha ---
    // Vector unitario perpendicular exterior hacia abajo-izquierda (-0.52, 0.85)
    const haOutX = -0.52;
    const haOutY = 0.85;
    const haCotaDist = 28;

    const haExtStartP4 = { x: P4.x + haOutX * haCotaDist, y: P4.y + haOutY * haCotaDist };
    const haExtStartB4 = { x: B4.x + haOutX * haCotaDist, y: B4.y + haOutY * haCotaDist };

    svgHtml += `
      <!-- Líneas auxiliares de referencia para cota de espesor -->
      <line x1="${P4.x}" y1="${P4.y}" x2="${haExtStartP4.x + haOutX * 5}" y2="${haExtStartP4.y + haOutY * 5}" stroke="${extColor}" stroke-width="1" />
      <line x1="${B4.x}" y1="${B4.y}" x2="${haExtStartB4.x + haOutX * 5}" y2="${haExtStartB4.y + haOutY * 5}" stroke="${extColor}" stroke-width="1" />

      <!-- Línea de cota ha (Doble flecha azul visible) -->
      <line x1="${haExtStartP4.x}" y1="${haExtStartP4.y}" x2="${haExtStartB4.x}" y2="${haExtStartB4.y}" 
            stroke="${dimColor}" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)" />
    `;

    // 7. FLECHAS DE CARGA
    const vArrowStart = { x: anchorCenter.x, y: Math.max(anchorCenter.y - 95, fy1 + 8) };

    svgHtml += `
      <!-- Flecha Vsk (Cortante ↓) - Eje y punta mirando hacia abajo -->
      <line x1="${vArrowStart.x}" y1="${vArrowStart.y}" x2="${anchorCenter.x}" y2="${anchorCenter.y - 20}" 
            stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" />
      <polygon points="
        ${anchorCenter.x - 7.5},${anchorCenter.y - 22} 
        ${anchorCenter.x},${anchorCenter.y - 10} 
        ${anchorCenter.x + 7.5},${anchorCenter.y - 22} 
        ${anchorCenter.x},${anchorCenter.y - 18}
      " fill="#ef4444" stroke="#991b1b" stroke-width="1.2" />

      <!-- Flecha Nsk (Axil ↗) - Flecha amarilla completamente visible -->
      <line x1="${anchorCenter.x + 10}" y1="${anchorCenter.y + 6}" x2="${anchorCenter.x + 50}" y2="${anchorCenter.y + 29}" 
            stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" />
      <polygon points="
        ${anchorCenter.x + 47},${anchorCenter.y + 36} 
        ${anchorCenter.x + 64},${anchorCenter.y + 37} 
        ${anchorCenter.x + 54},${anchorCenter.y + 23.5} 
        ${anchorCenter.x + 52},${anchorCenter.y + 30}
      " fill="#f59e0b" stroke="#b45309" stroke-width="1.2" />
    `;

    geomGroup.innerHTML = svgHtml;

    // 8. REPOSICIONAR LOS BADGES INTERACTIVOS
    const toPct = (val, max) => `${((val / max) * 100).toFixed(2)}%`;

    const setBadgePos = (id, svgX, svgY) => {
      const el = this.container.querySelector(`#badge_${id}`);
      if (el) {
        el.style.left = toPct(svgX, svgW);
        el.style.top = toPct(svgY, svgH);
        el.style.transform = 'translate(-50%, -50%)';
        el.style.pointerEvents = 'auto';
      }
    };

    // Ca,l (Separado hacia arriba de la cota superior izq)
    setBadgePos('cal', (P1.x + anchorCenter.x) / 2, Math.max(topDimY - 20, 16));

    // Ca,r (Separado hacia arriba de la cota superior der)
    setBadgePos('car', (anchorCenter.x + P2.x) / 2, Math.max(topDimY - 20, 16));

    // Ca,u (Centrado horizontalmente sobre la cota vertical sup)
    setBadgePos('cau', rightDimX, (P2.y + anchorCenter.y) / 2);

    // Ca,d (Centrado horizontalmente sobre la cota vertical inf)
    setBadgePos('cad', rightDimX, (anchorCenter.y + P3.y) / 2);

    // ha (Ubicado de forma limpia al lado de la cota de espesor sin tapar el dibujo ni las flechas)
    const haMidX = (haExtStartP4.x + haExtStartB4.x) / 2;
    const haMidY = (haExtStartP4.y + haExtStartB4.y) / 2;
    setBadgePos('ha', Math.max(haMidX - 44, 58), Math.min(haMidY + 18, svgH - 18));

    // Vsk (Centrado horizontalmente en la línea roja vertical, arriba de la punta)
    setBadgePos('Vsk', anchorCenter.x, Math.max(anchorCenter.y - 58, fy1 + 18));

    // Nsk (Desplazado hacia abajo para despejar completamente la flecha amarilla)
    setBadgePos('Nsk', Math.min(anchorCenter.x + 65, svgW - 50), Math.min(anchorCenter.y + 64, svgH - 18));

    // Sincronizar inputs
    const syncInp = (id, val) => {
      const inp = this.container.querySelector(`#diag_${id}`);
      if (inp && document.activeElement !== inp) {
        inp.value = val;
      }
    };

    syncInp('cal', cal);
    syncInp('car', car);
    syncInp('cau', cau);
    syncInp('cad', cad);
    syncInp('ha', ha);
    syncInp('Vsk', Vsk);
    syncInp('Nsk', Nsk);
  }
}
