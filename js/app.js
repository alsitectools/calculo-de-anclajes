import { ANCHOR_TYPES, calculateAnchor } from './engine/anchorEngine.js';
import { DiagramView } from './ui/diagramView.js';
import { InteractionChart } from './ui/interactionChart.js';
import { generateDocx } from './report/docxGenerator.js';
import { getTemplateBuffer } from './report/embeddedTemplates.js';
import { initI18n, setLanguage, getCurrentLanguage, getLanguageInfo, t, applyTranslations } from './i18n/i18n.js';
import { globalUnits, UNIT_SYSTEMS } from './engine/units.js';

const STORAGE_KEY = 'alsina_anchor_hypotheses_v1';
const THEME_STORAGE_KEY = 'alsina_anchor_theme_v1';
const UNITS_STORAGE_KEY = 'alsina_anchor_units_v1';

let isImperial = false;

// Default State (Always in SI Units internally: mm, kN, MPa)
const state = {
  tipoCono: 'T1C',
  longitud: 400,
  Nsk: 30,
  Vsk: 30,
  factorCargas: 1.0,
  cal: 500,
  car: 500,
  cau: 500,
  cad: 500,
  ha: 400,
  fck: 30,
  afectadoHueco: false,
  fisuracion: 'SI',

  // Project Metadata
  metadata: {
    obra: 'TORRE ALBATROS',
    cliente: 'CONSTRUCTORA ACCIONA S.A.',
    refAnclaje: 'ANCLAJE TREPANTE #1',
    autor: 'Dpto. Técnico',
    fecha: new Date().toLocaleDateString('es-ES')
  }
};

const DEFAULT_HYPOTHESIS_DATA = {
  tipoCono: 'T1C',
  longitud: 400,
  Nsk: 30,
  Vsk: 30,
  factorCargas: 1.0,
  cal: 500,
  car: 500,
  cau: 500,
  cad: 500,
  ha: 400,
  fck: 30,
  afectadoHueco: false,
  fisuracion: 'SI'
};

let diagramView = null;
let interactionChart = null;
let currentCalcResult = null;

// Hypotheses Store
let hypotheses = [];
let currentHypothesisId = null;

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initThemeAndUnits();
  loadHypothesesFromStorage();
  initUI();
  applyUnitsToUI();
  renderHypothesisSelector();
  updateCalculation();
});

function initThemeAndUnits() {
  // Theme: default is dark
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const chkDarkMode = document.getElementById('chkDarkMode');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (chkDarkMode) chkDarkMode.checked = false;
  } else {
    document.body.classList.remove('light-theme');
    if (chkDarkMode) chkDarkMode.checked = true;
  }

  // Units
  const savedUnits = localStorage.getItem(UNITS_STORAGE_KEY);
  isImperial = savedUnits === 'imperial';
  globalUnits.setSystem(isImperial ? UNIT_SYSTEMS.IMPERIAL : UNIT_SYSTEMS.METRIC);
}

function loadHypothesesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      hypotheses = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error cargando hipótesis de localStorage:', e);
  }

  if (!hypotheses || !Array.isArray(hypotheses) || hypotheses.length === 0) {
    hypotheses = [
      {
        id: 'hyp_init_1',
        name: 'Hipótesis 1: T1C L=400 (30/30 kN)',
        data: { ...DEFAULT_HYPOTHESIS_DATA }
      }
    ];
    saveHypothesesToStorage();
  }

  currentHypothesisId = hypotheses[0].id;
  Object.assign(state, JSON.parse(JSON.stringify(hypotheses[0].data)));
}

function saveHypothesesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hypotheses));
  } catch (e) {
    console.error('Error guardando hipótesis:', e);
  }
}

