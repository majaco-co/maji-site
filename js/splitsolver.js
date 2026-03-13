/**
 * maji Split Solver — 3-phase MECE problem-solving tool
 * Phase 1: Problem Definition
 * Phase 2: Split Tree (recursive MECE decomposition)
 * Phase 3: Root Cause Synthesis & Export
 */
(function () {
  'use strict';

  var state = {
    phase: 1,
    problem: '',
    keyVariable: '',
    target: '',
    targetUnit: '',
    actual: '',
    actualUnit: '',
    pattern: '',
    tree: null, // root node
    explanations: {},
    combined: '',
    validation: ''
  };

  var nextId = 1;

  /* ---- Persistence ---- */
  function saveState() {
    try {
      localStorage.setItem('maji-splitsolver', JSON.stringify(state));
    } catch (e) { /* quota */ }
  }

  function loadState() {
    try {
      var saved = localStorage.getItem('maji-splitsolver');
      if (saved) {
        var parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(function (k) { state[k] = parsed[k]; });
        // Ensure nextId is higher than any existing id
        if (state.tree) {
          walkTree(state.tree, function (n) {
            if (n.id >= nextId) nextId = n.id + 1;
          });
        }
      }
    } catch (e) { /* corrupt */ }
  }

  function walkTree(node, fn) {
    if (!node) return;
    fn(node);
    if (node.children) {
      node.children.forEach(function (c) { walkTree(c, fn); });
    }
  }

  function resetState() {
    state = {
      phase: 1, problem: '', keyVariable: '', target: '', targetUnit: '',
      actual: '', actualUnit: '', pattern: '', tree: null,
      explanations: {}, combined: '', validation: ''
    };
    nextId = 1;
    localStorage.removeItem('maji-splitsolver');
    render();
  }

  /* ---- Create nodes ---- */
  function createNode(name, target, targetUnit, actual, actualUnit) {
    return {
      id: nextId++,
      name: name || '',
      target: target || '',
      targetUnit: targetUnit || '',
      actual: actual || '',
      actualUnit: actualUnit || '',
      status: '?', // '?' = unknown, 'ok' = confirmed OK, 'x' = root cause
      children: [],
      splitType: 'additive'
    };
  }

  /* ---- Rendering ---- */
  function render() {
    var app = document.getElementById('splitsolver-app');
    if (!app) return;

    var html = '';

    // Phase tabs
    html += '<div class="ss-tabs">';
    for (var p = 1; p <= 3; p++) {
      var active = state.phase === p ? ' ss-tab--active' : '';
      var label = p === 1 ? '1. Define' : p === 2 ? '2. Split' : '3. Understand';
      html += '<button class="ss-tab' + active + '" data-phase="' + p + '">' + label + '</button>';
    }
    html += '</div>';

    if (state.phase === 1) html += renderPhase1();
    else if (state.phase === 2) html += renderPhase2();
    else html += renderPhase3();

    app.innerHTML = html;
    bindEvents();
  }

  function renderPhase1() {
    var h = '<div class="ss-phase">';
    h += '<h2>Phase 1: Problem Definition</h2>';
    h += '<div class="ss-form-group"><label>Problem Statement</label>';
    h += '<textarea id="ss-problem" rows="3" placeholder="e.g., Line 3 afternoon shift shows 15% reject rate vs normal 3%">' + esc(state.problem) + '</textarea></div>';
    h += '<div class="ss-row">';
    h += '<div class="ss-form-group ss-flex-1"><label>Key Variable</label><input type="text" id="ss-kv" value="' + esc(state.keyVariable) + '" placeholder="e.g., Reject Rate"></div>';
    h += '</div>';
    h += '<div class="ss-row">';
    h += '<div class="ss-form-group"><label>Target</label><input type="number" id="ss-target" value="' + esc(state.target) + '" style="width:100px"></div>';
    h += '<div class="ss-form-group"><label>Unit</label><input type="text" id="ss-target-unit" value="' + esc(state.targetUnit) + '" style="width:80px" placeholder="%"></div>';
    h += '<div class="ss-form-group"><label>Actual</label><input type="number" id="ss-actual" value="' + esc(state.actual) + '" style="width:100px"></div>';
    h += '<div class="ss-form-group"><label>Unit</label><input type="text" id="ss-actual-unit" value="' + esc(state.actualUnit) + '" style="width:80px" placeholder="%"></div>';
    h += '</div>';
    h += '<div class="ss-form-group"><label>Pattern of Occurrences</label>';
    h += '<textarea id="ss-pattern" rows="3" placeholder="When does it occur? Where? Which products?">' + esc(state.pattern) + '</textarea></div>';
    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-reset">New</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-proceed1">Proceed &rarr;</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function renderPhase2() {
    if (!state.tree) {
      state.tree = createNode(state.keyVariable || 'Root', state.target, state.targetUnit, state.actual, state.actualUnit);
      saveState();
    }

    var h = '<div class="ss-phase">';
    h += '<h2>Phase 2: Split Tree Analysis</h2>';
    h += '<div class="ss-review"><strong>Problem:</strong> ' + esc(state.problem) + ' &mdash; <strong>' + esc(state.keyVariable) + '</strong>: Target ' + esc(state.target) + esc(state.targetUnit) + ', Actual ' + esc(state.actual) + esc(state.actualUnit) + '</div>';
    h += '<div class="ss-tree">';
    h += renderNode(state.tree, 0);
    h += '</div>';
    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-back2">&larr; Back</button>';
    h += '<button class="btn btn-sm" id="ss-save2">Save</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-proceed2">Proceed &rarr;</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function renderNode(node, depth) {
    var statusClass = node.status === 'ok' ? 'ss-node--ok' : node.status === 'x' ? 'ss-node--cause' : 'ss-node--unknown';
    var statusIcon = node.status === 'ok' ? '<span class="ss-status ss-status--ok">&#10003;</span>' :
                     node.status === 'x' ? '<span class="ss-status ss-status--cause">X</span>' :
                     '<span class="ss-status ss-status--unknown">?</span>';

    var indent = depth * 28;
    var h = '<div class="ss-node ' + statusClass + '" style="margin-left:' + indent + 'px" data-id="' + node.id + '">';
    h += '<div class="ss-node__header">';
    h += statusIcon;
    h += '<strong>' + esc(node.name) + '</strong>';
    if (node.target !== '' || node.actual !== '') {
      h += ' <span class="ss-node__values">(Target: ' + esc(node.target) + esc(node.targetUnit) + ', Actual: ' + esc(node.actual) + esc(node.actualUnit) + ')</span>';
    }
    h += '</div>';
    h += '<div class="ss-node__actions">';
    if (node.status === '?') {
      h += '<button class="btn btn-primary btn-sm ss-btn-split" data-id="' + node.id + '">Split</button>';
    }
    h += '<button class="btn btn-sm ss-btn-ok" data-id="' + node.id + '" title="Mark OK">&#10003;</button>';
    h += '<button class="btn btn-sm ss-btn-cause" data-id="' + node.id + '" title="Mark as Root Cause">X</button>';
    if (node.children.length > 0) {
      h += '<button class="btn btn-sm ss-btn-del" data-id="' + node.id + '" title="Delete children">Del</button>';
    }
    h += '</div>';
    h += '</div>';

    if (node.children.length > 0) {
      var opSymbol = node.splitType === 'multiplicative' ? ' x ' : ' + ';
      h += '<div class="ss-equation" style="margin-left:' + (indent + 14) + 'px; font-size:0.8em; color:#666; margin-bottom:4px;">';
      h += esc(node.name) + ' = ' + node.children.map(function (c) { return esc(c.name); }).join(opSymbol);
      h += '</div>';
      node.children.forEach(function (child) {
        h += renderNode(child, depth + 1);
      });
    }

    return h;
  }

  function renderPhase3() {
    var rootCauses = [];
    if (state.tree) {
      walkTree(state.tree, function (n) {
        if (n.status === 'x') rootCauses.push(n);
      });
    }

    var h = '<div class="ss-phase">';
    h += '<h2>Phase 3: Root Cause Synthesis</h2>';

    if (rootCauses.length === 0) {
      h += '<p>No root causes identified yet. Go back to Phase 2 and mark causes with X.</p>';
    } else {
      h += '<h3>Root Causes Identified</h3>';
      rootCauses.forEach(function (rc) {
        h += '<div class="ss-cause-card">';
        h += '<div class="ss-cause-card__header"><strong>' + esc(rc.name) + '</strong>';
        if (rc.target !== '' || rc.actual !== '') {
          h += ' (Target: ' + esc(rc.target) + esc(rc.targetUnit) + ', Actual: ' + esc(rc.actual) + esc(rc.actualUnit) + ')';
        }
        h += '</div>';
        h += '<label>Explain the mechanism:</label>';
        h += '<textarea class="ss-explanation" data-id="' + rc.id + '" rows="2">' + esc(state.explanations[rc.id] || '') + '</textarea>';
        h += '</div>';
      });
    }

    h += '<div class="ss-form-group" style="margin-top:1.5rem"><label>Combined Understanding</label>';
    h += '<textarea id="ss-combined" rows="3" placeholder="How do the root causes combine to produce the problem?">' + esc(state.combined) + '</textarea></div>';

    h += '<div class="ss-form-group"><label>Validation</label>';
    h += '<textarea id="ss-validation" rows="3" placeholder="Does this explanation account for all observations in Phase 1?">' + esc(state.validation) + '</textarea></div>';

    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-back3">&larr; Back</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-export">Export PDF</button>';
    h += '<button class="btn btn-sm" id="ss-reset3">New</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---- Find node by id ---- */
  function findNode(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    for (var i = 0; i < node.children.length; i++) {
      var found = findNode(node.children[i], id);
      if (found) return found;
    }
    return null;
  }

  /* ---- Event Binding ---- */
  function bindEvents() {
    // Phase tabs
    document.querySelectorAll('.ss-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.phase = parseInt(this.dataset.phase);
        saveState();
        render();
      });
    });

    // Phase 1
    bindInput('ss-problem', 'problem');
    bindInput('ss-kv', 'keyVariable');
    bindInput('ss-target', 'target');
    bindInput('ss-target-unit', 'targetUnit');
    bindInput('ss-actual', 'actual');
    bindInput('ss-actual-unit', 'actualUnit');
    bindInput('ss-pattern', 'pattern');

    var resetBtn = document.getElementById('ss-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetState);

    var proceed1 = document.getElementById('ss-proceed1');
    if (proceed1) proceed1.addEventListener('click', function () {
      if (!state.problem.trim()) { alert('Please enter a problem statement.'); return; }
      state.phase = 2;
      saveState();
      render();
    });

    // Phase 2
    var back2 = document.getElementById('ss-back2');
    if (back2) back2.addEventListener('click', function () { state.phase = 1; saveState(); render(); });

    var save2 = document.getElementById('ss-save2');
    if (save2) save2.addEventListener('click', function () { saveState(); alert('Progress saved.'); });

    var proceed2 = document.getElementById('ss-proceed2');
    if (proceed2) proceed2.addEventListener('click', function () { state.phase = 3; saveState(); render(); });

    // Split buttons
    document.querySelectorAll('.ss-btn-split').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        showSplitForm(parseInt(this.dataset.id));
      });
    });

    // OK buttons
    document.querySelectorAll('.ss-btn-ok').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var node = findNode(state.tree, parseInt(this.dataset.id));
        if (node) { node.status = 'ok'; saveState(); render(); }
      });
    });

    // Cause buttons
    document.querySelectorAll('.ss-btn-cause').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var node = findNode(state.tree, parseInt(this.dataset.id));
        if (node) { node.status = 'x'; saveState(); render(); }
      });
    });

    // Del buttons
    document.querySelectorAll('.ss-btn-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var node = findNode(state.tree, parseInt(this.dataset.id));
        if (node) { node.children = []; node.status = '?'; saveState(); render(); }
      });
    });

    // Phase 3
    var back3 = document.getElementById('ss-back3');
    if (back3) back3.addEventListener('click', function () { state.phase = 2; saveState(); render(); });

    var reset3 = document.getElementById('ss-reset3');
    if (reset3) reset3.addEventListener('click', resetState);

    var exportBtn = document.getElementById('ss-export');
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);

    // Phase 3 explanations
    document.querySelectorAll('.ss-explanation').forEach(function (ta) {
      ta.addEventListener('input', function () {
        state.explanations[this.dataset.id] = this.value;
        saveState();
      });
    });

    bindInput('ss-combined', 'combined');
    bindInput('ss-validation', 'validation');
  }

  function bindInput(elId, stateKey) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener('input', function () {
      state[stateKey] = this.value;
      saveState();
    });
  }

  /* ---- Split form ---- */
  function showSplitForm(nodeId) {
    var node = findNode(state.tree, nodeId);
    if (!node) return;

    var nodeEl = document.querySelector('.ss-node[data-id="' + nodeId + '"]');
    if (!nodeEl) return;

    // Remove any existing form
    var existing = document.querySelector('.ss-split-form');
    if (existing) existing.remove();

    var form = document.createElement('div');
    form.className = 'ss-split-form';
    form.innerHTML = '<div class="ss-split-form__inner">' +
      '<h4>Split "' + esc(node.name) + '"</h4>' +
      '<div class="ss-row" style="margin-bottom:8px;">' +
      '<label style="margin-right:12px;"><input type="radio" name="splitType" value="additive" checked> Additive (+)</label>' +
      '<label style="margin-right:12px;"><input type="radio" name="splitType" value="multiplicative"> Multiplicative (&times;)</label>' +
      '<label><input type="radio" name="splitType" value="other"> Other</label>' +
      '</div>' +
      '<div id="ss-split-rows"></div>' +
      '<div class="ss-actions" style="margin-top:8px;">' +
      '<button class="btn btn-sm" id="ss-add-row">+ Row</button>' +
      '<button class="btn btn-primary btn-sm" id="ss-split-ok">OK</button>' +
      '<button class="btn btn-sm" id="ss-split-cancel">Cancel</button>' +
      '</div></div>';

    nodeEl.after(form);

    // Add initial 2 rows
    addSplitRow();
    addSplitRow();

    document.getElementById('ss-add-row').addEventListener('click', addSplitRow);

    document.getElementById('ss-split-cancel').addEventListener('click', function () {
      form.remove();
    });

    document.getElementById('ss-split-ok').addEventListener('click', function () {
      var splitType = form.querySelector('input[name="splitType"]:checked').value;
      var rows = form.querySelectorAll('.ss-split-row');
      var children = [];
      rows.forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        var name = inputs[0].value.trim();
        if (!name) return;
        children.push(createNode(
          name,
          inputs[1] ? inputs[1].value : '',
          inputs[2] ? inputs[2].value : '',
          inputs[3] ? inputs[3].value : '',
          inputs[4] ? inputs[4].value : ''
        ));
      });
      if (children.length < 2) { alert('Add at least 2 branches.'); return; }
      node.children = children;
      node.splitType = splitType;
      saveState();
      render();
    });
  }

  function addSplitRow() {
    var container = document.getElementById('ss-split-rows');
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'ss-split-row ss-row';
    row.innerHTML = '<input type="text" placeholder="Name" style="flex:2;min-width:120px">' +
      '<input type="number" placeholder="Target" style="width:80px">' +
      '<input type="text" placeholder="Unit" style="width:60px">' +
      '<input type="number" placeholder="Actual" style="width:80px">' +
      '<input type="text" placeholder="Unit" style="width:60px">';
    container.appendChild(row);
  }

  /* ---- Export PDF (simple print-based) ---- */
  function exportPDF() {
    savePhase3Inputs();
    var rootCauses = [];
    if (state.tree) {
      walkTree(state.tree, function (n) {
        if (n.status === 'x') rootCauses.push(n);
      });
    }

    var w = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><title>Split Solve Report</title>';
    html += '<style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a;}';
    html += 'h1{font-size:1.5rem;margin-bottom:0.5rem;} h2{font-size:1.2rem;margin-top:1.5rem;border-bottom:2px solid #2D6A4F;padding-bottom:4px;}';
    html += 'table{width:100%;border-collapse:collapse;margin:1rem 0;} th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;} th{background:#f7f7f7;}';
    html += '.cause{background:#FEE2E2;padding:8px;border-radius:4px;margin:8px 0;}';
    html += '@media print{body{margin:0;}}</style></head><body>';
    html += '<h1>Split Solve Analysis Report</h1>';
    html += '<p style="color:#666;">Generated by maji (majaco)</p>';
    html += '<h2>Problem Definition</h2>';
    html += '<p><strong>Problem:</strong> ' + esc(state.problem) + '</p>';
    html += '<p><strong>Key Variable:</strong> ' + esc(state.keyVariable) + ' &mdash; Target: ' + esc(state.target) + esc(state.targetUnit) + ', Actual: ' + esc(state.actual) + esc(state.actualUnit) + '</p>';
    html += '<p><strong>Pattern:</strong> ' + esc(state.pattern) + '</p>';

    html += '<h2>Root Causes</h2>';
    if (rootCauses.length === 0) {
      html += '<p>No root causes identified.</p>';
    } else {
      rootCauses.forEach(function (rc) {
        html += '<div class="cause"><strong>' + esc(rc.name) + '</strong>';
        if (rc.target !== '' || rc.actual !== '') {
          html += ' (Target: ' + esc(rc.target) + esc(rc.targetUnit) + ', Actual: ' + esc(rc.actual) + esc(rc.actualUnit) + ')';
        }
        var expl = state.explanations[rc.id] || '';
        if (expl) html += '<br>Mechanism: ' + esc(expl);
        html += '</div>';
      });
    }

    html += '<h2>Combined Understanding</h2>';
    html += '<p>' + esc(state.combined || '(not provided)') + '</p>';
    html += '<h2>Validation</h2>';
    html += '<p>' + esc(state.validation || '(not provided)') + '</p>';
    html += '</body></html>';

    w.document.write(html);
    w.document.close();
    setTimeout(function () { w.print(); }, 500);
  }

  function savePhase3Inputs() {
    var comb = document.getElementById('ss-combined');
    if (comb) state.combined = comb.value;
    var val = document.getElementById('ss-validation');
    if (val) state.validation = val.value;
    document.querySelectorAll('.ss-explanation').forEach(function (ta) {
      state.explanations[ta.dataset.id] = ta.value;
    });
    saveState();
  }

  /* ---- Init ---- */
  function init() {
    var app = document.getElementById('splitsolver-app');
    if (!app) return;
    loadState();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
