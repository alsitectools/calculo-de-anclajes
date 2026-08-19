import { globalUnits } from '../engine/units.js';
import { t } from '../i18n/i18n.js';

/**
 * Renderizador Canvas de Alta Resolución para el Diagrama de Interacción Axil-Cortante
 * Soporte bidireccional para Sistema Métrico (kN) e Imperial (kips) y traducción dinámica.
 */

export class InteractionChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.setupHighDPI();
    window.addEventListener('resize', () => {
      if (this.lastData) this.draw(this.lastData);
    });
  }

  setupHighDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const computedW = rect.width > 0 ? rect.width : (this.canvas.parentElement?.clientWidth || 500);
    const computedH = rect.height > 0 ? rect.height : (this.canvas.parentElement?.clientHeight || 320);

    this.width = computedW;
    this.height = computedH;

    this.canvas.width = Math.round(computedW * dpr);
    this.canvas.height = Math.round(computedH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(data) {
    if (!data) return;
    this.lastData = data;
    this.setupHighDPI();
    const { curva, traccion, cortante, global, inputs } = data;
    const { puntos, puntoOperacion } = curva;
    
    // Convert to display units (kN or kips)
    const isImp = globalUnits.isImperial();
    const forceUnit = isImp ? 'kips' : 'kN';
    const NRd = globalUnits.toDisplayForce(traccion.NRd);
    const VRd = globalUnits.toDisplayForce(cortante.VRd);
    const operX = globalUnits.toDisplayForce(puntoOperacion.x);
    const operY = globalUnits.toDisplayForce(puntoOperacion.y);
    const isOK = global.status === 'OK';

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Padding
    const padLeft = 60;
    const padRight = 35;
    const padTop = 30;
    const padBottom = 45;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Determine scale max in display units
    const minScale = isImp ? 12 : 50;
    const maxValX = Math.max(VRd * 1.15, operX * 1.25, minScale);
    const maxValY = Math.max(NRd * 1.15, operY * 1.25, minScale);
    const stepBase = isImp ? 2 : 10;
    const maxScale = Math.ceil(Math.max(maxValX, maxValY) / stepBase) * stepBase;

    const scaleX = val => padLeft + (val / maxScale) * plotW;
    const scaleY = val => padTop + plotH - (val / maxScale) * plotH;

    // 1. Draw Grid & Axes with Theme awareness
    const isLight = document.body.classList.contains('light-theme');
    const gridColor = isLight ? '#e2e8f0' : '#1e293b';
    const axisColor = isLight ? '#cbd5e1' : '#475569';
    const labelColor = isLight ? '#64748b' : '#64748b';
    const titleColor = isLight ? '#334155' : '#94a3b8';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    let step = maxScale <= 60 ? 10 : (maxScale <= 120 ? 20 : 50);
    if (isImp) {
      step = maxScale <= 15 ? 2 : (maxScale <= 30 ? 5 : 10);
    }

    for (let v = 0; v <= maxScale; v += step) {
      // vertical grid
      const x = scaleX(v);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      // horizontal grid
      const y = scaleY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = labelColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(v.toString(), x, padTop + plotH + 16);

      ctx.textAlign = 'right';
      ctx.fillText(v.toString(), padLeft - 10, y + 4);
    }

    // Main Axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Titles (Localized)
    ctx.fillStyle = titleColor;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${t('chart_v_axis')} (${forceUnit})`, padLeft + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${t('chart_n_axis')} (${forceUnit})`, 0, 0);
    ctx.restore();

    // 2. Draw Theoretical Curve & Shaded Safety Region
    if (puntos && puntos.length > 0) {
      const dispPuntos = puntos.map(p => ({
        x: globalUnits.toDisplayForce(p.x),
        y: globalUnits.toDisplayForce(p.y)
      }));

      // Fill region under curve
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(0));
      for (let i = 0; i < dispPuntos.length; i++) {
        ctx.lineTo(scaleX(dispPuntos[i].x), scaleY(dispPuntos[i].y));
      }
      ctx.lineTo(scaleX(VRd), scaleY(0));
      ctx.closePath();

      const gradient = ctx.createLinearGradient(padLeft, padTop, padLeft + plotW, padTop + plotH);
      if (isOK) {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.04)');
      } else {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0.04)');
      }
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke curve line
      ctx.beginPath();
      for (let i = 0; i < dispPuntos.length; i++) {
        const px = scaleX(dispPuntos[i].x);
        const py = scaleY(dispPuntos[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isOK ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 3. Mark Capacities on Axes
    // NRd limit mark
    ctx.fillStyle = isLight ? '#0369a1' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(scaleX(0), scaleY(NRd), 4.5, 0, Math.PI * 2);
    ctx.fill();

    // VRd limit mark
    ctx.beginPath();
    ctx.arc(scaleX(VRd), scaleY(0), 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Plot Operating / Demand Point (Nd, Vd)
    const opX = scaleX(operX);
    const opY = scaleY(operY);

    // Crosshair dashed lines
    ctx.strokeStyle = isOK ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(padLeft, opY);
    ctx.lineTo(opX, opY);
    ctx.lineTo(opX, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]); // reset dash

    // Glowing Demand Point
    ctx.fillStyle = isOK ? '#10b981' : '#ef4444';
    ctx.shadowColor = isOK ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(opX, opY, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(opX, opY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Demand Point Callout Label (Localized)
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    const labelX = Math.min(opX + 10, w - 160);
    const labelY = Math.max(opY - 10, padTop + 20);
    ctx.fillText(`${t('chart_demand')}: (${operX.toFixed(1)}, ${operY.toFixed(1)}) ${forceUnit}`, labelX, labelY);
  }
}