function renderHypothesisSelector() {
  const sel = document.getElementById('selHypothesis');
  if (!sel) return;

  sel.innerHTML = '';
  hypotheses.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = h.name;
    if (h.id === currentHypothesisId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function selectHypothesis(id) {
  const hyp = hypotheses.find(h => h.id === id);
  if (hyp) {
    currentHypothesisId = hyp.id;
    Object.assign(state, JSON.parse(JSON.stringify(hyp.data)));
    syncAllUIFromState();
    updateCalculation();
    renderHypothesisSelector();
    showToast(`Cargada: ${hyp.name}`);
  }
}

function openSaveHypothesisModal() {
  const modal = document.getElementById('modalHypothesis');
  const inpName = document.getElementById('inp_hypothesis_name');
  const radNew = document.getElementById('rad_hyp_new');
  
  const defaultName = `Hipótesis ${hypotheses.length + 1}: ${state.tipoCono} L=${state.longitud}mm (${state.Nsk}/${state.Vsk} kN)`;
  if (inpName) inpName.value = defaultName;
  if (radNew) radNew.checked = true;
  
  if (modal) {
    modal.classList.add('show');
    if (inpName) {
      inpName.focus();
      inpName.select();
    }
  }
}

function confirmSaveHypothesis() {
  const modal = document.getElementById('modalHypothesis');
  const inpName = document.getElementById('inp_hypothesis_name');
  const radNew = document.getElementById('rad_hyp_new');
  const isNew = radNew ? radNew.checked : true;

  const name = (inpName && inpName.value.trim()) ? inpName.value.trim() : `Hipótesis ${hypotheses.length + 1}`;
  
  const snapshot = {
    tipoCono: state.tipoCono,
    longitud: state.longitud,
    Nsk: state.Nsk,
    Vsk: state.Vsk,
    factorCargas: state.factorCargas || 1.0,
    cal: state.cal,
    car: state.car,
    cau: state.cau,
    cad: state.cad,
    ha: state.ha,
    fck: state.fck,
    afectadoHueco: state.afectadoHueco,
    fisuracion: state.fisuracion || 'SI'
  };

  if (isNew) {
    const newId = 'hyp_' + Date.now();
    hypotheses.push({
      id: newId,
      name: name,
      data: snapshot
    });
    currentHypothesisId = newId;
  } else {
    const idx = hypotheses.findIndex(h => h.id === currentHypothesisId);
    if (idx >= 0) {
      hypotheses[idx].name = name;
      hypotheses[idx].data = snapshot;
    }
  }

  saveHypothesesToStorage();
  renderHypothesisSelector();
  if (modal) modal.classList.remove('show');
  showToast(`✅ Hipótesis "${name}" guardada con éxito`);
}

function openDeleteHypothesisModal() {
  const modal = document.getElementById('modalDeleteHypothesis');
  const txtPrompt = document.getElementById('txtDeleteHypPrompt');
  const currentHyp = hypotheses.find(h => h.id === currentHypothesisId);
  const name = currentHyp ? currentHyp.name : 'actual';

  if (txtPrompt) {
    if (hypotheses.length <= 1) {
      txtPrompt.innerHTML = `Esta es la <strong>única hipótesis existente</strong>. ¿Deseas resetear todos sus parámetros a los valores por defecto?`;
    } else {
      txtPrompt.innerHTML = `¿Estás seguro de que deseas eliminar permanentemente la hipótesis <strong>"${name}"</strong>?`;
    }
  }

  if (modal) modal.classList.add('show');
}

function confirmDeleteHypothesis() {
  const modal = document.getElementById('modalDeleteHypothesis');
  
  if (hypotheses.length <= 1) {
    // Reset the only hypothesis
    hypotheses[0] = {
      id: 'hyp_init_' + Date.now(),
      name: 'Hipótesis 1: Caso Base T1C (30/30 kN)',
      data: { ...DEFAULT_HYPOTHESIS_DATA }
    };
    currentHypothesisId = hypotheses[0].id;
    saveHypothesesToStorage();
    selectHypothesis(currentHypothesisId);
    showToast('Hipótesis reseteada a valores por defecto');
  } else {
    // Delete current hypothesis and switch to another
    hypotheses = hypotheses.filter(h => h.id !== currentHypothesisId);
    currentHypothesisId = hypotheses[0].id;
    saveHypothesesToStorage();
    selectHypothesis(currentHypothesisId);
    showToast('🗑️ Hipótesis eliminada');
  }

  if (modal) modal.classList.remove('show');
}

function initUI() {
  // Initialize Diagram View
  const diagramContainer = document.getElementById('diagramViewContainer');
  if (diagramContainer) {
    diagramView = new DiagramView(diagramContainer, (key, value) => {
      state[key] = value;
      syncInputsFromState();
      updateCalculation();
    });
  }

  // Initialize Canvas Chart
  const chartCanvas = document.getElementById('interactionCanvas');
  if (chartCanvas) {
    interactionChart = new InteractionChart(chartCanvas);
  }

  // Bind Form Controls
  bindInputs();
  bindAnchorTypeSelection();
  bindModals();
  bindHypothesisControls();
  bindUserProfileMenu();
  applyUnitsToUI();
}

function applyUnitsToUI() {
  const isImp = globalUnits.isImperial();
  const labels = globalUnits.getUnitLabels();

  // 1. Update unit badges in inputs grid
  const unitMap = {
    'inp_Nsk': labels.force,
    'inp_Vsk': labels.force,
    'inp_cal': labels.length,
    'inp_car': labels.length,
    'inp_cau': labels.length,
    'inp_cad': labels.length,
    'inp_ha': labels.length,
    'inp_fck': labels.stress
  };

  Object.entries(unitMap).forEach(([id, unitText]) => {
    const el = document.getElementById(id);
    if (el) {
      const parent = el.closest('.input-badge') || el.parentElement;
      const unitSpan = parent?.querySelector('.unit');
      if (unitSpan) unitSpan.textContent = unitText;
    }
  });

  // 2. Update step, min and max
  const inpNsk = document.getElementById('inp_Nsk');
  const inpVsk = document.getElementById('inp_Vsk');
  if (inpNsk) { inpNsk.step = labels.forceStep; inpNsk.max = isImp ? '225' : '1000'; }
  if (inpVsk) { inpVsk.step = labels.forceStep; inpVsk.max = isImp ? '225' : '1000'; }

  ['inp_cal', 'inp_car', 'inp_cau', 'inp_cad', 'inp_ha'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) {
      inp.step = labels.lengthStep;
      inp.min = isImp ? '2' : (id === 'inp_ha' ? '100' : '50');
      inp.max = isImp ? '200' : '5000';
    }
  });

  const inpFck = document.getElementById('inp_fck');
  const sliderFck = document.getElementById('slider_fck');
  if (inpFck) {
    inpFck.min = labels.fckMin;
    inpFck.max = labels.fckMax;
    inpFck.step = labels.fckStep;
  }
  if (sliderFck) {
    sliderFck.min = labels.fckMin;
    sliderFck.max = labels.fckMax;
    sliderFck.step = labels.fckStep;
  }

  // 3. Update length options in dropdown
  const selLength = document.getElementById('sel_anchor_length');
  if (selLength) {
    const anchor = ANCHOR_TYPES[state.tipoCono];
    selLength.innerHTML = '';
    anchor.longitudesValidas.forEach(len => {
      const opt = document.createElement('option');
      opt.value = len;
      opt.textContent = isImp 
        ? `L = ${globalUnits.toDisplayLength(len)} in (${len} mm)`
        : `L = ${len} mm`;
      if (len === state.longitud) opt.selected = true;
      selLength.appendChild(opt);
    });
    selLength.value = state.longitud;
  }

  // 4. Update profile menu button text and badge
  updateUnitsUI();

  // 5. Sync inputs and diagram
  syncInputsFromState();
  syncDiagramFromState();
}

