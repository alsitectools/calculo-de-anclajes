import { globalUnits } from '../engine/units.js';
import { t } from '../i18n/i18n.js';
import { calculateMuro1Cara } from '../engine/muro1caraEngine.js';

/**
 * Renderizador Canvas de Alta Resolución para el Diagrama de Demanda vs Capacidad de Muro a 1 Cara (M1C)
 * Dibuja la curva de capacidad resistente del cono Nbc,Rd(hef) frente a la demanda Ned.
 */
export class Muro1CaraChart {
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
    const computedH = rect.height > 0 ? rect.height : (this.canvas.parentElement?.clientHeight || 280);

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

    const { inputs, res } = data;
    const isImp = globalUnits.isImperial();
    const forceUnit = isImp ? 'kips' : 'kN';
    const lenUnit = isImp ? 'in' : 'mm';

    const currentHef = inputs.hef; // in mm
    const currentNed = res.demanda.Ned_anclaje; // in kN
    const currentNbcRd = res.hormigon.Nbc_Rd; // in kN
    const isOK = res.hormigon.concrete_ULS_OK;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Padding
    const padLeft = 65;
    const padRight = 35;
    const padTop = 30;
    const padBottom = 45;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Generate curve points for hef from 100mm to max(hef * 1.6, 800)
    const maxHefMM = Math.max(currentHef * 1.5, 800);
    const numPoints = 60;
    const curvePoints = [];

    for (let i = 0; i <= numPoints; i++) {
      const hVal = 50 + (i / numPoints) * maxHefMM;
      const simInputs = { ...inputs, hef: hVal };
      const simRes = calculateMuro1Cara(simInputs);
      curvePoints.push({
        hef: globalUnits.toDisplayLength(hVal),
        cap: globalUnits.toDisplayForce(simRes.hormigon.Nbc_Rd)
      });
    }

    const dispCurrentHef = globalUnits.toDisplayLength(currentHef);
    const dispCurrentNed = globalUnits.toDisplayForce(currentNed);
    const dispCurrentNbcRd = globalUnits.toDisplayForce(currentNbcRd);

    // Determine max axes scales
    const maxCap = Math.max(...curvePoints.map(p => p.cap), dispCurrentNed * 1.25);
    const maxDispX = globalUnits.toDisplayLength(maxHefMM);

    const stepBaseX = isImp ? 5 : 100;
    const stepBaseY = isImp ? 10 : 50;

    const maxX = Math.ceil(maxDispX / stepBaseX) * stepBaseX;
    const maxY = Math.ceil(maxCap / stepBaseY) * stepBaseY;

    const scaleX = val => padLeft + (val / maxX) * plotW;
    const scaleY = val => padTop + plotH - (val / maxY) * plotH;

    // 1. Grid & Axes styling
    const isLight = document.body.classList.contains('light-theme');
    const gridColor = isLight ? '#e2e8f0' : '#1e293b';
    const axisColor = isLight ? '#cbd5e1' : '#475569';
    const labelColor = isLight ? '#64748b' : '#64748b';
    const titleColor = isLight ? '#334155' : '#94a3b8';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // X grid lines
    const stepX = isImp ? (maxX <= 30 ? 5 : 10) : (maxX <= 500 ? 100 : 200);
    for (let vx = 0; vx <= maxX; vx += stepX) {
      const x = scaleX(vx);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${vx}`, x, padTop + plotH + 16);
    }

    // Y grid lines
    const stepY = isImp ? (maxY <= 50 ? 10 : 20) : (maxY <= 200 ? 50 : 100);
    for (let vy = 0; vy <= maxY; vy += stepY) {
      const y = scaleY(vy);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${vy}`, padLeft - 8, y + 3.5);
    }

    // Axes lines
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = titleColor;
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Longitud Anclaje hef (${lenUnit})`, padLeft + plotW / 2, padTop + plotH + 34);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`Tracción / Capacidad (${forceUnit})`, 0, 0);
    ctx.restore();

    // 2. Draw Capacity Curve (Gradient fill & line)
    ctx.save();
    ctx.beginPath();
    curvePoints.forEach((pt, idx) => {
      const x = scaleX(pt.hef);
      const y = scaleY(pt.cap);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(scaleX(curvePoints[curvePoints.length - 1].hef), scaleY(0));
    ctx.lineTo(scaleX(curvePoints[0].hef), scaleY(0));
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    areaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.01)');
    ctx.fillStyle = areaGrad;
    ctx.fill();
    ctx.restore();

    // Curve Line
    ctx.beginPath();
    curvePoints.forEach((pt, idx) => {
      const x = scaleX(pt.hef);
      const y = scaleY(pt.cap);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Draw Demand Horizontal Reference Line (Ned)
    const demandY = scaleY(dispCurrentNed);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = isOK ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, demandY);
    ctx.lineTo(padLeft + plotW, demandY);
    ctx.stroke();
    ctx.restore();

    // 4. Draw Current Operating Point (hef, Ned)
    const ptX = scaleX(dispCurrentHef);
    const ptY = scaleY(dispCurrentNed);

    // Guide drop lines to axes
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = isOK ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.moveTo(ptX, padTop + plotH);
    ctx.lineTo(ptX, ptY);
    ctx.lineTo(padLeft, ptY);
    ctx.stroke();
    ctx.restore();

    // Glow circle
    ctx.beginPath();
    ctx.arc(ptX, ptY, 9, 0, Math.PI * 2);
    ctx.fillStyle = isOK ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)';
    ctx.fill();

    // Center point
    ctx.beginPath();
    ctx.arc(ptX, ptY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isOK ? '#10b981' : '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Tooltip Tag on Point
    const labelText = `Demanda Ned = ${dispCurrentNed} ${forceUnit} (${isOK ? 'OK' : 'FALLO'})`;
    ctx.font = 'bold 11px Outfit, sans-serif';
    const textW = ctx.measureText(labelText).width;
    const boxW = textW + 16;
    const boxH = 24;

    let tagX = ptX + 12;
    let tagY = ptY - 28;
    if (tagX + boxW > padLeft + plotW) tagX = ptX - boxW - 12;
    if (tagY < padTop) tagY = ptY + 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = isOK ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(labelText, tagX + 8, tagY + 16);
  }
}
