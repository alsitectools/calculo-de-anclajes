/**
 * Motor de Cálculo para Anclajes de Muro a 1 Cara (M1C)
 * Paridad 100% matemática con "Arrancamiento de cono (version 07.11.23) 2.xlsx"
 */

export const MURO1CARA_CONSTANTS = {
  gamma_M_conc: 1.5,
  gamma_Q_desfav: 1.5,
  alpha_deg: 45, // Ángulo estándar de anclaje a 45º
  Kc: 10,
  lambda: 1.0,
  fyd: 275 // MPa (Acero S275 para vigas UPN)
};

export const VIGA_PROFILES = {
  '2UPN120': {
    id: '2UPN120',
    name: '2UPN120',
    fyd: 275, // MPa
    VplRd: 233870.16, // N
    VplRd_half: 116935.08, // N
    Wel: 121245.16, // mm3 (semineta)
    Wpl: 145200 // mm3
  },
  '2UPN160': {
    id: '2UPN160',
    name: '2UPN160',
    fyd: 275, // MPa
    VplRd: 400103.74, // N
    VplRd_half: 200051.87, // N
    Wel: 232000, // mm3 (semineta)
    Wpl: 276000 // mm3
  },
  '2x2UPN120': {
    id: '2x2UPN120',
    name: '2 x 2UPN120 (Unión simple)',
    fyd: 275, // MPa
    VplRd: 467740.32, // N
    VplRd_half: 233870.16, // N
    Wel: 242490.33, // mm3 (semineta)
    Wpl: 290400 // mm3
  }
};

export const TIE_BAR_TYPES = {
  'D15': {
    id: 'D15',
    name: 'Barras D15 + anclaje perdido',
    NRd_ser: 90, // kN
    requiresConcreteOk: true
  },
  'D20': {
    id: 'D20',
    name: 'Barras D20 + anclaje perdido',
    NRd_ser: 160, // kN
    requiresConcreteOk: true
  },
  'D26_5': {
    id: 'D26_5',
    name: 'Barras D26,5 + anclaje perdido',
    NRd_ser: 220, // kN
    requiresConcreteOk: true
  },
  'D26_5_GANCHO': {
    id: 'D26_5_GANCHO',
    name: 'Barras D26,5 de GANCHO perdido integrado en armadura',
    NRd_ser: 220, // kN
    requiresConcreteOk: false // Anclado directamente en armadura
  }
};

/**
 * Calcula el comportamiento completo de Muro a 1 Cara y su anclaje a 45º
 */