function bindInputs() {
  // Numeric Inputs in main grid (Lengths)
  ['cal', 'car', 'cau', 'cad', 'ha'].forEach(k => {
    const el = document.getElementById(`inp_${k}`);
    if (el) {
      el.addEventListener('input', () => {
        const raw = parseFloat(el.value) || 0;
        state[k] = globalUnits.fromDisplayLength(raw);
        syncDiagramFromState();
        updateCalculation();
      });
    }
  });

  // Numeric Inputs in main grid (Forces)
  ['Nsk', 'Vsk'].forEach(k => {
    const el = document.getElementById(`inp_${k}`);
    if (el) {
      el.addEventListener('input', () => {
        const raw = parseFloat(el.value) || 0;
        state[k] = globalUnits.fromDisplayForce(raw);
        syncDiagramFromState();
        updateCalculation();
      });
    }
  });

  // Fck input & slider
  const inpFck = document.getElementById('inp_fck');
  const fckSlider = document.getElementById('slider_fck');

  if (inpFck) {
    inpFck.addEventListener('input', () => {
      const raw = parseFloat(inpFck.value) || 0;
      state.fck = globalUnits.fromDisplayStress(raw);
      if (fckSlider) fckSlider.value = raw;
      updateCalculation();
    });
  }

  if (fckSlider) {
    fckSlider.addEventListener('input', () => {
      const raw = parseFloat(fckSlider.value) || 0;
      state.fck = globalUnits.fromDisplayStress(raw);
      if (inpFck) inpFck.value = raw;
      updateCalculation();
    });
  }

  // Afectado por Hueco Checkbox
  const chkHueco = document.getElementById('chk_hueco');
  if (chkHueco) {
    chkHueco.addEventListener('change', () => {
      state.afectadoHueco = chkHueco.checked;
      updateCalculation();
    });
  }

  // Accordion Toggle
  const accHeader = document.getElementById('accHeader');
  const accBody = document.getElementById('accBody');
  if (accHeader && accBody) {
    accHeader.addEventListener('click', () => {
      accBody.classList.toggle('open');
      const arrow = accHeader.querySelector('.acc-arrow');
      if (arrow) arrow.textContent = accBody.classList.contains('open') ? '▲' : '▼';
    });
  }

  // Print PDF button
  const btnPrint = document.getElementById('btnPrintReport');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  // Guardar Hipótesis Button in Header
  const btnSaveHyp = document.getElementById('btnSaveHypothesis');
  if (btnSaveHyp) {
    btnSaveHyp.addEventListener('click', openSaveHypothesisModal);
  }
}

