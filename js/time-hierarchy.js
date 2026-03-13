/**
 * maji Time Hierarchy — Vertical Cascade Visualisation
 *
 * Layout matches the original majiai.co design:
 * - Each productive level is a full-width bar that gets progressively
 *   indented to the right as you go down
 * - Loss blocks sit as cards in columns to the LEFT
 * - Only Calendar Time shows "8,760 hours/year"
 * - Loss cards show "SUBTRACTED" or "LOSS" badges
 */
(function () {
  'use strict';

  /* ================================================================
     DATA MODEL — matches original majiai.co exactly
     ================================================================ */
  var LEVELS = [
    {
      id: 'calendar-time',
      label: 'Calendar Time (24/7/365)',
      subtitle: '8,760 hours/year — all time',
      type: 'bar',        // dark green full-width bar
      color: 'root',
      dept: null,
      loss: null           // no loss peels off from the root
    },
    {
      id: 'shift-time',
      label: 'Available Time = Shift Time',
      subtitle: 'Factory open, shifts scheduled',
      type: 'bar',
      color: 'productive',
      dept: null,
      loss: {
        id: 'non-working-time',
        label: 'Non-working Time',
        badge: 'SUBTRACTED',
        desc: 'Subtracted from Calendar Time. Includes weekends, bank holidays, and planned shutdowns.',
        details: []
      }
    },
    {
      id: 'planned-production-time',
      label: 'Planned Production Time',
      subtitle: 'Time explicitly scheduled for production, labour present',
      type: 'bar',
      color: 'productive',
      dept: null,
      loss: {
        id: 'schedule-loss',
        label: 'Schedule Loss',
        badge: 'SUBTRACTED',
        desc: 'Subtracted from Shift Time to define PPT, but remains a loss when measuring Machine Efficiency/OOE (equipment not producing).',
        details: []
      }
    },
    {
      id: 'operating-time',
      label: 'Operating Time',
      subtitle: 'Operational window — planned time to produce good units vs actual time line was attempting to run',
      type: 'bar',
      color: 'productive-bright',
      dept: null,
      badges: ['PLAN LAYER', 'ACTUALS LAYER'],
      note: '<strong>Planned vs Actuals:</strong> Operating Time represents the same operational window from two perspectives: (1) <strong>Operating Time (Planned)</strong> = time scheduled to produce good units before shift execution, and (2) <strong>Operating Time (Actual)</strong> = actual time line was attempting to run after shift execution. These are usually different. Operating Time (Planned) is used for planning metrics, whereas Operating Time (Actual) is for efficiency measures. Calculate Actual / Planned ratio to determine planning accuracy and schedule adherence.',
      loss: {
        id: 'planned-downtime',
        label: 'Planned Downtime',
        badge: 'SUBTRACTED',
        desc: 'Subtracted from PPT to define Operating Time, but remains a loss when measuring OEE (equipment not producing).',
        details: ['Changeovers', 'Planned maintenance', 'Start-of-shift checks']
      }
    },
    {
      id: 'up-time',
      label: 'Up Time',
      subtitle: 'Time when bottleneck equipment physically operates and produces output',
      type: 'bar',
      color: 'productive',
      dept: null,
      loss: {
        id: 'unplanned-downtime',
        label: 'Unplanned Downtime (UPDT)',
        badge: 'LOSS',
        desc: 'Stops exceeding classification threshold, PDT overruns, Schedule Loss overruns.',
        details: []
      }
    }
  ];

  // Bottom row: losses + outcome
  var BOTTOM_ROW = [
    {
      id: 'ltsr',
      label: 'Lost Time Slow Running (LTSR)',
      badge: 'LOSS',
      desc: 'Production below bottleneck speed — includes micro-stops and speed losses',
      type: 'amber-loss'
    },
    {
      id: 'ltmw',
      label: 'Lost Time Making Waste (LTMW)',
      badge: 'LOSS',
      desc: 'Time spent producing defective output',
      type: 'amber-loss'
    },
    {
      id: 'potential-time',
      label: 'Potential Time',
      badge: null,
      desc: 'Good output at bottleneck speed — theoretical minimum time required',
      type: 'outcome'
    }
  ];

  /* ================================================================
     STATE
     ================================================================ */
  var expandedLevels = 1; // Start showing just Calendar Time, expand on click
  var activeMetric = null;

  var METRIC_MAP = {
    'oee': {
      label: 'OEE (Operating Efficiency)',
      formula: 'Potential Time ÷ Operating Time',
      highlight: ['operating-time', 'up-time', 'ltsr', 'ltmw', 'potential-time']
    },
    'teep': {
      label: 'TEEP',
      formula: 'Potential Time ÷ Calendar Time',
      highlight: ['calendar-time', 'shift-time', 'planned-production-time',
                   'operating-time', 'up-time', 'ltsr', 'ltmw', 'potential-time']
    },
    'machine-efficiency': {
      label: 'Machine Efficiency (OOE)',
      formula: 'Potential Time ÷ Shift Time',
      highlight: ['shift-time', 'planned-production-time', 'operating-time',
                   'up-time', 'ltsr', 'ltmw', 'potential-time']
    }
  };

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    var root = document.getElementById('nth-root');
    if (!root) return;
    root.innerHTML = '';

    // Build the cascade
    var cascade = document.createElement('div');
    cascade.className = 'th-cascade';

    // Track accumulated loss columns for indentation
    var lossColumns = [];

    for (var i = 0; i < LEVELS.length && i < expandedLevels; i++) {
      var level = LEVELS[i];
      var row = document.createElement('div');
      row.className = 'th-row';
      row.style.animationDelay = (i * 0.08) + 's';

      // Add dimming if metric is active
      var isHighlighted = !activeMetric || METRIC_MAP[activeMetric].highlight.indexOf(level.id) !== -1;

      // Loss columns on the left (from previous levels)
      if (lossColumns.length > 0) {
        for (var j = 0; j < lossColumns.length; j++) {
          var spacer = document.createElement('div');
          spacer.className = 'th-loss-spacer';
          // On the row where this loss first appears, show the card
          // Otherwise show empty spacer
          row.appendChild(spacer);
        }
      }

      // The productive bar
      var bar = document.createElement('div');
      bar.className = 'th-bar th-bar--' + level.color;
      bar.dataset.id = level.id;
      if (!isHighlighted) bar.classList.add('th-dimmed');

      // Expand/collapse icon
      if (i < LEVELS.length - 1 || true) {
        var expandIcon = document.createElement('button');
        expandIcon.className = 'th-bar__expand';
        expandIcon.textContent = (i < expandedLevels - 1 || i === LEVELS.length - 1) ? '−' : '+';
        expandIcon.addEventListener('click', (function(levelIndex) {
          return function(e) {
            e.stopPropagation();
            if (expandedLevels > levelIndex + 1) {
              expandedLevels = levelIndex + 1;
            } else {
              expandedLevels = levelIndex + 2;
              // Also show bottom row if expanding last level
              if (expandedLevels > LEVELS.length) expandedLevels = LEVELS.length + 1;
            }
            render();
          };
        })(i));
        bar.appendChild(expandIcon);
      }

      var barContent = document.createElement('div');
      barContent.className = 'th-bar__content';

      var barTitle = document.createElement('div');
      barTitle.className = 'th-bar__title';
      barTitle.textContent = level.label;
      barContent.appendChild(barTitle);

      // Special badges for Operating Time
      if (level.badges) {
        var badgeRow = document.createElement('div');
        badgeRow.className = 'th-bar__badges';
        level.badges.forEach(function(b) {
          var badge = document.createElement('span');
          badge.className = 'th-badge th-badge--layer';
          badge.textContent = b;
          badgeRow.appendChild(badge);
        });
        barContent.appendChild(badgeRow);
      }

      var barSub = document.createElement('div');
      barSub.className = 'th-bar__subtitle';
      barSub.textContent = level.subtitle;
      barContent.appendChild(barSub);

      // Special note for Operating Time
      if (level.note) {
        var noteEl = document.createElement('div');
        noteEl.className = 'th-bar__note';
        noteEl.innerHTML = level.note;
        barContent.appendChild(noteEl);
      }

      bar.appendChild(barContent);
      row.appendChild(bar);
      cascade.appendChild(row);

      // If this level has a loss AND the next level is visible, show the loss card
      if (level.loss && i + 1 < expandedLevels) {
        lossColumns.push(level.loss);
      }
    }

    // Now render loss cards positioned in their columns
    // We'll use a separate layer for loss cards
    var lossLayer = document.createElement('div');
    lossLayer.className = 'th-loss-layer';

    for (var k = 0; k < lossColumns.length; k++) {
      var loss = lossColumns[k];
      var lossCard = createLossCard(loss, k);
      var isLossHighlighted = !activeMetric || METRIC_MAP[activeMetric].highlight.indexOf(loss.id) !== -1;
      if (!isLossHighlighted) lossCard.classList.add('th-dimmed');
      lossLayer.appendChild(lossCard);
    }

    // Bottom row (LTSR, LTMW, Potential Time)
    if (expandedLevels > LEVELS.length) {
      var bottomRow = document.createElement('div');
      bottomRow.className = 'th-bottom-row';
      bottomRow.style.marginLeft = (lossColumns.length * 160) + 'px';

      BOTTOM_ROW.forEach(function(item) {
        var card = document.createElement('div');
        card.className = 'th-bottom-card th-bottom-card--' + item.type;
        card.dataset.id = item.id;

        var isItemHighlighted = !activeMetric || METRIC_MAP[activeMetric].highlight.indexOf(item.id) !== -1;
        if (!isItemHighlighted) card.classList.add('th-dimmed');

        var cardTitle = document.createElement('div');
        cardTitle.className = 'th-bottom-card__title';
        cardTitle.textContent = item.label;
        card.appendChild(cardTitle);

        if (item.badge) {
          var cardBadge = document.createElement('span');
          cardBadge.className = 'th-badge th-badge--' + (item.type === 'amber-loss' ? 'loss' : 'outcome');
          cardBadge.textContent = item.badge;
          card.appendChild(cardBadge);
        }

        var cardDesc = document.createElement('div');
        cardDesc.className = 'th-bottom-card__desc';
        cardDesc.textContent = item.desc;
        card.appendChild(cardDesc);

        bottomRow.appendChild(card);
      });

      cascade.appendChild(bottomRow);
    }

    // Assemble
    root.appendChild(cascade);
    root.appendChild(lossLayer);

    // Position loss cards absolutely relative to the cascade
    positionLossCards();
  }

  function createLossCard(loss, columnIndex) {
    var card = document.createElement('div');
    card.className = 'th-loss-card';
    card.dataset.id = loss.id;
    card.dataset.column = columnIndex;

    var title = document.createElement('div');
    title.className = 'th-loss-card__title';
    title.textContent = loss.label;
    card.appendChild(title);

    var badge = document.createElement('span');
    badge.className = 'th-badge th-badge--subtracted';
    badge.textContent = loss.badge;
    card.appendChild(badge);

    var desc = document.createElement('div');
    desc.className = 'th-loss-card__desc';
    desc.textContent = loss.desc;
    card.appendChild(desc);

    if (loss.details && loss.details.length > 0) {
      var list = document.createElement('ul');
      list.className = 'th-loss-card__list';
      loss.details.forEach(function(d) {
        var li = document.createElement('li');
        li.textContent = d;
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    return card;
  }

  function positionLossCards() {
    // Position loss cards in their columns using CSS grid positioning
    var cards = document.querySelectorAll('.th-loss-card');
    var bars = document.querySelectorAll('.th-bar');

    cards.forEach(function(card, index) {
      var col = parseInt(card.dataset.column);
      card.style.left = (col * 160) + 'px';
      card.style.width = '150px';
      // Position vertically: starts at the row AFTER the bar that introduced it
      // The bar at index col+1 is where this loss starts
      if (bars[col + 2]) {
        card.style.top = bars[col + 2].parentElement.offsetTop + 'px';
      } else if (bars[col + 1]) {
        card.style.top = (bars[col + 1].parentElement.offsetTop + bars[col + 1].parentElement.offsetHeight + 8) + 'px';
      }
    });
  }

  /* ================================================================
     CONTROLS
     ================================================================ */
  function bindControls() {
    var collapseBtn = document.querySelector('.nth-collapse-all');
    var expandBtn = document.querySelector('.nth-expand-all');
    var showBtns = document.querySelectorAll('.nth-show-me');

    if (collapseBtn) {
      collapseBtn.onclick = function() {
        expandedLevels = 1;
        activeMetric = null;
        clearShowMeActive();
        render();
      };
    }

    if (expandBtn) {
      expandBtn.onclick = function() {
        expandedLevels = LEVELS.length + 1;
        render();
      };
    }

    showBtns.forEach(function(btn) {
      btn.onclick = function() {
        var metric = this.dataset.metric;
        if (activeMetric === metric) {
          activeMetric = null;
          clearShowMeActive();
        } else {
          activeMetric = metric;
          expandedLevels = LEVELS.length + 1;
          setShowMeActive(this);
        }
        render();
        showMetricBanner();
      };
    });
  }

  function clearShowMeActive() {
    document.querySelectorAll('.nth-show-me').forEach(function(b) {
      b.classList.remove('nth-show-me--active');
    });
    var banner = document.querySelector('.nth-metric-banner');
    if (banner) banner.remove();
  }

  function setShowMeActive(btn) {
    document.querySelectorAll('.nth-show-me').forEach(function(b) {
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
      '<strong>' + m.label + '</strong> = ' + m.formula +
      '<button class="nth-metric-banner__close">&times;</button>';

    var viewport = document.querySelector('.nth-viewport');
    if (viewport) viewport.parentNode.insertBefore(banner, viewport);

    banner.querySelector('.nth-metric-banner__close').onclick = function() {
      activeMetric = null;
      clearShowMeActive();
      render();
    };
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    var root = document.getElementById('nth-root');
    if (!root) return;
    render();
    bindControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
