import fs from 'fs';
import JSZip from 'jszip';

async function checkGeneratedDocx() {
  const buf = fs.readFileSync('output_test_informe_T1C.docx');
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('text');

  console.log('Doc XML length:', docXml.length);
  const checkKeys = ['TORRE ALBATROS MADRID', 'CONSTRUCTORA ACCIONA S.A.', 'ANCLAJE TREPANTE PILAR P-12', '30,00', '156,69'];
  for (const k of checkKeys) {
    console.log(`Contains "${k}":`, docXml.includes(k));
  }
}

checkGeneratedDocx().catch(console.error);