function bindAnchorTypeSelection() {
  const optT1C = document.getElementById('opt_anchor_T1C');
  const opt240 = document.getElementById('opt_anchor_240');
  const selLength = document.getElementById('sel_anchor_length');

  const updateLengthOptions = () => {
    const anchor = ANCHOR_TYPES[state.tipoCono];
    const isImp = globalUnits.isImperial();
    selLength.innerHTML = '';
    anchor.longitudesValidas.forEach(len => {
      const opt = document.createElement('option');
      opt.value = len;
      opt.textContent = isImp 
        ? `L = ${globalUnits.toDisplayLength(len)} in (${len} mm)`
        : `L = ${len} mm`;
      if (len === state.longitud) opt.selected = true;
      selLength.appendChild(opt);
    });

    // Check if current length is valid for type
    if (!anchor.longitudesValidas.includes(state.longitud)) {
      state.longitud = anchor.defaultLongitud;
      selLength.value = state.longitud;
    }
  };

  if (optT1C) {
    optT1C.addEventListener('click', () => {
      state.tipoCono = 'T1C';
      optT1C.classList.add('active');
      opt240.classList.remove('active');
      updateLengthOptions();
      updateCalculation();
    });
  }

  if (opt240) {
    opt240.addEventListener('click', () => {
      state.tipoCono = '240';
      opt240.classList.add('active');
      optT1C.classList.remove('active');
      updateLengthOptions();
      updateCalculation();
    });
  }

  if (selLength) {
    selLength.addEventListener('change', () => {
      state.longitud = parseInt(selLength.value, 10);
      updateCalculation();
    });
    updateLengthOptions();
  }
}

