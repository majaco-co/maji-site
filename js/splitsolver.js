/**
 * maji Split Solver — 3-phase MECE problem-solving tool
 * Phase 1: Problem Definition
 * Phase 2: Split Tree (recursive MECE decomposition)
 * Phase 3: Root Cause Synthesis & Export
 *
 * Enhanced with progress indicator, visual tree connectors,
 * animated transitions, and polished card-based UI.
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
    tree: null,
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
      status: '?',
      children: [],
      splitType: 'additive'
    };
  }

  /* ---- Count stats ---- */
  function getTreeStats() {
    var total = 0, ok = 0, causes = 0, unknown = 0;
    if (state.tree) {
      walkTree(state.tree, function (n) {
        total++;
        if (n.status === 'ok') ok++;
        else if (n.status === 'x') causes++;
        else unknown++;
      });
    }
    return { total: total, ok: ok, causes: causes, unknown: unknown };
  }

  /* ---- Rendering ---- */
  function render() {
    var app = document.getElementById('splitsolver-app');
    if (!app) return;

    var html = '';

    // Progress indicator
    html += renderProgress();

    // Phase content
    html += '<div class="ss-phase-enter">';
    if (state.phase === 1) html += renderPhase1();
    else if (state.phase === 2) html += renderPhase2();
    else html += renderPhase3();
    html += '</div>';

    app.innerHTML = html;
    bindEvents();
  }

  function renderProgress() {
    var phases = [
      { num: 1, label: 'Define' },
      { num: 2, label: 'Split' },
      { num: 3, label: 'Understand' }
    ];

    var h = '<div class="ss-progress">';
    phases.forEach(function (p, idx) {
      var isActive = state.phase === p.num;
      var isDone = state.phase > p.num;
      var cls = isActive ? 'ss-progress__step--active' : isDone ? 'ss-progress__step--done' : '';

      h += '<div class="ss-progress__step ' + cls + '" data-phase="' + p.num + '">';
      h += '<div class="ss-progress__num">';
      if (isDone) {
        h += '&#10003;';
      } else {
        h += p.num;
      }
      h += '</div>';
      h += '<div class="ss-progress__label">' + p.label + '</div>';
      h += '</div>';

      if (idx < phases.length - 1) {
        var lineFilled = state.phase > p.num;
        h += '<div class="ss-progress__line' + (lineFilled ? ' ss-progress__line--filled' : '') + '"></div>';
      }
    });
    h += '</div>';
    return h;
  }

  function renderPhase1() {
    var h = '<div class="ss-phase">';
    h += '<h2>Phase 1: Problem Definition</h2>';
    h += '<p style="color:var(--color-text-muted);margin-bottom:1.5rem;">Define the problem clearly with measurable targets. A well-defined problem is half-solved.</p>';

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

    // Show gap if both target and actual are filled
    if (state.target && state.actual) {
      var gap = parseFloat(state.actual) - parseFloat(state.target);
      var gapColor = gap > 0 ? '#EF4444' : '#2D6A4F';
      var gapSign = gap > 0 ? '+' : '';
      h += '<div style="background:' + (gap > 0 ? '#FEF2F2' : '#D8F3DC') + ';border-radius:8px;padding:8px 16px;margin-bottom:12px;font-size:0.85rem;">';
      h += '<strong>Gap:</strong> <span style="color:' + gapColor + ';font-weight:700;">' + gapSign + gap.toFixed(1) + esc(state.actualUnit || state.targetUnit) + '</span>';
      h += '</div>';
    }

    h += '<div class="ss-form-group"><label>Pattern of Occurrences</label>';
    h += '<textarea id="ss-pattern" rows="3" placeholder="When does it occur? Where? Which products?">' + esc(state.pattern) + '</textarea></div>';

    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-reset" style="color: var(--color-text-muted);">Start New</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-proceed1" style="background:#2D6A4F;">Proceed to Split &rarr;</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function renderPhase2() {
    if (!state.tree) {
      state.tree = createNode(state.keyVariable || 'Root', state.target, state.targetUnit, state.actual, state.actualUnit);
      saveState();
    }

    var stats = getTreeStats();

    var h = '<div class="ss-phase">';
    h += '<h2>Phase 2: Split Tree Analysis</h2>';

    // Problem summary card
    h += '<div class="ss-review">';
    h += '<strong>Problem:</strong> ' + esc(state.problem) + '<br>';
    h += '<strong>' + esc(state.keyVariable) + '</strong>: Target ' + esc(state.target) + esc(state.targetUnit) + ', Actual ' + esc(state.actual) + esc(state.actualUnit);
    h += '</div>';

    // Tree stats bar
    h += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    h += '<span style="font-size:0.75rem;padding:4px 10px;border-radius:20px;background:#D8F3DC;color:#1B4332;">' + stats.ok + ' resolved</span>';
    h += '<span style="font-size:0.75rem;padding:4px 10px;border-radius:20px;background:#FEE2E2;color:#991B1B;">' + stats.causes + ' root cause' + (stats.causes !== 1 ? 's' : '') + '</span>';
    h += '<span style="font-size:0.75rem;padding:4px 10px;border-radius:20px;background:#F3F4F6;color:#6B7280;">' + stats.unknown + ' to investigate</span>';
    h += '</div>';

    h += '<p style="font-size:0.85rem;color:var(--color-text-muted);margin-bottom:1rem;">Split until all branches end with &#10003; (resolved) or X (root cause).</p>';

    h += '<div class="ss-tree ss-tree-v2">';
    h += renderNode(state.tree, 0, false);
    h += '</div>';

    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-back2">&larr; Back</button>';
    h += '<button class="btn btn-sm" id="ss-save2" style="background:#D8F3DC;color:#1B4332;">Save Progress</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-proceed2" style="background:#2D6A4F;">Proceed to Understand &rarr;</button>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  function renderNode(node, depth, isLastChild) {
    var statusClass = node.status === 'ok' ? 'ss-node--ok' : node.status === 'x' ? 'ss-node--cause' : 'ss-node--unknown';
    var statusIcon = node.status === 'ok' ? '<span class="ss-status ss-status--ok">&#10003;</span>' :
                     node.status === 'x' ? '<span class="ss-status ss-status--cause">X</span>' :
                     '<span class="ss-status ss-status--unknown">?</span>';

    var indent = depth * 28;
    var h = '';

    // Wrapper with connector
    if (depth > 0) {
      h += '<div class="ss-tree-connector" style="margin-left:' + (indent - 28) + 'px">';
    }

    h += '<div class="ss-node ss-node-enter ' + statusClass + '" style="' + (depth === 0 ? '' : '') + '" data-id="' + node.id + '">';
    h += '<div class="ss-node__header">';
    h += statusIcon;
    h += '<strong>' + esc(node.name) + '</strong>';
    if (node.target !== '' || node.actual !== '') {
      h += ' <span class="ss-node__values">(Target: ' + esc(node.target) + esc(node.targetUnit) + ', Actual: ' + esc(node.actual) + esc(node.actualUnit) + ')</span>';
    }
    h += '</div>';
    h += '<div class="ss-node__actions">';
    if (node.status === '?') {
      h += '<button class="btn btn-primary btn-sm ss-btn-split" data-id="' + node.id + '" style="background:#2D6A4F;font-size:0.7rem;">Split</button>';
    }
    h += '<button class="btn btn-sm ss-btn-ok" data-id="' + node.id + '" title="Mark OK" style="font-size:0.7rem;">&#10003;</button>';
    h += '<button class="btn btn-sm ss-btn-cause" data-id="' + node.id + '" title="Mark as Root Cause" style="font-size:0.7rem;">X</button>';
    if (node.children.length > 0) {
      h += '<button class="btn btn-sm ss-btn-del" data-id="' + node.id + '" title="Remove children" style="font-size:0.7rem;color:#6B7280;">Del</button>';
    }
    h += '</div>';
    h += '</div>';

    if (depth > 0) {
      h += '</div>';
    }

    if (node.children.length > 0) {
      var opSymbol = node.splitType === 'multiplicative' ? ' &times; ' : ' + ';
      h += '<div class="ss-equation" style="margin-left:' + (indent + 14) + 'px; font-size:0.8em; color:#6B7280; margin-bottom:4px; padding: 2px 8px; background: #F9FAFB; border-radius: 4px; display: inline-block;">';
      h += esc(node.name) + ' = ' + node.children.map(function (c) { return esc(c.name); }).join(opSymbol);
      h += '</div>';

      // MECE check
      if (node.splitType === 'additive') {
        var childSum = 0;
        var parentVal = parseFloat(node.actual);
        var allNumeric = !isNaN(parentVal) && parentVal !== 0;
        node.children.forEach(function (c) {
          var cv = parseFloat(c.actual);
          if (isNaN(cv)) allNumeric = false;
          else childSum += cv;
        });
        if (allNumeric && Math.abs(childSum - parentVal) / parentVal > 0.05) {
          h += '<div style="margin-left:' + (indent + 14) + 'px; font-size:0.7rem; color:#D97706; margin-bottom:4px; padding: 2px 8px; background: #FEF3C7; border-radius: 4px; display: inline-block;">';
          h += 'Warning: Children sum (' + childSum.toFixed(1) + ') deviates &gt;5% from parent (' + parentVal.toFixed(1) + ')';
          h += '</div>';
        }
      }

      node.children.forEach(function (child, idx) {
        h += renderNode(child, depth + 1, idx === node.children.length - 1);
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
    h += '<p style="color:var(--color-text-muted);margin-bottom:1.5rem;">Explain each root cause and validate the combined understanding against Phase 1 observations.</p>';

    if (rootCauses.length === 0) {
      h += '<div style="text-align:center;padding:2rem;background:#F3F4F6;border-radius:12px;">';
      h += '<p style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;">No root causes identified yet</p>';
      h += '<p style="color:var(--color-text-muted);">Go back to Phase 2 and mark causes with X.</p>';
      h += '</div>';
    } else {
      h += '<h3 style="margin-bottom:1rem;">Root Causes Identified (' + rootCauses.length + ')</h3>';
      rootCauses.forEach(function (rc, idx) {
        h += '<div class="ss-cause-card ss-node-enter" style="animation-delay:' + (idx * 100) + 'ms">';
        h += '<div class="ss-cause-card__header">';
        h += '<span class="ss-status ss-status--cause" style="display:inline-flex;vertical-align:middle;margin-right:6px;">X</span>';
        h += '<strong>' + esc(rc.name) + '</strong>';
        if (rc.target !== '' || rc.actual !== '') {
          h += ' <span style="color:var(--color-text-muted);font-size:0.85rem;">(Target: ' + esc(rc.target) + esc(rc.targetUnit) + ', Actual: ' + esc(rc.actual) + esc(rc.actualUnit) + ')</span>';
        }
        h += '</div>';
        h += '<label>Explain the mechanism:</label>';
        h += '<textarea class="ss-explanation" data-id="' + rc.id + '" rows="2" placeholder="Why does this cause the problem?">' + esc(state.explanations[rc.id] || '') + '</textarea>';
        h += '</div>';
      });
    }

    h += '<div class="ss-form-group" style="margin-top:1.5rem"><label>Combined Understanding</label>';
    h += '<textarea id="ss-combined" rows="3" placeholder="How do the root causes combine to produce the problem?">' + esc(state.combined) + '</textarea></div>';

    h += '<div class="ss-form-group"><label>Validation</label>';
    h += '<textarea id="ss-validation" rows="3" placeholder="Does this explanation account for all observations in Phase 1?">' + esc(state.validation) + '</textarea></div>';

    h += '<div class="ss-actions">';
    h += '<button class="btn btn-sm" id="ss-back3">&larr; Back</button>';
    h += '<button class="btn btn-primary btn-sm" id="ss-export" style="background:#2D6A4F;">Export PDF</button>';
    h += '<button class="btn btn-sm" id="ss-reset3" style="color:var(--color-text-muted);">Start New</button>';
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
    // Progress step clicks
    document.querySelectorAll('.ss-progress__step').forEach(function (step) {
      step.addEventListener('click', function () {
        state.phase = parseInt(this.dataset.phase);
        saveState();
        render();
      });
    });

    // Phase tabs (kept for backward compatibility)
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
    if (save2) save2.addEventListener('click', function () {
      saveState();
      this.textContent = 'Saved!';
      this.style.background = '#2D6A4F';
      this.style.color = '#fff';
      var btn = this;
      setTimeout(function () {
        btn.textContent = 'Save Progress';
        btn.style.background = '#D8F3DC';
        btn.style.color = '#1B4332';
      }, 1500);
    });

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

    var existing = document.querySelector('.ss-split-form');
    if (existing) existing.remove();

    var form = document.createElement('div');
    form.className = 'ss-split-form';
    form.innerHTML = '<div class="ss-split-form__inner">' +
      '<h4 style="font-size:0.9rem;margin-bottom:12px;">Split "' + esc(node.name) + '"</h4>' +
      '<div class="ss-row" style="margin-bottom:10px;">' +
      '<label style="margin-right:12px;font-size:0.8rem;cursor:pointer;"><input type="radio" name="splitType" value="additive" checked> Additive (+)</label>' +
      '<label style="margin-right:12px;font-size:0.8rem;cursor:pointer;"><input type="radio" name="splitType" value="multiplicative"> Multiplicative (&times;)</label>' +
      '<label style="font-size:0.8rem;cursor:pointer;"><input type="radio" name="splitType" value="other"> Other</label>' +
      '</div>' +
      '<div id="ss-split-rows"></div>' +
      '<div class="ss-actions" style="margin-top:10px;">' +
      '<button class="btn btn-sm" id="ss-add-row" style="background:#D8F3DC;color:#1B4332;">+ Add Branch</button>' +
      '<button class="btn btn-primary btn-sm" id="ss-split-ok" style="background:#2D6A4F;">Apply Split</button>' +
      '<button class="btn btn-sm" id="ss-split-cancel" style="color:var(--color-text-muted);">Cancel</button>' +
      '</div></div>';

    // Insert after the node's parent container
    var insertTarget = nodeEl.closest('.ss-tree-connector') || nodeEl;
    insertTarget.after(form);

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
    row.style.marginBottom = '6px';
    row.innerHTML = '<input type="text" placeholder="Name" style="flex:2;min-width:120px;padding:6px 10px;border:1.5px solid #D1D5DB;border-radius:6px;font-size:0.8rem;">' +
      '<input type="number" placeholder="Target" style="width:80px;padding:6px 10px;border:1.5px solid #D1D5DB;border-radius:6px;font-size:0.8rem;">' +
      '<input type="text" placeholder="Unit" style="width:60px;padding:6px 10px;border:1.5px solid #D1D5DB;border-radius:6px;font-size:0.8rem;">' +
      '<input type="number" placeholder="Actual" style="width:80px;padding:6px 10px;border:1.5px solid #D1D5DB;border-radius:6px;font-size:0.8rem;">' +
      '<input type="text" placeholder="Unit" style="width:60px;padding:6px 10px;border:1.5px solid #D1D5DB;border-radius:6px;font-size:0.8rem;">';
    container.appendChild(row);

    // Focus the first input of the new row
    var firstInput = row.querySelector('input');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 50);
  }

  /* ---- Export PDF ---- */
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
    html += '<style>body{font-family:Inter,system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1a1a1a;}';
    html += 'h1{font-size:1.5rem;margin-bottom:0.5rem;color:#1B4332;} h2{font-size:1.2rem;margin-top:1.5rem;border-bottom:2px solid #2D6A4F;padding-bottom:4px;color:#1B4332;}';
    html += 'table{width:100%;border-collapse:collapse;margin:1rem 0;} th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;} th{background:#D8F3DC;color:#1B4332;}';
    html += '.cause{background:#FEE2E2;padding:12px;border-radius:8px;margin:8px 0;border-left:3px solid #EF4444;}';
    html += '.header-bar{background:#1B4332;color:#fff;padding:20px;border-radius:8px;margin-bottom:20px;}';
    html += '@media print{body{margin:0;}.header-bar{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>';
    html += '<div class="header-bar"><h1 style="color:#fff;margin:0;">Split Solve Analysis Report</h1>';
    html += '<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Generated by maji (majaco)</p></div>';

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
