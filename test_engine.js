import { calculateAnchor } from './js/engine/anchorEngine.js';

console.log('=== TEST 1: Screenshot 2 case (T1C, L=400, N=30, V=30, fck=30, cal=500, car=500, cau=500, cad=500, ha=400, Sin Hueco) ===');
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

console.log('Interacción Status:', res1.global.status, '(expected: OK)');
console.log('Verificación de resist %:', res1.global.utilizacionResistencia.toFixed(2) + '%', '(expected: 26.72%)');
console.log('Tornillo axial %:', Math.round(res1.modosFallo.tornilloAxial.pct) + '%', '(expected: 10%)');
console.log('Barra DW axial %:', Math.round(res1.modosFallo.barraDWAxial.pct) + '%', '(expected: 10%)');
console.log('Cono hormigón axial %:', Math.round(res1.modosFallo.conoHormigonAxial.pct) + '%', '(expected: 29%)');
console.log('Cono hormigón cortante %:', Math.round(res1.modosFallo.conoHormigonCortante.pct) + '%', '(expected: 0%)');
console.log('Cabeceo cortante %:', Math.round(res1.modosFallo.cabeceoCortante.pct) + '%', '(expected: 31%)');
console.log('Cono metálico cortante %:', Math.round(res1.modosFallo.conoMetalicoCortante.pct) + '%', '(expected: 11%)');

console.log('\n=== TEST 2: Screenshot 3,4,5 case (240, L=213, N=10, V=10, fck=30, cal=1000, car=1000, cau=1000, cad=1000, ha=1000, Sin Hueco) ===');
const res2 = calculateAnchor({
  tipoCono: '240',
  longitud: 213,
  Nsk: 10,
  Vsk: 10,
  cal: 1000,
  car: 1000,
  cau: 1000,
  cad: 1000,
  ha: 1000,
  fck: 30,
  afectadoHueco: false,
  fisuracion: 'SI'
});

console.log('Tracción Rd:', res2.traccion.NRd.toFixed(1), '(expected: 101.2 kN)');
console.log('Tracción Factor:', res2.traccion.ratio.toFixed(3), '(expected: 0.099)');
console.log('Cortante Rd:', res2.cortante.VRd.toFixed(1), '(expected: 52.3 kN)');
console.log('Cortante Factor:', res2.cortante.ratio.toFixed(3), '(expected: 0.191)');
console.log('Tornillo Factor:', res2.tornillo.ratio.toFixed(3), '(expected: 0.123)');
console.log('Interacción %:', (res2.global.interaccion * 100).toFixed(2) + '%', '(expected: 8.46%)');
