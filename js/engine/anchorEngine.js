/**
 * Motor de Cálculo para Anclajes de Trepantes
 * Paridad 100% matemática con Software Anclajes v.1.0.xlsm
 */

export const ANCHOR_TYPES = {
  'T1C': {
    id: 'T1C',
    name: 'M36 / DW26,5',
    sistema: 'T1C',
    shortName: 'T1C',
    da: 40,             // mm
    placa: 106,         // mm
    hefCalc: 171,       // mm
    AseN: 705,          // mm2
    barraDiam: 26.5,    // mm
    NsaBarra: 580,      // kN
    metricaTornillo: 'M36 8.8',
    NsaTornillo: 653.6, // kN
    deltaCortante: 0.64,
    AseV: 2001,         // mm2
    futa: 510,          // N/mm2
    longitudesValidas: [240, 300, 350, 400, 450, 500],
    defaultLongitud: 400,
    reportTemplateConHueco: 'Informe T1C con hueco.docx',
    reportTemplateSinHueco: 'Informe T1C sin hueco.docx'
  },
  '240': {
    id: '240',
    name: 'M24 / DW15',
    sistema: '240',
    shortName: '240',
    da: 30,             // mm
    placa: 100,         // mm
    hefCalc: 112.5,     // mm
    AseN: 530,          // mm2
    barraDiam: 15,      // mm
    NsaBarra: 195,      // kN
    metricaTornillo: 'M24 8.8',
    NsaTornillo: 282.4, // kN
    deltaCortante: 0.55,
    AseV: 1138,         // mm2
    futa: 510,          // N/mm2
    longitudesValidas: [113, 213],
    defaultLongitud: 213,
    reportTemplateConHueco: 'Informe 240 con hueco.docx',
    reportTemplateSinHueco: 'Informe 240 sin hueco.docx'
  }
};

export const CONSTANTS = {
  factorGeo: 1.5,
  FS_acero: 2.25,
  FS_hormigon: 2.25,
  alpha: 1.667, // 5/3
  lambda: 1.0,
  Kc: 10,
  kcp: 1.80
};

/**
 * Realiza el cálculo completo de dimensionamiento del anclaje
 */