function bindHypothesisControls() {
  const selHyp = document.getElementById('selHypothesis');
  if (selHyp) {
    selHyp.addEventListener('change', () => {
      selectHypothesis(selHyp.value);
    });
  }

  const btnNewHyp = document.getElementById('btnNewHypothesis');
  if (btnNewHyp) {
    btnNewHyp.addEventListener('click', () => {
      openSaveHypothesisModal();
      const radioNew = document.getElementById('radioHypNew');
      if (radioNew) {
        radioNew.checked = true;
        const txtNew = document.getElementById('txtNewHypName');
        if (txtNew) {
          txtNew.disabled = false;
          txtNew.value = `Hipótesis ${hypotheses.length + 1}: ${state.tipoCono} L=${state.longitud}`;
          txtNew.focus();
        }
      }
    });
  }

  const btnDeleteHyp = document.getElementById('btnDeleteHypothesis');
  if (btnDeleteHyp) {
    btnDeleteHyp.addEventListener('click', openDeleteHypothesisModal);
  }

  const btnConfirmSave = document.getElementById('btnConfirmSaveHypothesis');
  if (btnConfirmSave) {
    btnConfirmSave.addEventListener('click', confirmSaveHypothesis);
  }

  const btnConfirmDelete = document.getElementById('btnConfirmDeleteHyp');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', confirmDeleteHypothesis);
  }

  const btnCancelDelete = document.getElementById('btnCancelDeleteHyp');
  const modalDelete = document.getElementById('modalDeleteHypothesis');
  if (btnCancelDelete && modalDelete) {
    btnCancelDelete.addEventListener('click', () => modalDelete.classList.remove('show'));
  }
  const btnCloseDeleteModal = document.getElementById('btnCloseDeleteHypModal');
  if (btnCloseDeleteModal && modalDelete) {
    btnCloseDeleteModal.addEventListener('click', () => modalDelete.classList.remove('show'));
  }
}

function bindUserProfileMenu() {
  const btnUserProfile = document.getElementById('btnUserProfile');
  const userProfileDropdown = document.getElementById('userProfileDropdown');
  const rowLanguageSelect = document.getElementById('rowLanguageSelect');
  const languageSubmenu = document.getElementById('languageSubmenu');
  const rowToggleUnits = document.getElementById('rowToggleUnits');
  const rowToggleDarkMode = document.getElementById('rowToggleDarkMode');
  const chkDarkMode = document.getElementById('chkDarkMode');
  const btnLogout = document.getElementById('btnLogoutProfile');

  if (btnUserProfile && userProfileDropdown) {
    btnUserProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = userProfileDropdown.style.display === 'block';
      userProfileDropdown.style.display = isVisible ? 'none' : 'block';
      btnUserProfile.classList.toggle('active', !isVisible);
      if (languageSubmenu) languageSubmenu.style.display = 'none';
      if (rowLanguageSelect) rowLanguageSelect.classList.remove('active');
    });

    // Language Row toggle
    if (rowLanguageSelect && languageSubmenu) {
      rowLanguageSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = languageSubmenu.style.display === 'block';
        languageSubmenu.style.display = isOpen ? 'none' : 'block';
        rowLanguageSelect.classList.toggle('active', !isOpen);
      });
    }

    // Language options select
    document.querySelectorAll('.lang-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        if (lang) {
          setLanguage(lang);
          document.querySelectorAll('.lang-opt').forEach(o => o.classList.toggle('selected', o.getAttribute('data-lang') === lang));
          languageSubmenu.style.display = 'none';
          rowLanguageSelect.classList.remove('active');
          updateUnitsUI();
          updateCalculation();
          showToast(`Idioma: ${getLanguageInfo(lang).nativeName}`);
        }
      });
    });

    // Units toggle row
    if (rowToggleUnits) {
      rowToggleUnits.addEventListener('click', (e) => {
        e.stopPropagation();
        isImperial = !isImperial;
        globalUnits.setSystem(isImperial ? UNIT_SYSTEMS.IMPERIAL : UNIT_SYSTEMS.METRIC);
        localStorage.setItem(UNITS_STORAGE_KEY, isImperial ? 'imperial' : 'metric');
        applyUnitsToUI();
        updateCalculation();
        showToast(isImperial ? 'Cambiado a Sistema Imperial (in / kips / psi)' : 'Cambiado a Sistema Métrico (mm / kN / MPa)');
      });
    }

    // Dark Mode toggle switch
    if (chkDarkMode) {
      chkDarkMode.addEventListener('change', (e) => {
        e.stopPropagation();
        const isDark = chkDarkMode.checked;
        if (isDark) {
          document.body.classList.remove('light-theme');
          localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } else {
          document.body.classList.add('light-theme');
          localStorage.setItem(THEME_STORAGE_KEY, 'light');
        }
        if (interactionChart && currentCalcResult) {
          interactionChart.draw(currentCalcResult);
        }
      });
    }

    if (rowToggleDarkMode && chkDarkMode) {
      rowToggleDarkMode.addEventListener('click', (e) => {
        if (e.target !== chkDarkMode) {
          chkDarkMode.checked = !chkDarkMode.checked;
          chkDarkMode.dispatchEvent(new Event('change'));
        }
      });
    }

    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfileDropdown.style.display = 'none';
        btnUserProfile.classList.remove('active');
        showToast(t('toast_session_closed'));
        setTimeout(() => {
          window.location.href = 'http://localhost:5173/';
        }, 800);
      });
    }

    // Outside click closes menu
    document.addEventListener('click', (e) => {
      if (!userProfileDropdown.contains(e.target) && !btnUserProfile.contains(e.target)) {
        userProfileDropdown.style.display = 'none';
        btnUserProfile.classList.remove('active');
        if (languageSubmenu) languageSubmenu.style.display = 'none';
        if (rowLanguageSelect) rowLanguageSelect.classList.remove('active');
      }
    });
  }
}

