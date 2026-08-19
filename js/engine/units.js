/**
 * Units Conversion & Formatting Utility for Alsina Anchor Engineering
 * Supports SI (Metric: mm, kN, MPa) and Imperial (in, kips/lbf, psi)
 */

export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial'
};

const MM_PER_INCH = 25.4;
const KN_PER_KIP = 4.4482216152605;
const PSI_PER_MPA = 145.03773773;

export class UnitConverter {
  constructor(system = UNIT_SYSTEMS.METRIC) {
    this.system = system;
  }

  setSystem(system) {
    this.system = system;
  }

  isImperial() {
    return this.system === UNIT_SYSTEMS.IMPERIAL;
  }

  // Length conversions (Base SI: mm)
  toDisplayLength(mm) {
    if (this.isImperial()) {
      return Number((mm / MM_PER_INCH).toFixed(2));
    }
    return Number(mm.toFixed(1));
  }

  fromDisplayLength(val) {
    if (this.isImperial()) {
      return val * MM_PER_INCH;
    }
    return val;
  }

  formatLength(mm, includeUnit = true) {
    const val = this.toDisplayLength(mm);
    const unit = this.isImperial() ? 'in' : 'mm';
    return includeUnit ? `${val} ${unit}` : `${val}`;
  }

  // Force conversions (Base SI: kN)
  toDisplayForce(kN) {
    if (this.isImperial()) {
      return Number((kN / KN_PER_KIP).toFixed(2));
    }
    return Number(kN.toFixed(1));
  }

  fromDisplayForce(val) {
    if (this.isImperial()) {
      return val * KN_PER_KIP;
    }
    return val;
  }

  formatForce(kN, includeUnit = true) {
    const val = this.toDisplayForce(kN);
    const unit = this.isImperial() ? 'kips' : 'kN';
    return includeUnit ? `${val} ${unit}` : `${val}`;
  }

  // Pressure / Stress conversions (Base SI: MPa)
  toDisplayStress(mpa) {
    if (this.isImperial()) {
      return Math.round(mpa * PSI_PER_MPA);
    }
    return Math.round(mpa);
  }

  fromDisplayStress(val) {
    if (this.isImperial()) {
      return val / PSI_PER_MPA;
    }
    return val;
  }

  formatStress(mpa, includeUnit = true) {
    const val = this.toDisplayStress(mpa);
    const unit = this.isImperial() ? 'psi' : 'MPa';
    return includeUnit ? `${val} ${unit}` : `${val}`;
  }

  // Units labels dictionary
  getUnitLabels() {
    if (this.isImperial()) {
      return {
        length: 'in',
        force: 'kips',
        stress: 'psi',
        systemName: 'Imperial (in/lb)',
        badge: 'in/lb',
        fckStep: 50,
        fckMin: 145,
        fckMax: 29000,
        lengthStep: 0.1,
        forceStep: 0.1
      };
    }
    return {
      length: 'mm',
      force: 'kN',
      stress: 'MPa',
      systemName: 'Métrico (mm/kN)',
      badge: 'mm/kN',
      fckStep: 1,
      fckMin: 1,
      fckMax: 200,
      lengthStep: 10,
      forceStep: 1
    };
  }
}

export const globalUnits = new UnitConverter(UNIT_SYSTEMS.METRIC);
