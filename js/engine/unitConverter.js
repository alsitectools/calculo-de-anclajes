/**
 * Sistema de Conversión de Unidades de Ingeniería Estructural
 * Sistema Internacional (SI / Métrico: mm, kN, MPa) <-> Sistema Imperial (US: in, kips/lbf, psi)
 */

export const UNITS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
};

export const CONV = {
  // Longitud: 1 in = 25.4 mm
  mmToIn: (mm) => mm / 25.4,
  inToMm: (inch) => inch * 25.4,

  // Fuerza: 1 kip = 4.4482216 kN (1 kN = 0.2248089 kips = 224.8089 lbf)
  kNToKips: (kN) => kN / 4.4482216,
  kipsToKN: (kips) => kips * 4.4482216,

  // Tensión / Resistencia: 1 MPa = 145.0377 psi
  mpaToPsi: (mpa) => mpa * 145.0377377,
  psiToMpa: (psi) => psi / 145.0377377
};

export function getUnitSymbols(unitSystem) {
  if (unitSystem === UNITS.IMPERIAL) {
    return {
      length: 'in',
      force: 'kips',
      stress: 'psi',
      systemLabel: 'in/lb',
      switchTargetLabel: 'mm/kN'
    };
  }
  return {
    length: 'mm',
    force: 'kN',
    stress: 'MPa',
    systemLabel: 'mm/kN',
    switchTargetLabel: 'in/lb'
  };
}
