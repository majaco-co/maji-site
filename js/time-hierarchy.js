/**
 * maji Time Hierarchy — Nested Overlapping Box Visualisation
 *
 * Layout: Russian-nesting-doll style. Each level is a flex row where
 * loss block(s) sit on the left and the productive-time block sits
 * on the right.  The productive block *contains* the next nested level.
 * Widths are proportional to hours relative to the parent.
 *
 * Interactivity: start collapsed (only Calendar Time visible),
 * click + to expand one level at a time, Show Me buttons highlight
 * metric paths, hover tooltips.
 */
(function () {
  'use strict';

  /* ================================================================
     DATA MODEL
     ================================================================ */
  var DATA = {
    id: 'calendar-time',
    label: 'Calendar Time',
    desc: '24 h x 365 d = total available hours in a year',
    formula: 'Fixed: 8,760 hours',
    hours: 8760,
    dept: 'FIXED',
    type: 'root',          // root | productive | loss | amber-loss | outcome
    children: [
      {
        id: 'non-working-time',
        label: 'Non-working Time',
        desc: 'Weekends, bank holidays, planned shutdowns',
        formula: 'Typically 2,000 – 4,000 hrs',
        hours: 3000,
        dept: 'COMMERCIAL',
        type: 'loss',
        children: []
      },
      {
        id: 'shift-time',
        label: 'Shift Time (Available Time)',
        desc: 'Calendar Time minus Non-working Time',
        formula: 'Shift Time = Calendar Time − Non-working Time',
        hours: 5760,
        dept: 'COMMERCIAL',
        type: 'productive',
        children: [
          {
            id: 'schedule-loss',
            label: 'Schedule Loss',
            desc: 'Shifts not scheduled or not run',
            formula: 'e.g. unused shifts, no demand',
            hours: 760,
            dept: 'OPS MANAGEMENT',
            type: 'loss',
            children: []
          },
          {
            id: 'planned-production-time',
            label: 'Planned Production Time',
            desc: 'Shift Time minus Schedule Loss',
            formula: 'PPT = Shift Time − Schedule Loss',
            hours: 5000,
            dept: 'OPS MANAGEMENT',
            type: 'productive',
            children: [
              {
                id: 'planned-downtime',
                label: 'Planned Downtime',
                desc: 'Maintenance, changeovers, breaks',
                formula: 'Planned DT = CILs + Changeovers + Breaks',
                hours: 500,
                dept: 'ENGINEERING',
                type: 'loss',
                children: []
              },
              {
                id: 'operating-time',
                label: 'Operating Time',
                desc: 'PPT minus Planned Downtime',
                formula: 'Operating Time = PPT − Planned DT',
                hours: 4500,
                dept: 'ENGINEERING',
                type: 'productive',
                children: [
                  {
                    id: 'unplanned-downtime',
                    label: 'Unplanned Downtime (UPDT)',
                    desc: 'Breakdowns, stoppages, waiting',
                    formula: 'UPDT = Breakdowns + Minor Stops + Waiting',
                    hours: 500,
                    dept: 'SHOP FLOOR',
                    type: 'loss',
                    children: []
                  },
                  {
                    id: 'up-time',
                    label: 'Up Time',
                    desc: 'Operating Time minus UPDT',
                    formula: 'Up Time = Operating Time − UPDT',
                    hours: 4000,
                    dept: 'SHOP FLOOR',
                    type: 'productive',
                    children: [
                      {
                        id: 'ltsr',
                        label: 'Lost Time Slow Running (LTSR)',
                        desc: 'Speed loss below target rate',
                        formula: 'LTSR = Up Time − (Actual Output / Target Rate)',
                        hours: 400,
                        dept: 'SHOP FLOOR',
                        type: 'amber-loss',
                        children: []
                      },
                      {
                        id: 'ltmw',
                        label: 'Lost Time Making Waste (LTMW)',
                        desc: 'Quality losses',
                        formula: 'LTMW = Waste Output / Target Rate',
                        hours: 200,
                        dept: 'QUALITY',
                        type: 'amber-loss',
                        children: []
                      },
                      {
                        id: 'potential-time',
                        label: 'Potential Time',
                        desc: 'Up Time minus LTSR minus LTMW',
                        formula: 'Potential Time = Up Time − LTSR − LTMW',
                        hours: 3400,
                        dept: 'OUTCOME',
                        type: 'outcome',
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

  /* ================================================================
     STATE
     ================================================================ */
  var expandedNodes = {};          // keyed by node id
  var activeMetric  = null;        // null | 'oee' | 'teep' | 'machine-efficiency'
  var tooltipEl     = null;

  /* Which node ids are highlighted for each metric */
  var METRIC_MAP = {
    'oee': {
      label: 'OEE (Operating Efficiency)',
      formula: 'Potential Time / Operating Time = 3,400 / 4,500 = 75.6 %',
      numerator:   ['potential-time'],
      denominator: ['operating-time'],
      path: ['calendar-time', 'shift-time', 'planned-production-time',
             'operating-time', 'potential-time']
    },
    'teep': {
      label: 'TEEP',
      formula: 'Potential Time / Calendar Time = 3,400 / 8,760 = 38.8 %',
      numerator:   ['potential-time'],
      denominator: ['calendar-time'],
      path: ['calendar-time', 'shift-time', 'planned-production-time',
             'operating-time', 'up-time', 'potential-time']
    },
    'machine-efficiency': {
      label: 'Machine Efficiency (OOE)',
      formula: 'Potential Time / Shift Time = 3,400 / 5,760 = 59.0 %',
      numerator:   ['potential-time'],
      denominator: ['shift-time'],
      path: ['calendar-time', 'shift-time', 'planned-production-time',
             'operating-time', 'up-time', 'potential-time']
    }
  };

  /* ================================================================
     INITIALISE
     ================================================================ */
  function init() {
    var root = document.getElementById('nth-root');
    if (!root) return;

    // Create tooltip
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'nth-tooltip';
    document.body.appendChild(tooltipEl);

    render();
    bindControls();
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    var root = document.getElementById('nth-root');
    if (!root) return;
    root.innerHTML = '';
    root.appendChild(buildNode(DATA, null));
  }

  /**
   * Recursively build the DOM for a node.
   * A node renders as:
   *   .nth-box  (the coloured block)
   *     .nth-box__header   (title, hours, dept badge, expand icon)
   *     .nth-box__children (flex row of children — only if expanded)
   *       child-loss-box  child-loss-box ...  child-productive-box
   *                                            └── recursive
   */
  function buildNode(node, parentNode, depth) {
    depth = depth || 0;
    var el = document.createElement('div');
    el.className = 'nth-box nth-box--' + node.type;
    el.dataset.id = node.id;
    el.dataset.depth = depth;

    // Layout strategy: loss blocks get fixed width at depth >= 2,
    // productive/outcome blocks use flex:1 to fill remaining space
    if (parentNode) {
      var isLoss = (node.type === 'loss' || node.type === 'amber-loss');
      if (depth >= 2 && isLoss) {
        // Fixed narrow width for loss blocks at deeper levels
        el.style.flex = '0 0 auto';
        el.style.width = depth >= 4 ? '100px' : depth >= 3 ? '140px' : '180px';
      } else if (depth >= 2 && !isLoss) {
        // Productive blocks fill remaining space
        el.style.flex = '1 1 auto';
        el.style.minWidth = '0';
      } else {
        // Top levels use proportional widths
        var pct = (node.hours / parentNode.hours) * 100;
        el.style.width = pct.toFixed(2) + '%';
      }
    }

    // Metric dimming / highlighting
    if (activeMetric) {
      var m = METRIC_MAP[activeMetric];
      if (m.numerator.indexOf(node.id) !== -1) {
        el.classList.add('nth-highlight-num');
      } else if (m.denominator.indexOf(node.id) !== -1) {
        el.classList.add('nth-highlight-den');
      } else if (m.path.indexOf(node.id) === -1) {
        el.classList.add('nth-dimmed');
      }
    }

    var hasChildren = node.children && node.children.length > 0;
    var isExpanded  = !!expandedNodes[node.id];

    // Header
    var header = document.createElement('div');
    header.className = 'nth-box__header';

    // Expand icon
    if (hasChildren) {
      var icon = document.createElement('span');
      icon.className = 'nth-box__expand';
      icon.textContent = isExpanded ? '\u2212' : '+';
      header.appendChild(icon);
      el.classList.add('nth-box--expandable');
      if (isExpanded) el.classList.add('nth-box--expanded');
    }

    // Title
    var title = document.createElement('span');
    title.className = 'nth-box__title';
    title.textContent = node.label;
    header.appendChild(title);

    // Hours
    var hrs = document.createElement('span');
    hrs.className = 'nth-box__hours';
    hrs.textContent = node.hours.toLocaleString() + ' hrs';
    header.appendChild(hrs);

    // Dept badge
    var badge = document.createElement('span');
    badge.className = 'nth-box__badge';
    badge.textContent = node.dept;
    header.appendChild(badge);

    el.appendChild(header);

    // Description (shown below header on larger blocks)
    var desc = document.createElement('div');
    desc.className = 'nth-box__desc';
    desc.textContent = node.desc;
    el.appendChild(desc);

    // Click to expand
    if (hasChildren) {
      header.addEventListener('click', function (e) {
        e.stopPropagation();
        if (expandedNodes[node.id]) {
          collapseNodeAndDescendants(node);
        } else {
          expandedNodes[node.id] = true;
        }
        render();
        bindControls();
      });
    }

    // Tooltip
    el.addEventListener('mouseenter', function (e) { showTooltip(e, node); });
    el.addEventListener('mousemove',  function (e) { moveTooltip(e); });
    el.addEventListener('mouseleave', function ()  { hideTooltip(); });

    // Children container
    if (hasChildren && isExpanded) {
      var childRow = document.createElement('div');
      childRow.className = 'nth-box__children';

      // Connector line from header to children
      var connector = document.createElement('div');
      connector.className = 'nth-box__connector';
      el.appendChild(connector);

      for (var i = 0; i < node.children.length; i++) {
        childRow.appendChild(buildNode(node.children[i], node, depth + 1));
      }
      el.appendChild(childRow);
    }

    return el;
  }

  function collapseNodeAndDescendants(node) {
    delete expandedNodes[node.id];
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        collapseNodeAndDescendants(node.children[i]);
      }
    }
  }

  /* ================================================================
     CONTROLS
     ================================================================ */
  function bindControls() {
    var collapseBtn = document.querySelector('.nth-collapse-all');
    var expandBtn   = document.querySelector('.nth-expand-all');
    var showBtns    = document.querySelectorAll('.nth-show-me');

    if (collapseBtn) {
      // re-clone to remove old listeners
      var newC = collapseBtn.cloneNode(true);
      collapseBtn.parentNode.replaceChild(newC, collapseBtn);
      newC.addEventListener('click', function () {
        expandedNodes = {};
        activeMetric  = null;
        clearShowMeActive();
        render();
        bindControls();
      });
    }

    if (expandBtn) {
      var newE = expandBtn.cloneNode(true);
      expandBtn.parentNode.replaceChild(newE, expandBtn);
      newE.addEventListener('click', function () {
        expandAll(DATA);
        render();
        bindControls();
      });
    }

    showBtns.forEach(function (btn) {
      var newB = btn.cloneNode(true);
      btn.parentNode.replaceChild(newB, btn);
      newB.addEventListener('click', function () {
        var metric = this.dataset.metric;
        if (activeMetric === metric) {
          activeMetric = null;
          clearShowMeActive();
        } else {
          activeMetric = metric;
          expandAll(DATA);
          setShowMeActive(this);
        }
        render();
        bindControls();
        // Show formula banner
        showMetricBanner();
      });
    });
  }

  function expandAll(node) {
    if (node.children && node.children.length > 0) {
      expandedNodes[node.id] = true;
      for (var i = 0; i < node.children.length; i++) {
        expandAll(node.children[i]);
      }
    }
  }

  function clearShowMeActive() {
    document.querySelectorAll('.nth-show-me').forEach(function (b) {
      b.classList.remove('nth-show-me--active');
    });
    var banner = document.querySelector('.nth-metric-banner');
    if (banner) banner.remove();
  }

  function setShowMeActive(btn) {
    document.querySelectorAll('.nth-show-me').forEach(function (b) {
      b.classList.remove('nth-show-me--active');
    });
    btn.classList.add('nth-show-me--active');
  }

  function showMetricBanner() {
    var old = document.querySelector('.nth-metric-banner');
    if (old) old.remove();
    if (!activeMetric) return;

    var m = METRIC_MAP[activeMetric];
    var banner = document.createElement('div');
    banner.className = 'nth-metric-banner';
    banner.innerHTML =
      '<strong>' + esc(m.label) + '</strong> &mdash; ' +
      '<span class="nth-metric-banner__formula">' + esc(m.formula) + '</span>' +
      '<button class="nth-metric-banner__close">&times;</button>';

    var viewport = document.querySelector('.nth-viewport');
    if (viewport) viewport.parentNode.insertBefore(banner, viewport);

    banner.querySelector('.nth-metric-banner__close').addEventListener('click', function () {
      activeMetric = null;
      clearShowMeActive();
      render();
      bindControls();
    });
  }

  /* ================================================================
     TOOLTIP
     ================================================================ */
  function showTooltip(e, node) {
    if (!tooltipEl) return;
    tooltipEl.innerHTML =
      '<div class="nth-tooltip__title">' + esc(node.label) + '</div>' +
      '<div class="nth-tooltip__dept">' + esc(node.dept) + '</div>' +
      '<div>' + esc(node.desc) + '</div>' +
      '<div class="nth-tooltip__hours">' + node.hours.toLocaleString() + ' hours/year</div>' +
      '<div class="nth-tooltip__formula">' + esc(node.formula) + '</div>';
    tooltipEl.classList.add('nth-tooltip--visible');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!tooltipEl) return;
    var x = e.clientX + 14;
    var y = e.clientY + 14;
    var r = tooltipEl.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 12)  x = e.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 12) y = e.clientY - r.height - 14;
    tooltipEl.style.left = x + 'px';
    tooltipEl.style.top  = y + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('nth-tooltip--visible');
  }

  /* ================================================================
     UTIL
     ================================================================ */
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================================================================
     BOOT
     ================================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