export function calculateMuro1Cara(params) {
  const {
    H = 9,                  // m (altura del encofrado M1C)
    PresionMax = 25,        // kN/m2 (presión máxima limitada)
    AnchoBatache = 2,       // m (ancho de batache b)
    NumAnclajes = 4,        // ud (número de anclajes por batache n)
    gamma_q = 1.5,          // Factor parcial cargas ULS
    PespecificoHorm = 25,   // kN/m3 (peso específico hormigón fresco)
    fcj = 35,               // MPa (resistencia compresión f'c del hormigón zapata)
    hef = 440,              // mm (longitud / profundidad de anclaje)
    ca1 = 500,              // mm (distancia borde 1 frontal)
    ca2 = 1500,             // mm (distancia borde 2 posterior)
    ca3 = 200,              // mm (distancia borde 3 lateral izq)
    ca4 = 900,              // mm (distancia borde 4 lateral der)
    alpha = 45              // º (ángulo de inclinación de la barra)
  } = params;

  const { gamma_M_conc, gamma_Q_desfav, Kc, lambda, fyd } = MURO1CARA_CONSTANTS;

  // 1. EMPUJES Y DISTRIBUCIÓN DE PRESIONES
  // Hlim = MIN(PresionMax / PespecificoHorm, H)
  const Hlim = Math.min(PresionMax / PespecificoHorm, H);

  // Fx1 (fuerza horizontal hidrostática triangular) = PespecificoHorm * Hlim^2 * 0.5 [kN/m]
  const Fx1 = PespecificoHorm * Math.pow(Hlim, 2) * 0.5;

  // h cdg Fx1 = H - Hlim * 2/3 [m]
  const h_cdg_Fx1 = H - (Hlim * 2 / 3);

  // Fx2 (fuerza horizontal constante rectangular) = PresionMax * (H - Hlim) [kN/m]
  const Fx2 = PresionMax * (H - Hlim);

  // h cdg Fx2 = (H - Hlim) * 0.5 [m]
  const h_cdg_Fx2 = (H - Hlim) * 0.5;

  // Fx tot = Fx1 + Fx2 [kN/m]
  const Fx_tot = Fx1 + Fx2;

  // h cdg Fx tot = (Fx1 * h_cdg_Fx1 + Fx2 * h_cdg_Fx2) / Fx_tot [m]
  const h_cdg_Fx_tot = Fx_tot > 0 ? (Fx1 * h_cdg_Fx1 + Fx2 * h_cdg_Fx2) / Fx_tot : 0;

  // Fx tot batache = Fx_tot * AnchoBatache [kN]
  const Fx_tot_batache = Fx_tot * AnchoBatache;

  // Fx tot escuadra (2 escuadras por batache) = Fx_tot_batache * 0.5 [kN]
  const Fx_tot_escuadra = Fx_tot_batache * 0.5;

  // Fx / anclaje = Fx_tot_batache / NumAnclajes [kN]
  const Fx_anclaje = NumAnclajes > 0 ? Fx_tot_batache / NumAnclajes : 0;

  // 2. DEMANDA EN ANCLAJES (A 45º)
  // Tracción escuadra Nek (SLS) = SQRT(2 * (Fx_tot_escuadra)^2) [kN]
  const Nek_escuadra = Math.sqrt(2 * Math.pow(Fx_tot_escuadra, 2));

  // Tracción anclaje Nek (SLS) = SQRT(2 * Fx_anclaje^2) = SQRT(2) * Fx_anclaje [kN]
  const Nek_anclaje = Math.sqrt(2 * Math.pow(Fx_anclaje, 2));

  // Tracción anclaje Ned (ULS) = Nek_anclaje * gamma_q [kN]
  const Ned_anclaje = Nek_anclaje * gamma_q;

  // 3. RESISTENCIA POR ARRANCAMIENTO DE CONO DE HORMIGÓN A 45º
  const alpha_rad = (alpha * Math.PI) / 180;

  // ca1 efectivo = MIN(hef * (COS(alpha_rad) + SIN(alpha_rad) * TAN(alpha_rad - ATAN(1/1.5))), ca1)
  const trigFactor = Math.cos(alpha_rad) + Math.sin(alpha_rad) * Math.tan(alpha_rad - Math.atan(1 / 1.5));
  const ca1_efectivo = Math.min(hef * trigFactor, ca1);

  // Anc0 (Área bruta 9 * hef^2) [mm2]
  const Anc0 = 9 * Math.pow(hef, 2);

  // Anc (Área neta reducida por bordes) [mm2]
  // (MIN(1.5*hef, ca1_efectivo) + MIN(1.5*hef, ca2)) * (MIN(1.5*hef, ca3) + MIN(1.5*hef, ca4))
  const factor_x = Math.min(1.5 * hef, ca1_efectivo) + Math.min(1.5 * hef, ca2);
  const factor_y = Math.min(1.5 * hef, ca3) + Math.min(1.5 * hef, ca4);
  const Anc = factor_x * factor_y;

  // Ratio de áreas Anc / Anc0
  const Anc_ratio = Anc0 > 0 ? Anc / Anc0 : 0;

  // Nb = Kc * lambda * SQRT(fcj) * hef^1.5 / 1000 [kN]
  const Nb = (Kc * lambda * Math.sqrt(Math.max(0, fcj)) * Math.pow(hef, 1.5)) / 1000;

  // Nbc = Nb * (Anc / Anc0) [kN]
  const Nbc = Nb * Anc_ratio;

  // Nbc,Rd (Capacidad ULS) = Nbc / gamma_M_conc [kN]
  const Nbc_Rd = Nbc / gamma_M_conc;
  const concrete_ULS_OK = Nbc_Rd >= Ned_anclaje;
  const concrete_ULS_util = Nbc_Rd > 0 ? (Ned_anclaje / Nbc_Rd) * 100 : 999;

  // Nbc,Rd,ser (Capacidad SLS) = Nbc_Rd / gamma_Q_desfav [kN]
  const Nbc_Rd_ser = Nbc_Rd / gamma_Q_desfav;
  const concrete_SLS_OK = Nbc_Rd_ser >= Nek_anclaje;
  const concrete_SLS_util = Nbc_Rd_ser > 0 ? (Nek_anclaje / Nbc_Rd_ser) * 100 : 999;

  // 4. VERIFICACIÓN VIGAS TIRANTE DE ANCLAJE (UPN)
  // Demanda: Vz,Ed = Ned_anclaje (kN), My,Ed = Ned_anclaje * (ca3 / 1000) (kN·m)
  const Vz_Ed = Ned_anclaje; // kN
  const My_Ed = Ned_anclaje * (ca3 / 1000); // kN·m

  const vigasResults = {};
  for (const [key, profile] of Object.entries(VIGA_PROFILES)) {
    const V_N = Vz_Ed * 1000; // N
    // Factor de interacción cortante-flector (1 - rho)
    // IF(V_N < VplRd_half, 1, 1 - (2 * V_N / VplRd - 1)^2)
    let one_minus_rho = 1;
    if (V_N >= profile.VplRd_half) {
      const term = (2 * V_N / profile.VplRd) - 1;
      one_minus_rho = Math.max(0, 1 - Math.pow(term, 2));
    }

    // Mel,Rd = Wel * fyd * (1 - rho) * 1e-6 [kN·m]
    const Mel_Rd = profile.Wel * profile.fyd * one_minus_rho * 1e-6;
    // Mpl,Rd = Wpl * fyd * (1 - rho) * 1e-6 [kN·m]
    const Mpl_Rd = profile.Wpl * profile.fyd * one_minus_rho * 1e-6;

    const isOk = Mel_Rd >= My_Ed;
    const util = Mel_Rd > 0 ? (My_Ed / Mel_Rd) * 100 : 999;

    vigasResults[key] = {
      ...profile,
      one_minus_rho,
      Mel_Rd,
      Mpl_Rd,
      isOk,
      utilization: util
    };
  }

  // 5. VERIFICACIÓN BARRAS TIRANTES
  const barrasResults = {};
  for (const [key, bar] of Object.entries(TIE_BAR_TYPES)) {
    let isOk = false;
    if (bar.requiresConcreteOk) {
      isOk = concrete_SLS_OK && (Nek_anclaje <= bar.NRd_ser);
    } else {
      isOk = Nek_anclaje <= bar.NRd_ser;
    }
    const util = bar.NRd_ser > 0 ? (Nek_anclaje / bar.NRd_ser) * 100 : 999;

    barrasResults[key] = {
      ...bar,
      isOk,
      utilization: util
    };
  }

  return {
    inputs: {
      H,
      PresionMax,
      AnchoBatache,
      NumAnclajes,
      gamma_q,
      PespecificoHorm,
      fcj,
      hef,
      ca1,
      ca2,
      ca3,
      ca4,
      alpha
    },
    empujes: {
      Hlim,
      Fx1,
      h_cdg_Fx1,
      Fx2,
      h_cdg_Fx2,
      Fx_tot,
      h_cdg_Fx_tot,
      Fx_tot_batache,
      Fx_tot_escuadra,
      Fx_anclaje
    },
    demanda: {
      Nek_escuadra,
      Nek_anclaje,
      Ned_anclaje,
      Vz_Ed,
      My_Ed
    },
    hormigon: {
      alpha_rad,
      ca1_efectivo,
      Anc0,
      Anc,
      Anc_ratio,
      Nb,
      Nbc,
      Nbc_Rd,
      Nbc_Rd_ser,
      concrete_ULS_OK,
      concrete_ULS_util,
      concrete_SLS_OK,
      concrete_SLS_util
    },
    vigas: vigasResults,
    barras: barrasResults,
    globalOk: concrete_ULS_OK && concrete_SLS_OK
  };
}
