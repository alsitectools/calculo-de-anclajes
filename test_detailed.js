import { calculateAnchor } from './js/engine/anchorEngine.js';

const res1 = calculateAnchor({
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

console.log('=== DETAILED TEST 1 (Screenshot 2) ===');
console.log('hefPrime:', res1.traccion.hefPrime.toFixed(2), '(expected ~298 mm)');
console.log('Ncb:', res1.traccion.Ncb.toFixed(2), 'kN');
console.log('NRd (Traccion):', res1.traccion.NRd.toFixed(2), 'kN');
console.log('VRd (Cortante):', res1.cortante.VRd.toFixed(2), 'kN');
console.log('Interacción %:', res1.global.utilizacionResistencia.toFixed(2) + '%', '(expected: 26.72%)');
console.log('Tornillo %:', res1.modosFallo.tornilloAxial.pct.toFixed(1) + '%', '(expected: 10%)');
console.log('Barra DW %:', res1.modosFallo.barraDWAxial.pct.toFixed(1) + '%', '(expected: 10% or 12%)');
console.log('Cono hormigón axial %:', res1.modosFallo.conoHormigonAxial.pct.toFixed(1) + '%', '(expected: 29%)');
console.log('Cabeceo cortante %:', res1.modosFallo.cabeceoCortante.pct.toFixed(1) + '%', '(expected: 31%)');
console.log('Cono metálico cortante %:', res1.modosFallo.conoMetalicoCortante.pct.toFixed(1) + '%', '(expected: 11%)');
