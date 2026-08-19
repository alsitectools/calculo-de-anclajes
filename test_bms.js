import { calculateAnchor } from './js/engine/anchorEngine.js';
import { buildBookmarkValues } from './js/report/docxGenerator.js';

const calc = calculateAnchor({
  tipoCono: 'T1C',
  longitud: 400,
  Nsk: 30,
  Vsk: 30,
  cal: 500,
  car: 500,
  cau: 500,
  cad: 500,
  ha: 400,
  fck: 30,
  afectadoHueco: false,
  fisuracion: 'SI'
});

const bms = buildBookmarkValues(calc, {
  obra: 'TORRE ALBATROS',
  cliente: 'ACCIONA',
  refAnclaje: 'P-12'
});

console.log('Sample bookmark values:');
for (const [k, v] of Object.entries(bms)) {
  console.log(`${k}: ${v}`);
}