function bindModals() {
  // Ayuda Hueco Modal
  const btnHelp = document.getElementById('btnHelpVoid');
  const modalAyuda = document.getElementById('modalAyuda');
  const btnCloseAyuda = document.getElementById('btnCloseAyuda');
  const btnCloseAyudaOk = document.getElementById('btnCloseAyudaOk');

  if (btnHelp && modalAyuda) {
    btnHelp.addEventListener('click', () => modalAyuda.classList.add('show'));
  }
  if (btnCloseAyuda) btnCloseAyuda.addEventListener('click', () => modalAyuda.classList.remove('show'));
  if (btnCloseAyudaOk) btnCloseAyudaOk.addEventListener('click', () => modalAyuda.classList.remove('show'));

  // Word Report Action
  const btnOpenReportModal = document.getElementById('btnOpenReportModal');
  const modalReport = document.getElementById('modalReport');
  const btnCloseReport = document.getElementById('btnCloseReport');
  const btnDownloadWord = document.getElementById('btnDownloadWord');

  if (btnOpenReportModal) {
    btnOpenReportModal.addEventListener('click', () => {
      executeWordReportDownload(btnOpenReportModal);
    });
  }

  if (btnDownloadWord) {
    btnDownloadWord.addEventListener('click', () => {
      executeWordReportDownload(btnDownloadWord);
    });
  }

  if (btnCloseReport && modalReport) {
    btnCloseReport.addEventListener('click', () => modalReport.classList.remove('show'));
  }

  // Hypothesis Save Modal
  const modalHyp = document.getElementById('modalHypothesis');
  const btnCloseHyp = document.getElementById('btnCloseHypothesisModal');
  if (btnCloseHyp && modalHyp) {
    btnCloseHyp.addEventListener('click', () => modalHyp.classList.remove('show'));
  }

  // Hypothesis Delete Modal
  const modalDelete = document.getElementById('modalDeleteHypothesis');

  // Close on backdrop click
  [modalAyuda, modalReport, modalHyp, modalDelete].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show');
        }
      });
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalAyuda) modalAyuda.classList.remove('show');
      if (modalReport) modalReport.classList.remove('show');
      if (modalHyp) modalHyp.classList.remove('show');
      if (modalDelete) modalDelete.classList.remove('show');
    }
  });
}

