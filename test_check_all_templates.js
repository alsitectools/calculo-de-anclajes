import fs from 'fs';
import JSZip from 'jszip';
import { calculateAnchor } from './js/engine/anchorEngine.js';
import { buildBookmarkValues, injectBookmarksIntoWordXml } from './js/report/docxGenerator.js';

async function testTemplate(filename, tipoCono, hueco) {
  const buf = fs.readFileSync(filename);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('text');
  
  const calc = calculateAnchor({
    tipoCono: tipoCono,
    longitud: tipoCono === 'T1C' ? 400 : 213,
    Nsk: 30,
    Vsk: 30,
    cal: 500,
    car: 500,
    cau: 500,
    cad: 500,
    ha: 400,
    fck: 30,
    afectadoHueco: hueco,
    fisuracion: 'SI'
  });
  const bms = buildBookmarkValues(calc, {
    obra: 'TORRE ALBATROS MADRID',
    cliente: 'CONSTRUCTORA ACCIONA S.A.',
    refAnclaje: 'ANCLAJE TREPANTE #1'
  });
  
  const bmMatches = [];
  const regex = /<w:bookmarkStart[^>]*w:name="([^"]+)"/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    if (!m[1].startsWith('_')) {
      bmMatches.push(m[1]);
    }
  }
  
  console.log(`\n=== ${filename} ===`);
  console.log('Total non-system bookmarks:', bmMatches.length);
  
  const missing = [];
  for (const bm of bmMatches) {
    if (bms[bm] === undefined) {
      missing.push(bm);
    }
  }
  if (missing.length > 0) {
    console.log('MISSING BOOKMARK VALUES IN GENERATOR:', missing);
  } else {
    console.log('ALL BOOKMARKS HAVE CORRESPONDING VALUES MAPPED!');
  }
  
  const modified = injectBookmarksIntoWordXml(xml, bms);
  
  // Verify that all bookmark keys appear populated with values
  let unreplaced = 0;
  for (const bm of bmMatches) {
    const val = bms[bm];
    if (val && !modified.includes(String(val))) {
      console.log(`Warning: value for bookmark ${bm} (${val}) not found in modified XML`);
      unreplaced++;
    }
  }
  if (unreplaced === 0) {
    console.log('SUCCESS: All bookmark values successfully injected into XML.');
  }
}

async function main() {
  await testTemplate('Informe T1C sin hueco.docx', 'T1C', false);
  await testTemplate('Informe T1C con hueco.docx', 'T1C', true);
  await testTemplate('Informe 240 sin hueco.docx', '240', false);
  await testTemplate('Informe 240 con hueco.docx', '240', true);
}

main();
