import { calculateMuro1Cara } from './js/engine/muro1caraEngine.js';

console.log('=== TEST MURO 1 CARA ENGINE (Excel Benchmark) ===');

const result = calculateMuro1Cara({
  H: 9,
  PresionMax: 25,
  AnchoBatache: 2,
  NumAnclajes: 4,
  gamma_q: 1.5,
  PespecificoHorm: 25,
  fcj: 35,
  hef: 440,
  ca1: 500,
  ca2: 1500,
  ca3: 200,
  ca4: 900,
  alpha: 45
});

console.log('Hlim:', result.empujes.Hlim, '(Expected: 1.0 m)');
console.log('Fx1:', result.empujes.Fx1, '(Expected: 12.5 kN/m)');
console.log('h_cdg_Fx1:', result.empujes.h_cdg_Fx1.toFixed(3), '(Expected: 8.333 m)');
console.log('Fx2:', result.empujes.Fx2, '(Expected: 200.0 kN/m)');
console.log('h_cdg_Fx2:', result.empujes.h_cdg_Fx2, '(Expected: 4.0 m)');
console.log('Fx_tot:', result.empujes.Fx_tot, '(Expected: 212.5 kN/m)');
console.log('h_cdg_Fx_tot:', result.empujes.h_cdg_Fx_tot.toFixed(4), '(Expected: 4.2549 m)');
console.log('Fx_tot_batache:', result.empujes.Fx_tot_batache, '(Expected: 425.0 kN)');
console.log('Fx_anclaje:', result.empujes.Fx_anclaje, '(Expected: 106.25 kN)');
console.log('Nek_anclaje (SLS):', result.demanda.Nek_anclaje.toFixed(2), '(Expected: 150.26 kN)');
console.log('Ned_anclaje (ULS):', result.demanda.Ned_anclaje.toFixed(2), '(Expected: 225.39 kN)');
console.log('ca1_efectivo:', result.hormigon.ca1_efectivo.toFixed(2), '(Expected: 373.35 mm)');
console.log('Anc0:', result.hormigon.Anc0, '(Expected: 1742400 mm2)');
console.log('Anc:', result.hormigon.Anc.toFixed(1), '(Expected: 888683.0 mm2)');
console.log('Anc/Anc0:', result.hormigon.Anc_ratio.toFixed(4), '(Expected: 0.5100)');
console.log('Nb:', result.hormigon.Nb.toFixed(2), '(Expected: 546.03 kN)');
console.log('Nbc:', result.hormigon.Nbc.toFixed(2), '(Expected: 278.49 kN)');
console.log('Nbc_Rd (ULS):', result.hormigon.Nbc_Rd.toFixed(2), '(Expected: 185.66 kN)');
console.log('Nbc_Rd_ser (SLS):', result.hormigon.Nbc_Rd_ser.toFixed(2), '(Expected: 123.77 kN)');
console.log('Hormigon ULS OK:', result.hormigon.concrete_ULS_OK, '(Expected: false / FALLO)');
console.log('Hormigon SLS OK:', result.hormigon.concrete_SLS_OK, '(Expected: false / FALLO)');

console.log('\n--- VIGAS TIRANTE ---');
console.log('2UPN120 Mel_Rd:', result.vigas['2UPN120'].Mel_Rd.toFixed(2), 'kNm (OK:', result.vigas['2UPN120'].isOk, ') Expected: 4.66 / FALLO');
console.log('2UPN160 Mel_Rd:', result.vigas['2UPN160'].Mel_Rd.toFixed(2), 'kNm (OK:', result.vigas['2UPN160'].isOk, ') Expected: 62.78 / OK');
console.log('2x2UPN120 Mel_Rd:', result.vigas['2x2UPN120'].Mel_Rd.toFixed(2), 'kNm (OK:', result.vigas['2x2UPN120'].isOk, ') Expected: 66.68 / OK');

console.log('\n--- BARRAS TIRANTE ---');
console.log('D15:', result.barras['D15'].isOk, '(Expected: false / FALLO)');
console.log('D20:', result.barras['D20'].isOk, '(Expected: false / FALLO)');
console.log('D26.5:', result.barras['D26_5'].isOk, '(Expected: false / FALLO)');
console.log('D26.5 GANCHO:', result.barras['D26_5_GANCHO'].isOk, '(Expected: true / OK)');
