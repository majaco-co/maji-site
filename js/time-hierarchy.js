/**
 * maji Time Hierarchy — Interactive Visual Tree Visualisation
 * Shows parent-child relationships with proportional blocks,
 * animated transitions, hover tooltips, and metric highlighting.
 */
(function () {
  'use strict';

  /* ---- Hierarchy data model ---- */
  var hierarchy = {
    id: 'calendar-time',
    label: 'Calendar Time',
    desc: '24 x 7 x 365 = 8,760 hours/year',
    formula: 'Fixed: 8,760 hours',
    badge: 'Fixed',
    type: 'root',
    hours: 8760,
    children: [
      {
        id: 'non-working-time',
        label: 'Non-working Time',
        desc: 'Weekends, bank holidays, planned shutdown',
        formula: 'Typically 2,000-4,000 hours',
        badge: 'Commercial',
        type: 'subtracted',
        hours: 3000,
        children: []
      },
      {
        id: 'shift-time',
        label: 'Shift Time (Available Time)',
        desc: 'Calendar Time minus Non-working Time',
        formula: 'Shift Time = Calendar Time - Non-working Time',
        badge: 'Ops Management',
        type: 'positive',
        hours: 5760,
        children: [
          {
            id: 'schedule-loss',
            label: 'Schedule Loss',
            desc: 'Shifts not scheduled or not run',
            formula: 'e.g. unused shifts, no demand',
            badge: 'Commercial',
            type: 'subtracted',
            hours: 760,
            children: []
          },
          {
            id: 'planned-production-time',
            label: 'Planned Production Time',
            desc: 'Shift Time minus Schedule Loss',
            formula: 'PPT = Shift Time - Schedule Loss',
            badge: 'Ops Management',
            type: 'positive',
            hours: 5000,
            children: [
              {
                id: 'planned-downtime',
                label: 'Planned Downtime',
                desc: 'Maintenance, changeovers, breaks',
                formula: 'Planned DT = CILs + Changeovers + Breaks',
                badge: 'Engineering',
                type: 'subtracted',
                hours: 500,
                children: []
              },
              {
                id: 'operating-time',
                label: 'Operating Time',
                desc: 'PPT minus Planned Downtime',
                formula: 'Operating Time = PPT - Planned DT',
                badge: 'Shop Floor',
                type: 'positive',
                hours: 4500,
                children: [
                  {
                    id: 'unplanned-downtime',
                    label: 'Unplanned Downtime (UPDT)',
                    desc: 'Breakdowns, stoppages, waiting',
                    formula: 'UPDT = Breakdowns + Minor Stops + Waiting',
                    badge: 'Shop Floor / Eng.',
                    type: 'loss',
                    hours: 500,
                    children: []
                  },
                  {
                    id: 'up-time',
                    label: 'Up Time',
                    desc: 'Operating Time minus Unplanned Downtime',
                    formula: 'Up Time = Operating Time - UPDT',
                    badge: 'Shop Floor',
                    type: 'positive',
                    hours: 4000,
                    children: [
                      {
                        id: 'ltsr',
                        label: 'Lost Time Slow Running (LTSR)',
                        desc: 'Speed loss below target rate',
                        formula: 'LTSR = Up Time - (Actual Output / Target Rate)',
                        badge: 'Shop Floor',
                        type: 'loss',
                        hours: 400,
                        children: []
                      },
                      {
                        id: 'ltmw',
                        label: 'Lost Time Making Waste (LTMW)',
                        desc: 'Quality losses',
                        formula: 'LTMW = Waste Output / Target Rate',
                        badge: 'Quality',
                        type: 'loss',
                        hours: 200,
                        children: []
                      },
                      {
                        id: 'potential-time',
                        label: 'Potential Time',
                        desc: 'Up Time minus LTSR minus LTMW',
                        formula: 'Potential Time = Up Time - LTSR - LTMW',
                        badge: 'Outcome',
                        type: 'outcome',
                        hours: 3400,
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  var expandedLevels = { 0: true };
  var tooltipEl = null;

  function init() {
    var container = document.querySelector('.cascade-container');
    if (!container) return;

    // Create tooltip element
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'th-tooltip';
    document.body.appendChild(tooltipEl);

    render(container);
    bindControls();
  }

  function render(container) {
    container.innerHTML = '';
    container.style.cssText = 'display: flex; flex-direction: column; gap: 0; min-width: 600px;';
    renderLevel(container, [hierarchy], 0);
  }

  function renderLevel(container, nodes, level) {
    var isVisible = expandedLevels[level];

    // Connector from parent
    if (level > 0) {
      var connector = document.createElement('div');
      connector.className = 'th-level__connector';
      if (nodes.length > 1) {
        connector.classList.add('th-level__connector--split');
      }
      var levelWrapper = document.createElement('div');
      levelWrapper.className = 'th-level' + (isVisible ? '' : ' th-level--hidden');
      levelWrapper.dataset.level = level;
      levelWrapper.appendChild(connector);

      var blocksRow = document.createElement('div');
      blocksRow.className = 'th-level__blocks';

      nodes.forEach(function (node) {
        blocksRow.appendChild(createBlock(node, level));
      });

      levelWrapper.appendChild(blocksRow);
      container.appendChild(levelWrapper);
    } else {
      // Root level
      var rootWrapper = document.createElement('div');
      rootWrapper.className = 'th-level';
      rootWrapper.dataset.level = '0';

      var blocksRow = document.createElement('div');
      blocksRow.className = 'th-level__blocks';
      nodes.forEach(function (node) {
        blocksRow.appendChild(createBlock(node, level));
      });
      rootWrapper.appendChild(blocksRow);
      container.appendChild(rootWrapper);
    }

    // Recursively render children of expandable nodes
    var childGroups = [];
    nodes.forEach(function (node) {
      if (node.children && node.children.length > 0) {
        childGroups.push({ parent: node, children: node.children, level: level + 1 });
      }
    });

    childGroups.forEach(function (group) {
      renderLevel(container, group.children, group.level);
    });
  }

  function createBlock(node, level) {
    var block = document.createElement('div');
    var typeClass = 'th-' + node.type + '-v2';
    var hasChildren = node.children && node.children.length > 0;

    block.className = 'th-block-v2 ' + typeClass + (hasChildren ? ' expandable' : '');
    block.dataset.component = node.id;
    block.dataset.level = level;

    if (hasChildren && expandedLevels[level + 1]) {
      block.classList.add('expanded');
    }

    // Calculate width proportion based on hours relative to parent total
    // We use flex for this, but we can set flex-grow proportionally
    var parentTotal = getParentTotal(node);
    if (parentTotal > 0 && node.hours) {
      var proportion = node.hours / parentTotal;
      block.style.flex = proportion.toFixed(3);
    }

    var html = '';

    // Badge
    html += '<span class="block-badge-v2">' + esc(node.badge) + '</span>';

    // Title with expand icon
    html += '<div class="block-title">';
    if (hasChildren) {
      var icon = expandedLevels[level + 1] ? '+' : '+';
      html += '<span class="expand-icon-v2">' + (expandedLevels[level + 1] ? '\u2212' : '+') + '</span>';
    }
    html += esc(node.label);
    html += '</div>';

    // Description
    html += '<div class="block-desc">' + esc(node.desc) + '</div>';

    // Hours indicator
    if (node.hours) {
      html += '<div class="block-desc" style="font-weight:600; margin-top:2px;">' + node.hours.toLocaleString() + ' hrs</div>';
    }

    // Formula (shown on hover)
    html += '<div class="block-formula">' + esc(node.formula) + '</div>';

    block.innerHTML = html;

    // Click to expand/collapse
    if (hasChildren) {
      block.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleLevel(level + 1);
        var container = document.querySelector('.cascade-container');
        render(container);
      });
    }

    // Hover tooltip
    block.addEventListener('mouseenter', function (e) {
      showTooltip(e, node);
    });
    block.addEventListener('mousemove', function (e) {
      moveTooltip(e);
    });
    block.addEventListener('mouseleave', function () {
      hideTooltip();
    });

    return block;
  }

  function getParentTotal(node) {
    // Find the parent by traversing the tree
    var parentNode = findParent(hierarchy, node.id);
    if (!parentNode) return node.hours || 1;
    return parentNode.hours || 1;
  }

  function findParent(tree, childId) {
    if (!tree.children) return null;
    for (var i = 0; i < tree.children.length; i++) {
      if (tree.children[i].id === childId) return tree;
      var found = findParent(tree.children[i], childId);
      if (found) return found;
    }
    return null;
  }

  function toggleLevel(level) {
    if (expandedLevels[level]) {
      // Collapse this and all below
      var keys = Object.keys(expandedLevels);
      keys.forEach(function (k) {
        if (parseInt(k) >= level) delete expandedLevels[k];
      });
    } else {
      expandedLevels[level] = true;
    }
  }

  function showTooltip(e, node) {
    if (!tooltipEl) return;
    var html = '<div class="th-tooltip__title">' + esc(node.label) + '</div>';
    html += '<div>' + esc(node.desc) + '</div>';
    if (node.hours) {
      html += '<div style="margin-top:4px;font-weight:600;">' + node.hours.toLocaleString() + ' hours/year</div>';
    }
    html += '<div class="th-tooltip__formula">' + esc(node.formula) + '</div>';
    tooltipEl.innerHTML = html;
    tooltipEl.classList.add('visible');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!tooltipEl) return;
    var x = e.clientX + 16;
    var y = e.clientY + 16;
    // Keep on screen
    var rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) {
      x = e.clientX - rect.width - 16;
    }
    if (y + rect.height > window.innerHeight - 10) {
      y = e.clientY - rect.height - 16;
    }
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top = y + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('visible');
  }

  function bindControls() {
    // Collapse all button
    var collapseBtn = document.querySelector('.collapse-all');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        expandedLevels = { 0: true };
        var container = document.querySelector('.cascade-container');
        render(container);
      });
    }

    // Expand all button (add one if not present)
    var expandBtn = document.querySelector('.expand-all');
    if (expandBtn) {
      expandBtn.addEventListener('click', function () {
        for (var i = 0; i <= 6; i++) expandedLevels[i] = true;
        var container = document.querySelector('.cascade-container');
        render(container);
      });
    }

    // Show-me buttons
    var showBtns = document.querySelectorAll('.show-me-btn');
    showBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var metric = this.dataset.metric;
        highlightMetric(metric);
      });
    });
  }

  function highlightMetric(metric) {
    // First expand all levels
    for (var i = 0; i <= 6; i++) expandedLevels[i] = true;
    var container = document.querySelector('.cascade-container');
    render(container);
    bindControls();

    // Define numerator/denominator for each metric
    var numComponents = [];
    var denComponents = [];

    if (metric === 'operating-efficiency') {
      numComponents = ['potential-time'];
      denComponents = ['operating-time'];
    } else if (metric === 'machine-efficiency') {
      numComponents = ['potential-time'];
      denComponents = ['shift-time'];
    } else if (metric === 'labour-efficiency') {
      numComponents = ['potential-time'];
      denComponents = ['shift-time'];
    } else if (metric === 'teep') {
      numComponents = ['potential-time'];
      denComponents = ['calendar-time'];
    }

    // Apply highlight classes with delay for animation
    setTimeout(function () {
      numComponents.forEach(function (comp) {
        var el = document.querySelector('[data-component="' + comp + '"]');
        if (el) el.classList.add('highlight-numerator');
      });
      denComponents.forEach(function (comp) {
        var el = document.querySelector('[data-component="' + comp + '"]');
        if (el) el.classList.add('highlight-denominator');
      });
    }, 100);

    // Remove after 4 seconds
    setTimeout(function () {
      document.querySelectorAll('.highlight-numerator, .highlight-denominator').forEach(function (el) {
        el.classList.remove('highlight-numerator', 'highlight-denominator');
      });
    }, 4100);
  }

  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