export function calculateAnchor(params) {
  const {
    tipoCono = 'T1C',     // 'T1C' o '240'
    longitud = 400,       // mm
    Nsk = 30,             // kN
    Vsk = 30,             // kN
    factorCargas = 1.0,   // Factor de mayoración de cargas (hoja celda C8, C9)
    cal = 500,            // mm (izq)
    car = 500,            // mm (der)
    cau = 500,            // mm (sup)
    cad = 500,            // mm (inf)
    ha = 400,             // mm (espesor)
    fck = 30,             // MPa (fc', comprendido entre 8 y 30 MPa)
    afectadoHueco = false,// true = SI, false = NO
    fisuracion = 'SI'     // 'SI' o 'NO'
  } = params;

  const anchor = ANCHOR_TYPES[tipoCono] || ANCHOR_TYPES['T1C'];
  const { factorGeo, FS_acero, FS_hormigon, alpha, lambda, Kc, kcp } = CONSTANTS;

  // Cargas mayoradas (E9, E10)
  const Nd = Nsk * factorCargas;
  const Vd = Vsk * factorCargas;

  // 1. TRACCIÓN
  const hef = Number(longitud);
  const placa = anchor.placa;

  // Influencia de bordes para h'ef (celda B21)
  // IF(COUNTIF(B17:B20,"<"&((E19/2)+(E13*B16)))<=2,B16,IF(COUNTIF(B17:B20,"<"&((E19/2)+(E13*B16)))=3,((LARGE(B17:B20,2))-(E19/2))/1.5,((MAX(B17:B20))-(E19/2))/1.5))
  const limiteBorde = (placa / 2) + (factorGeo * hef);
  const bordes = [car, cal, cad, cau]; // B17(der), B18(izq), B19(inf), B20(sup)
  const countMenores = bordes.filter(b => b < limiteBorde).length;

  let hefPrime = hef;
  if (countMenores <= 2) {
    hefPrime = hef;
  } else if (countMenores === 3) {
    const sortedBordes = [...bordes].sort((a, b) => b - a); // descending
    const segundoMayor = sortedBordes[1];
    hefPrime = (segundoMayor - (placa / 2)) / 1.5;
  } else {
    const maxBorde = Math.max(...bordes);
    hefPrime = (maxBorde - (placa / 2)) / 1.5;
  }

  // Resistencia Acero Tracción Nsa (fila 38-45)
  const NsaCono = (anchor.AseN * anchor.futa) / 1000; // kN (C39)
  const NsaBarra = anchor.NsaBarra; // kN (B42)
  const Nsa = Math.min(NsaCono, NsaBarra); // kN (C42)
  const NsaTornillo = anchor.NsaTornillo; // kN (B45)

  // Resistencia Arrancamiento Hormigón Ncb (fila 50-56)
  const caMin = Math.min(...bordes); // A51 = MIN(B17:B20)

  // Cono real (usando h'ef)
  const limiteHefPrime = (placa / 2) + (factorGeo * hefPrime);
  const aderN = Math.min(car, limiteHefPrime); // B51
  const aizqN = Math.min(cal, limiteHefPrime); // C51
  const binfN = Math.min(cad, limiteHefPrime); // D51
  const bsupN = Math.min(cau, limiteHefPrime); // E51

  const Anc = (aderN + aizqN) * (binfN + bsupN); // F51
  const Anc0 = 9 * Math.pow(hefPrime, 2); // G51
  const AncRatio = Anc0 > 0 ? Anc / Anc0 : 1; // H51

  const limitePsiEdN = (1.5 * hefPrime) + (placa / 2);
  let psiEdN = 1.0;
  if (caMin < limitePsiEdN) {
    psiEdN = Math.min(1.0, 0.7 + 0.3 * (caMin / limitePsiEdN));
  } // I51

  const psiCN = (fisuracion === 'SI') ? 1.0 : 1.25; // J51
  const psiCpN = 1.0; // K51

  const Nb = (Kc * lambda * Math.sqrt(fck) * Math.pow(hefPrime, 1.5)) / 1000; // E55
  const Ncb = AncRatio * psiEdN * psiCN * psiCpN * Nb; // M51

  // Cono de cálculo (usando hefCalc) para cabeceo (fila 52, 56)
  const hefCalc = anchor.hefCalc; // E14
  const limiteHefCalc = factorGeo * hefCalc;
  const aderNCalc = Math.min(car, limiteHefCalc); // B52
  const aizqNCalc = Math.min(cal, limiteHefCalc); // C52
  const binfNCalc = Math.min(cad, limiteHefCalc); // D52
  const bsupNCalc = Math.min(cau, limiteHefCalc); // E52

  const AncCalc = (aderNCalc + aizqNCalc) * (binfNCalc + bsupNCalc); // F52
  const Anc0Calc = 9 * Math.pow(hefCalc, 2); // G52
  const AncRatioCalc = Anc0Calc > 0 ? AncCalc / Anc0Calc : 1; // H52

  const limitePsiEdNCalc = (1.5 * hefCalc) + (placa / 2);
  let psiEdNCalc = 1.0;
  if (caMin < limitePsiEdNCalc) {
    psiEdNCalc = Math.min(1.0, 0.7 + 0.3 * (caMin / limitePsiEdNCalc));
  } // I52

  const NbCalc = (Kc * lambda * Math.sqrt(fck) * Math.pow(hefCalc, 1.5)) / 1000; // E56
  const NcbCalc = AncRatioCalc * psiEdNCalc * psiCN * psiCpN * NbCalc; // M52

  // Resumen Tracción (fila 60-64)
  const NRdAcero = Nsa / FS_acero; // D62
  const NRdArranque = Ncb / FS_hormigon; // D63
  const NRd = NRdArranque; // D64 = +D63 (Resistencia de cálculo de arrancamiento de hormigón)
  const ratioTraccion = NRd > 0 ? Nd / NRd : 999; // C26 = E9 / D64
  const statusTraccion = Nd <= NRd ? 'OK' : 'NO'; // B26

  // 2. CORTANTE
  // Borde inferior efectivo c'a2,inf (celda B22)
  // IF(B17<(E13*B19),IF(B18<(E13*B19),IF(B15<(E13*B19),MAX(B17/E13,B18/E13,B15/E13),B19),B19),B19)
  let ca2infPrime = cad;
  if (car < (factorGeo * cad) && cal < (factorGeo * cad) && ha < (factorGeo * cad)) {
    ca2infPrime = Math.max(car / factorGeo, cal / factorGeo, ha / factorGeo);
  }

  // Resistencia Acero Cortante Vsa (fila 72-73)
  const Vsa = (anchor.AseV * (anchor.futa / 1.732)) / 1000; // kN (C73)
  const VRdAcero = Vsa / FS_acero; // D99

  // Resistencia Arrancamiento Hormigón Cortante Vcb (perpendicular, fila 78-83)
  const ca1Min = Math.min(cal, car); // A80
  const limiteCa2inf = 1.5 * ca2infPrime;
  const aderV = Math.min(car, limiteCa2inf); // B80
  const aizqV = Math.min(cal, limiteCa2inf); // C80
  const binfV = Math.min(ha, limiteCa2inf);  // D80

  const Avc = (aderV + aizqV) * binfV; // E80
  const Avc0 = 4.5 * Math.pow(ca2infPrime, 2); // F80
  const AvcRatio = Avc0 > 0 ? Avc / Avc0 : 1; // G80

  let psiEdV = 1.0;
  if (ca1Min < limiteCa2inf) {
    psiEdV = 0.7 + 0.3 * (ca1Min / limiteCa2inf);
  } // H80

  const psiCV = (fisuracion === 'SI') ? 1.0 : 1.4; // I80
  let psiHV = 1.0;
  if (ha < limiteCa2inf) {
    psiHV = Math.max(Math.sqrt(limiteCa2inf / ha), 1.0);
  } // J80

  const le = anchor.hefCalc; // D83
  const da = anchor.da; // A83
  const Vb = (0.6 * Math.pow(le / da, 0.2) * Math.sqrt(da) * lambda * Math.sqrt(fck) * Math.pow(ca2infPrime, 1.5)) / 1000; // E83
  const Vcb = AvcRatio * psiEdV * psiCV * psiHV * Vb; // L80
  const VRdCono = Vcb / FS_hormigon; // D100

  // Cortante paralelo al borde (fila 88)
  const VcbParalelo = (2 * Vcb * 1.0) / psiEdV; // B88

  // Resistencia Cabeceo Vcp (fila 92-93)
  const Vcp = kcp * NcbCalc; // B93 (= A93 * M52)
  const VRdCabeceo = Vcp / FS_hormigon; // D101

  // Resumen Cortante (fila 97-102)
  let VRd = 0;
  let VnCortante = 0;
  if (!afectadoHueco) {
    // Sin hueco: D102 = D101
    VRd = VRdCabeceo;
    VnCortante = Math.min(Vsa, Vcp);
  } else {
    // Con hueco: D102 = MIN(D100, D101)
    VRd = Math.min(VRdCono, VRdCabeceo);
    VnCortante = Math.min(Vsa, Vcb, Vcp);
  }

  const ratioCortante = VRd > 0 ? Vd / VRd : 999; // C27 = E10 / D102
  const statusCortante = Vd <= VRd ? 'OK' : 'NO'; // B27

  // 3. TORNILLO COMBINADO (fila 28)
  // D28 = E9 + C45 * E10 (Nd + delta * Vd)
  // E28 = B45 / E15 (NsaTornillo / FS_acero)
  // C28 = D28 / E28
  const NsdTornillo = Nd + anchor.deltaCortante * Vd;
  const NRdTornillo = NsaTornillo / FS_acero;
  const ratioTornillo = NRdTornillo > 0 ? NsdTornillo / NRdTornillo : 999;
  const statusTornillo = ratioTornillo < 1.0 ? 'OK' : 'NO';

  // 4. INTERACCIÓN AXIL - CORTANTE (fila 29)
  // C29 = C26^E17 + C27^E17
  const termN = Math.pow(ratioTraccion, alpha);
  const termV = Math.pow(ratioCortante, alpha);
  const interaccion = termN + termV;
  const statusInteraccion = interaccion < 1.0 ? 'OK' : 'NO';
  const utilizacionResistencia = interaccion * 100; // %

  // 5. PORCENTAJES DE VERIFICACIÓN INDIVIDUALES (fila 134-137 de Excel)
  const factorMayor = Math.pow(1.5, 2); // 2.25
  const pctTornilloAxial = (Nsk * factorMayor) / NsaTornillo * 100; // B135
  const pctBarraDWAxial = (Nsk * factorMayor) / NsaBarra * 100; // B136 (celda B42)
  const pctConoHormigonAxial = Ncb > 0 ? (Nsk * factorMayor) / Ncb * 100 : 999; // B137
  const pctConoHormigonCortante = afectadoHueco ? (Vcb > 0 ? (Vsk * factorMayor) / Vcb * 100 : 999) : 0; // E135
  const pctCabeceoCortante = Vcp > 0 ? (Vsk * factorMayor) / Vcp * 100 : 999; // E136
  const pctConoMetalicoCortante = Vsa > 0 ? (Vsk * factorMayor) / Vsa * 100 : 999; // E137

  // 6. CURVA TEÓRICA DE INTERACCIÓN (Puntos para gráfico)
  const curvePoints = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps; // 0 to 1
    const vVal = frac * VRd;
    // N(V) = (1 - (V/VRd)^alpha)^(1/alpha) * NRd
    const vTerm = Math.pow(frac, alpha);
    const nVal = vTerm <= 1.0 ? Math.pow(1.0 - vTerm, 1.0 / alpha) * NRd : 0;
    curvePoints.push({ x: vVal, y: nVal });
  }

  // 7. TABLA DE RESÚMENES DE CARGA (Para informes)
  const resumenTraccion = {
    dw: {
      nombre: anchor.id === 'T1C' ? 'DW26,5' : 'DW15',
      Sk: Nsk,
      gammaF: 1.5,
      Sd: Nsk * 1.5,
      Rk: anchor.NsaBarra,
      gammaM: 1.9,
      Rd: anchor.id === 'T1C' ? 300 : 91,
      cumple: (Nsk * 1.5) <= (anchor.id === 'T1C' ? 300 : 91)
    },
    tornillo: {
      nombre: `Tornillo ${anchor.metricaTornillo.split(' ')[0]}`,
      Sk: Nsk + anchor.deltaCortante * Vsk,
      gammaF: 1.5,
      Sd: (Nsk + anchor.deltaCortante * Vsk) * 1.5,
      Rk: NsaTornillo,
      gammaM: 1.5,
      Rd: NsaTornillo / 1.5,
      cumple: ((Nsk + anchor.deltaCortante * Vsk) * 1.5) <= (NsaTornillo / 1.5)
    },
    conoHormigon: {
      nombre: 'Cono de hormigón',
      Sk: Nsk,
      gammaF: 1.5,
      Sd: Nsk * 1.5,
      Rk: Ncb,
      gammaM: 1.5,
      Rd: Ncb / 1.5,
      cumple: (Nsk * 1.5) <= (Ncb / 1.5)
    }
  };

  const resumenCortante = {
    conoMetalico: {
      nombre: `Cono ${anchor.metricaTornillo.split(' ')[0]} ${anchor.shortName}`,
      Sk: Vsk,
      gammaF: 1.5,
      Sd: Vsk * 1.5,
      Rk: Vsa,
      gammaM: 1.5,
      Rd: Vsa / 1.5,
      cumple: (Vsk * 1.5) <= (Vsa / 1.5)
    },
    conoHormigon: {
      nombre: 'Cono de hormigón',
      Sk: Vsk,
      gammaF: 1.5,
      Sd: Vsk * 1.5,
      Rk: Vcb,
      gammaM: 1.5,
      Rd: Vcb / 1.5,
      cumple: (Vsk * 1.5) <= (Vcb / 1.5)
    },
    cabeceo: {
      nombre: 'Hormigón por cabeceo',
      Sk: Vsk,
      gammaF: 1.5,
      Sd: Vsk * 1.5,
      Rk: Vcp,
      gammaM: 1.5,
      Rd: Vcp / 1.5,
      cumple: (Vsk * 1.5) <= (Vcp / 1.5)
    }
  };

  // Nsd, Nrd, Vsd, Vrd para fórmula de informe
  const NsdFormula = Nsk * 1.5;
  const NrdFormula = Ncb / 1.5;
  const VsdFormula = Vsk * 1.5;
  const VrdFormula = !afectadoHueco ? (Vcp / 1.5) : Math.min(Vcb / 1.5, Vcp / 1.5);
  const ratioFormula = Math.pow(NsdFormula / NrdFormula, alpha) + Math.pow(VsdFormula / VrdFormula, alpha);

  return {
    inputs: {
      tipoCono,
      longitud: hef,
      Nsk,
      Vsk,
      factorCargas,
      Nd,
      Vd,
      cal,
      car,
      cau,
      cad,
      ha,
      fck,
      afectadoHueco,
      fisuracion
    },
    anchor,
    traccion: {
      hefPrime,
      NsaCono,
      NsaBarra,
      Nsa,
      NsaTornillo,
      caMin,
      Anc,
      Anc0,
      AncRatio,
      psiEdN,
      psiCN,
      psiCpN,
      Nb,
      Ncb,
      hefCalc,
      NcbCalc,
      NRdAcero,
      NRdArranque,
      NRd,
      ratio: ratioTraccion,
      status: statusTraccion
    },
    cortante: {
      ca2infPrime,
      Vsa,
      VRdAcero,
      ca1Min,
      Avc,
      Avc0,
      AvcRatio,
      psiEdV,
      psiCV,
      psiHV,
      le,
      da,
      Vb,
      Vcb,
      VRdCono,
      VcbParalelo,
      Vcp,
      VRdCabeceo,
      VnCortante,
      VRd,
      ratio: ratioCortante,
      status: statusCortante
    },
    tornillo: {
      NsdTornillo,
      NRdTornillo,
      ratio: ratioTornillo,
      status: statusTornillo
    },
    global: {
      interaccion,
      utilizacionResistencia,
      status: statusInteraccion,
      esSeguro: statusTraccion === 'OK' && statusCortante === 'OK' && statusTornillo === 'OK' && statusInteraccion === 'OK'
    },
    modosFallo: {
      tornilloAxial: {
        nombre: 'Tornillo axial',
        pct: pctTornilloAxial,
        status: pctTornilloAxial <= 100 ? 'OK' : 'KO'
      },
      barraDWAxial: {
        nombre: 'Barra DW axial',
        pct: pctBarraDWAxial,
        status: pctBarraDWAxial <= 100 ? 'OK' : 'KO'
      },
      conoHormigonAxial: {
        nombre: 'Cono hormigón axial',
        pct: pctConoHormigonAxial,
        status: pctConoHormigonAxial <= 100 ? 'OK' : 'KO'
      },
      conoHormigonCortante: {
        nombre: 'Cono hormigón cortante',
        pct: pctConoHormigonCortante,
        status: pctConoHormigonCortante <= 100 ? 'OK' : 'KO',
        aplica: afectadoHueco
      },
      cabeceoCortante: {
        nombre: 'Cabeceo cortante',
        pct: pctCabeceoCortante,
        status: pctCabeceoCortante <= 100 ? 'OK' : 'KO'
      },
      conoMetalicoCortante: {
        nombre: 'Cono metálico cortante',
        pct: pctConoMetalicoCortante,
        status: pctConoMetalicoCortante <= 100 ? 'OK' : 'KO'
      }
    },
    curva: {
      puntos: curvePoints,
      puntoOperacion: { x: Vd, y: Nd }
    },
    resumenTraccion,
    resumenCortante,
    formulaInforme: {
      Nsd: NsdFormula,
      Nrd: NrdFormula,
      Vsd: VsdFormula,
      Vrd: VrdFormula,
      ratio: ratioFormula,
      status: ratioFormula <= 1.0 ? 'OK' : 'KO'
    }
  };
}
