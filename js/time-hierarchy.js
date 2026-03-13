/**
 * maji Time Hierarchy — CSS Grid Cascade (matches original majiai.co)
 */
function expandBlock(block) {
  var targetRow = block.getAttribute('data-expands');
  if (!targetRow) return;

  var icon = block.querySelector('.expand-icon');
  if (icon.textContent === '+') {
    icon.textContent = '−';
    var blocksToShow = document.querySelectorAll('[data-row="' + targetRow + '"]');
    blocksToShow.forEach(function(b) { b.classList.remove('row-hidden'); });
  } else {
    icon.textContent = '+';
    var rowNum = parseInt(targetRow);
    for (var i = rowNum; i <= 7; i++) {
      var blocksToHide = document.querySelectorAll('[data-row="' + i + '"]');
      blocksToHide.forEach(function(b) {
        b.classList.add('row-hidden');
        var childIcon = b.querySelector('.expand-icon');
        if (childIcon) childIcon.textContent = '+';
      });
    }
  }
}

function collapseAll() {
  for (var i = 2; i <= 7; i++) {
    var blocks = document.querySelectorAll('[data-row="' + i + '"]');
    blocks.forEach(function(b) { b.classList.add('row-hidden'); });
  }
  document.querySelectorAll('.expand-icon').forEach(function(icon) { icon.textContent = '+'; });
  // Clear highlights
  document.querySelectorAll('.block').forEach(function(block) {
    block.classList.remove('highlight-numerator', 'highlight-denominator');
  });
}

function expandAll() {
  for (var i = 2; i <= 7; i++) {
    var blocks = document.querySelectorAll('[data-row="' + i + '"]');
    blocks.forEach(function(b) { b.classList.remove('row-hidden'); });
  }
  document.querySelectorAll('.expand-icon').forEach(function(icon) { icon.textContent = '−'; });
}

function highlightMetric(numerators, denominators) {
  // Clear previous highlights
  document.querySelectorAll('.block').forEach(function(block) {
    block.classList.remove('highlight-numerator', 'highlight-denominator');
  });

  // Expand all first so blocks are visible
  expandAll();

  // Highlight numerators (green)
  numerators.forEach(function(comp) {
    var blocks = document.querySelectorAll('[data-component="' + comp + '"]');
    blocks.forEach(function(block) {
      if (!block.classList.contains('row-hidden')) {
        block.classList.add('highlight-numerator');
        setTimeout(function() { block.classList.remove('highlight-numerator'); }, 3000);
      }
    });
  });

  // Highlight denominators (blue)
  denominators.forEach(function(comp) {
    var blocks = document.querySelectorAll('[data-component="' + comp + '"]');
    blocks.forEach(function(block) {
      if (!block.classList.contains('row-hidden')) {
        block.classList.add('highlight-denominator');
        setTimeout(function() { block.classList.remove('highlight-denominator'); }, 3000);
      }
    });
  });

  // Scroll to cascade
  var container = document.querySelector('.cascade-container');
  if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