async function executeWordReportDownload(triggerBtn = null) {
  let origHtml = '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    origHtml = triggerBtn.innerHTML;
    triggerBtn.innerHTML = '<span class="spinner" style="width:13px;height:13px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.6s linear infinite;margin-right:4px;"></span> <span>Generando...</span>';
  }

  showToast('Generando plantilla Word oficial cumplimentada...');

  try {
    const meta = {
      obra: document.getElementById('meta_obra')?.value || state.metadata.obra || 'Obra',
      cliente: document.getElementById('meta_cliente')?.value || state.metadata.cliente || 'Cliente',
      refAnclaje: document.getElementById('meta_ref')?.value || state.metadata.refAnclaje || 'Ref Anclaje',
      autor: document.getElementById('meta_autor')?.value || state.metadata.autor || 'Dpto. Técnico',
      fecha: new Date().toLocaleDateString('es-ES')
    };

    const templateBuf = getTemplateBuffer(state.tipoCono, state.afectadoHueco);
    const docxBlob = await generateDocx(currentCalcResult, meta, templateBuf);

    // Trigger browser download
    const blob = new Blob([docxBlob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const huecoSuffix = state.afectadoHueco ? 'con_hueco' : 'sin_hueco';
    const obraSanitized = (meta.obra || 'Obra').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Informe_${state.tipoCono}_${huecoSuffix}_${obraSanitized}.docx`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const modalReport = document.getElementById('modalReport');
    if (modalReport) modalReport.classList.remove('show');

    showToast(`✅ Plantilla Word "${filename}" descargada con éxito`);
  } catch (err) {
    console.error('Error al generar informe:', err);
    alert('Error al generar el informe Word: ' + err.message);
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = origHtml;
    }
  }
}

function syncDiagramFromState() {
  if (diagramView) {
    diagramView.updateValues({
      cal: state.cal,
      car: state.car,
      cau: state.cau,
      cad: state.cad,
      ha: state.ha,
      Vsk: state.Vsk,
      Nsk: state.Nsk
    });
  }
}

function syncInputsFromState() {
  ['cal', 'car', 'cau', 'cad', 'ha'].forEach(k => {
    const el = document.getElementById(`inp_${k}`);
    if (el && document.activeElement !== el) {
      el.value = globalUnits.toDisplayLength(state[k]);
    }
  });

  ['Nsk', 'Vsk'].forEach(k => {
    const el = document.getElementById(`inp_${k}`);
    if (el && document.activeElement !== el) {
      el.value = globalUnits.toDisplayForce(state[k]);
    }
  });

  const inpFck = document.getElementById('inp_fck');
  const sliderFck = document.getElementById('slider_fck');
  if (inpFck && document.activeElement !== inpFck) {
    inpFck.value = globalUnits.toDisplayStress(state.fck);
  }
  if (sliderFck && document.activeElement !== sliderFck) {
    sliderFck.value = globalUnits.toDisplayStress(state.fck);
  }
}

function syncAllUIFromState() {
  syncDiagramFromState();
  syncInputsFromState();

  const optT1C = document.getElementById('opt_anchor_T1C');
  const opt240 = document.getElementById('opt_anchor_240');
  if (state.tipoCono === 'T1C') {
    optT1C.classList.add('active');
    opt240.classList.remove('active');
  } else {
    opt240.classList.add('active');
    optT1C.classList.remove('active');
  }

  const selLength = document.getElementById('sel_anchor_length');
  if (selLength) {
    const anchor = ANCHOR_TYPES[state.tipoCono];
    const isImp = globalUnits.isImperial();
    selLength.innerHTML = '';
    anchor.longitudesValidas.forEach(len => {
      const opt = document.createElement('option');
      opt.value = len;
      opt.textContent = isImp 
        ? `L = ${globalUnits.toDisplayLength(len)} in (${len} mm)`
        : `L = ${len} mm`;
      if (len === state.longitud) opt.selected = true;
      selLength.appendChild(opt);
    });
    selLength.value = state.longitud;
  }

  const chkHueco = document.getElementById('chk_hueco');
  if (chkHueco) chkHueco.checked = state.afectadoHueco;

  const sliderFck = document.getElementById('slider_fck');
  if (sliderFck) sliderFck.value = globalUnits.toDisplayStress(state.fck);
}

function updateCalculation() {
  // Run calculation engine (Always computes on exact SI state)
  currentCalcResult = calculateAnchor(state);
  const res = currentCalcResult;

  // 1. Thickness Validation Warning
  const warnThickness = document.getElementById('warnThickness');
  if (warnThickness) {
    if (state.longitud > state.ha) {
      warnThickness.style.display = 'flex';
      warnThickness.textContent = `⚠️ La longitud de anclaje (${globalUnits.formatLength(state.longitud)}) no puede ser superior al espesor del muro (${globalUnits.formatLength(state.ha)}).`;
    } else {
      warnThickness.style.display = 'none';
    }
  }

  // 2. Global Verdict Card
  const verdictCard = document.getElementById('globalVerdictCard');
  const verdictPill = document.getElementById('verdictPill');
  const verdictPct = document.getElementById('verdictUtilPct');
  const verdictFormula = document.getElementById('verdictFormulaText');

  const isOK = res.global.status === 'OK';
  if (verdictCard) {
    verdictCard.className = `global-verdict-card ${isOK ? 'verdict-ok' : 'verdict-ko'}`;
  }
  if (verdictPill) {
    verdictPill.textContent = isOK ? 'OK' : 'NO OK';
  }
  if (verdictPct) {
    verdictPct.textContent = `${res.global.utilizacionResistencia.toFixed(2)}%`;
  }
  if (verdictFormula) {
    const dispNd = globalUnits.formatForce(res.inputs.Nd);
    const dispNRd = globalUnits.formatForce(res.traccion.NRd);
    const dispVd = globalUnits.formatForce(res.inputs.Vd);
    const dispVRd = globalUnits.formatForce(res.cortante.VRd);
    verdictFormula.textContent = `(Nsd/NRd)^5/3 + (Vsd/VRd)^5/3 = (${dispNd} / ${dispNRd})^1.67 + (${dispVd} / ${dispVRd})^1.67 = ${(res.global.interaccion).toFixed(3)} ≤ 1.0`;
  }

  // 3. Render Canvas Chart
  if (interactionChart) {
    interactionChart.draw(res);
  }

  // 4. Update 6 Failure Mode Cards
  updateModeCard('mode_tornillo', res.modosFallo.tornilloAxial);
  updateModeCard('mode_dw', res.modosFallo.barraDWAxial);
  updateModeCard('mode_cono_n', res.modosFallo.conoHormigonAxial);
  updateModeCard('mode_cono_v', res.modosFallo.conoHormigonCortante);
  updateModeCard('mode_cabeceo', res.modosFallo.cabeceoCortante);
  updateModeCard('mode_cono_metal', res.modosFallo.conoMetalicoCortante);

  // 5. Update Detailed Accordion Tables
  updateDetailedTables(res);
}

function updateModeCard(elementId, modeData) {
  const card = document.getElementById(elementId);
  if (!card) return;

  const pct = Math.round(modeData.pct);
  const badge = card.querySelector('.mode-status-badge');
  const fill = card.querySelector('.mode-progress-bar-fill');
  const valText = card.querySelector('.mode-pct-val');

  if (badge) {
    badge.textContent = modeData.status;
    badge.className = `mode-status-badge ${modeData.status === 'OK' ? 'badge-ok' : 'badge-ko'}`;
  }

  if (valText) {
    valText.textContent = `${pct}%`;
  }

  if (fill) {
    const clampPct = Math.min(pct, 100);
    fill.style.width = `${clampPct}%`;
    if (pct < 70) fill.style.backgroundColor = '#10b981'; // green
    else if (pct <= 100) fill.style.backgroundColor = '#f59e0b'; // orange
    else fill.style.backgroundColor = '#ef4444'; // red
  }
}

function updateDetailedTables(res) {
  // Tracción
  document.getElementById('dt_hef').textContent = globalUnits.formatLength(res.inputs.longitud);
  document.getElementById('dt_hefPrime').textContent = globalUnits.formatLength(res.traccion.hefPrime);
  document.getElementById('dt_Nsa').textContent = globalUnits.formatForce(res.traccion.Nsa);
  document.getElementById('dt_Ncb').textContent = globalUnits.formatForce(res.traccion.Ncb);
  document.getElementById('dt_NRd').textContent = globalUnits.formatForce(res.traccion.NRd);

  // Cortante
  document.getElementById('dt_ca2infPrime').textContent = globalUnits.formatLength(res.cortante.ca2infPrime);
  document.getElementById('dt_Vsa').textContent = globalUnits.formatForce(res.cortante.Vsa);
  document.getElementById('dt_Vcb').textContent = globalUnits.formatForce(res.cortante.Vcb);
  document.getElementById('dt_Vcp').textContent = globalUnits.formatForce(res.cortante.Vcp);
  document.getElementById('dt_VRd').textContent = globalUnits.formatForce(res.cortante.VRd);
}

function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
