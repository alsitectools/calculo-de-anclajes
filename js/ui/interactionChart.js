/**
 * Renderizador Canvas de Alta Resolución para el Diagrama de Interacción Axil-Cortante
 */

export class InteractionChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.setupHighDPI();
    window.addEventListener('resize', () => {
      this.setupHighDPI();
      if (this.lastData) this.draw(this.lastData);
    });
  }

  setupHighDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 500;
    this.height = rect.height || 320;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  draw(data) {
    this.lastData = data;
    const { curva, traccion, cortante, global, inputs } = data;
    const { puntos, puntoOperacion } = curva;
    const NRd = traccion.NRd;
    const VRd = cortante.VRd;
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

    // Determine scale max
    const maxValX = Math.max(VRd * 1.15, puntoOperacion.x * 1.25, 50);
    const maxValY = Math.max(NRd * 1.15, puntoOperacion.y * 1.25, 50);
    const maxScale = Math.ceil(Math.max(maxValX, maxValY) / 10) * 10;

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

    const step = maxScale <= 60 ? 10 : (maxScale <= 120 ? 20 : 50);
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

    // Axis Titles
    ctx.fillStyle = titleColor;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VRd - Cortante (kN)', padLeft + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('NRd - Axil de Tracción (kN)', 0, 0);
    ctx.restore();

    // 2. Draw Theoretical Curve & Shaded Safety Region
    if (puntos && puntos.length > 0) {
      // Fill region under curve
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(0));
      for (let i = 0; i < puntos.length; i++) {
        ctx.lineTo(scaleX(puntos[i].x), scaleY(puntos[i].y));
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
      for (let i = 0; i < puntos.length; i++) {
        const px = scaleX(puntos[i].x);
        const py = scaleY(puntos[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = isOK ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // 3. Mark Intercept Points (VRd, 0) and (0, NRd)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(scaleX(VRd), scaleY(0), 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(scaleX(0), scaleY(NRd), 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw Operating Point (Vsd, Nsd)
    const opX = scaleX(puntoOperacion.x);
    const opY = scaleY(puntoOperacion.y);

    // Dashed guide lines to axes
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isOK ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(opX, padTop + plotH);
    ctx.lineTo(opX, opY);
    ctx.lineTo(padLeft, opY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point Marker
    ctx.fillStyle = isOK ? '#ef4444' : '#dc2626'; // Red marker like original UserForm
    ctx.beginPath();
    ctx.rect(opX - 5, opY - 5, 10, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Point Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`■ Nsd,Vsd (${puntoOperacion.y.toFixed(1)}, ${puntoOperacion.x.toFixed(1)})`, opX + 8, opY - 6);
  }
}
