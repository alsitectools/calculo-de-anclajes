import fs from 'fs';
import path from 'path';
import { calculateAnchor } from './js/engine/anchorEngine.js';
import { generateDocx } from './js/report/docxGenerator.js';

async function testDocx() {
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

  const templatePath = path.join('assets', 'templates', 'Informe T1C sin hueco.docx');
  const templateBuf = fs.readFileSync(templatePath);

  const outBuf = await generateDocx(calc, {
    obra: 'TORRE ALBATROS MADRID',
    cliente: 'CONSTRUCTORA ACCIONA S.A.',
    refAnclaje: 'ANCLAJE TREPANTE PILAR P-12',
    autor: 'Dpto. Técnico Estructuras'
  }, templateBuf);

  fs.writeFileSync('output_test_informe_T1C.docx', outBuf);
  console.log('Successfully generated output_test_informe_T1C.docx (size:', outBuf.length, 'bytes)');
}

testDocx().catch(console.error);
