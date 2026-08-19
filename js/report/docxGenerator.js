import { calculateAnchor } from '../engine/anchorEngine.js';

// Resolve JSZip whether in Node.js or Browser
let JSZipLib = (typeof window !== 'undefined' && window.JSZip) ? window.JSZip : null;

async function getJSZip() {
  if (JSZipLib) return JSZipLib;
  if (typeof window !== 'undefined' && window.JSZip) {
    JSZipLib = window.JSZip;
    return JSZipLib;
  }
  const mod = await import('jszip');
  JSZipLib = mod.default || mod;
  return JSZipLib;
}

/**
 * Format helper for numbers in Word reports (#,##0.00 or similar)
 */
function formatNum(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return Number(val).toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Genera el mapa de marcadores para inyectar en la plantilla Word
 */
export function buildBookmarkValues(calcResult, metadata = {}) {
  const {
    obra = 'Obra Ejemplo',
    cliente = 'Cliente Ejemplo',
    refAnclaje = 'ANCLAJE TREPANTE #1',
    autor = '',
    fecha = new Date().toLocaleDateString('es-ES')
  } = metadata;

  const { inputs, anchor, traccion, cortante, global, formulaInforme, resumenTraccion, resumenCortante } = calcResult;

  const bm = {
    'obra': obra,
    'cliente': cliente,
    'refanclaje': refAnclaje,
    
    'Nsk1': formatNum(inputs.Nsk),
    'Vsk1': formatNum(inputs.Vsk),
    'Nsktornillo1': formatNum(calcResult.tornillo.NsdTornillo),
    'Vsktornillo1': formatNum(inputs.Vd),

    'Nsk2': formatNum(inputs.Nsk),
    'Vsk2': formatNum(inputs.Vsk),
    'Nsktornillo2': formatNum(calcResult.tornillo.NsdTornillo),
    'Vsktornillo2': formatNum(inputs.Vd),

    'cal': formatNum(inputs.cal),
    'car': formatNum(inputs.car),
    'cau': formatNum(inputs.cau),
    'cad': formatNum(inputs.cad),
    'ha': formatNum(inputs.ha),
    'hef': formatNum(inputs.longitud),

    'fck': formatNum(inputs.fck, 0),

    // Tracción cono
    'coefedn': formatNum(traccion.psiEdN),
    'Nb': formatNum(traccion.Nb),
    'Ncb': formatNum(traccion.Ncb),

    // Cortante
    'Vsa': formatNum(cortante.Vsa),
    'coefedv': formatNum(cortante.psiEdV),
    'coefhy': formatNum(cortante.psiHV),
    'Vb': formatNum(cortante.Vb),
    'Vcb': formatNum(cortante.Vcb),
    'Vcp': formatNum(cortante.Vcp),
    'Ncbcono': formatNum(traccion.NcbCalc),

    // Tablas de resultados - Tracción
    'SkDW': formatNum(resumenTraccion.dw.Sk),
    'SdDW': formatNum(resumenTraccion.dw.Sd),
    'RkDW': formatNum(resumenTraccion.dw.Rk),
    'RdDW': formatNum(resumenTraccion.dw.Rd),
    'Sdi1': formatNum(resumenTraccion.dw.Sd),
    'Rdi1': formatNum(resumenTraccion.dw.Rd),

    'Sktornillo': formatNum(resumenTraccion.tornillo.Sk),
    'Sdtornillo': formatNum(resumenTraccion.tornillo.Sd),
    'Rktornillo': formatNum(resumenTraccion.tornillo.Rk),
    'Rdtornillo': formatNum(resumenTraccion.tornillo.Rd),
    'Sdi2': formatNum(resumenTraccion.tornillo.Sd),
    'Rdi2': formatNum(resumenTraccion.tornillo.Rd),

    'Skconohormigón': formatNum(resumenTraccion.conoHormigon.Sk),
    'Sdconohormigón': formatNum(resumenTraccion.conoHormigon.Sd),
    'Rkconohormigón': formatNum(resumenTraccion.conoHormigon.Rk),
    'Rdconohormigón': formatNum(resumenTraccion.conoHormigon.Rd),
    'Sdi3': formatNum(resumenTraccion.conoHormigon.Sd),
    'Rdi3': formatNum(resumenTraccion.conoHormigon.Rd),

    // Tablas de resultados - Cortante
    'Skconom36': formatNum(resumenCortante.conoMetalico.Sk),
    'Sdconom36': formatNum(resumenCortante.conoMetalico.Sd),
    'Rkconom36': formatNum(resumenCortante.conoMetalico.Rk),
    'Rdconom36': formatNum(resumenCortante.conoMetalico.Rd),
    'Sdi4': formatNum(resumenCortante.conoMetalico.Sd),
    'Rdi4': formatNum(resumenCortante.conoMetalico.Rd),

    'SkconohormigónC': formatNum(resumenCortante.conoHormigon.Sk),
    'SdconohormigónC': formatNum(resumenCortante.conoHormigon.Sd),
    'RkconohormigónC': formatNum(resumenCortante.conoHormigon.Rk),
    'RdconohormigónC': formatNum(resumenCortante.conoHormigon.Rd),
    'Sdi5': formatNum(resumenCortante.conoHormigon.Sd),
    'Rdi5': formatNum(resumenCortante.conoHormigon.Rd),

    'Skcabeceo': formatNum(resumenCortante.cabeceo.Sk),
    'Sdcabeceo': formatNum(resumenCortante.cabeceo.Sd),
    'Rkcabeceo': formatNum(resumenCortante.cabeceo.Rk),
    'Rdcabeceo': formatNum(resumenCortante.cabeceo.Rd),
    'Sdi6': formatNum(resumenCortante.cabeceo.Sd),
    'Rdi6': formatNum(resumenCortante.cabeceo.Rd),

    // Fórmula global
    'Nsdf': formatNum(formulaInforme.Nsd),
    'Nrdf': formatNum(formulaInforme.Nrd),
    'Vsdf': formatNum(formulaInforme.Vsd),
    'Vrdf': formatNum(formulaInforme.Vrd),
    'rf': formatNum(formulaInforme.ratio * 100, 2)
  };

  return bm;
}

/**
 * Reemplaza los marcadores/campos en el XML del documento Word
 */
export function injectBookmarksIntoWordXml(xmlContent, bookmarkValues) {
  let modifiedXml = xmlContent;

  for (const [name, val] of Object.entries(bookmarkValues)) {
    const escapedVal = String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bookmark regex
    const bmRegex = new RegExp(
      `(<w:bookmarkStart[^>]*w:name="${name}"[^>]*>)([\\s\\S]*?)(<w:bookmarkEnd[^>]*/>)`,
      'g'
    );

    modifiedXml = modifiedXml.replace(bmRegex, (fullMatch, startTag, innerContent, endTag) => {
      if (innerContent.includes('w:fldCharType="separate"')) {
        return fullMatch.replace(
          /(<w:fldChar\s+w:fldCharType="separate"\/>)([\s\S]*?)(<w:fldChar\s+w:fldCharType="end"\/>)/,
          (fldMatch, sepTag, textRuns, endFldTag) => {
            const rPrMatch = textRuns.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
            const rPr = rPrMatch ? rPrMatch[0] : '<w:rPr><w:b/></w:rPr>';
            return `${sepTag}<w:r>${rPr}<w:t>${escapedVal}</w:t></w:r>${endFldTag}`;
          }
        );
      } else {
        return `${startTag}<w:r><w:rPr><w:b/></w:rPr><w:t>${escapedVal}</w:t></w:r>${endTag}`;
      }
    });
  }

  return modifiedXml;
}

/**
 * Genera el archivo .docx completo y lo devuelve como Buffer / Blob / ArrayBuffer
 */
export async function generateDocx(calcResult, metadata, templateBuffer) {
  const JSZipClass = await getJSZip();
  const zip = await JSZipClass.loadAsync(templateBuffer);
  const docXml = await zip.file('word/document.xml').async('text');

  const bookmarkValues = buildBookmarkValues(calcResult, metadata);
  const updatedDocXml = injectBookmarksIntoWordXml(docXml, bookmarkValues);

  zip.file('word/document.xml', updatedDocXml);
  
  if (typeof window !== 'undefined') {
    return await zip.generateAsync({ type: 'blob' });
  } else {
    return await zip.generateAsync({ type: 'nodebuffer' });
  }
}
