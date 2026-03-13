/**
 * maji Time Hierarchy — Interactive cascade visualisation
 * Expand/collapse rows, highlight efficiency metric numerator/denominator.
 */
(function () {
  'use strict';

  function init() {
    var container = document.querySelector('.cascade-container');
    if (!container) return;

    // Expand / collapse
    var expandables = container.querySelectorAll('.block.expandable');
    expandables.forEach(function (block) {
      block.addEventListener('click', function () {
        var target = this.dataset.expands;
        if (!target) return;
        toggleRow(target, this);
      });
    });

    // Collapse all button
    var collapseBtn = document.querySelector('.collapse-all');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        collapseAll();
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

    // Start with rows 2+ hidden
    for (var r = 2; r <= 7; r++) {
      var rows = container.querySelectorAll('[data-row="' + r + '"]');
      rows.forEach(function (el) { el.style.display = 'none'; });
    }
  }

  function toggleRow(rowId, trigger) {
    var container = document.querySelector('.cascade-container');
    var targets = container.querySelectorAll('[data-row="' + rowId + '"]');
    var icon = trigger.querySelector('.expand-icon');

    var isHidden = targets.length > 0 && targets[0].style.display === 'none';

    targets.forEach(function (el) {
      el.style.display = isHidden ? '' : 'none';
    });

    if (icon) {
      icon.textContent = isHidden ? '\u2212' : '+';
    }
  }

  function collapseAll() {
    var container = document.querySelector('.cascade-container');
    if (!container) return;
    for (var r = 2; r <= 7; r++) {
      var rows = container.querySelectorAll('[data-row="' + r + '"]');
      rows.forEach(function (el) { el.style.display = 'none'; });
    }
    var icons = container.querySelectorAll('.expand-icon');
    icons.forEach(function (ic) { ic.textContent = '+'; });
  }

  function highlightMetric(metric) {
    // Clear previous highlights
    document.querySelectorAll('.highlight-numerator, .highlight-denominator').forEach(function (el) {
      el.classList.remove('highlight-numerator', 'highlight-denominator');
    });

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

    // Make sure relevant rows are visible
    for (var r = 2; r <= 7; r++) {
      var rows = document.querySelectorAll('.cascade-container [data-row="' + r + '"]');
      rows.forEach(function (el) { el.style.display = ''; });
    }
    var icons = document.querySelectorAll('.expand-icon');
    icons.forEach(function (ic) { ic.textContent = '\u2212'; });

    // Apply highlight classes
    numComponents.forEach(function (comp) {
      var el = document.querySelector('[data-component="' + comp + '"]');
      if (el) el.classList.add('highlight-numerator');
    });
    denComponents.forEach(function (comp) {
      var el = document.querySelector('[data-component="' + comp + '"]');
      if (el) el.classList.add('highlight-denominator');
    });

    // Remove after 3 seconds
    setTimeout(function () {
      document.querySelectorAll('.highlight-numerator, .highlight-denominator').forEach(function (el) {
        el.classList.remove('highlight-numerator', 'highlight-denominator');
      });
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
