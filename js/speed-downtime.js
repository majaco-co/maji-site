/**
 * maji Speed-Downtime Trade-off Calculator
 * Finds the optimal line speed where PPLH peaks.
 */
(function () {
  'use strict';

  var canvas, ctx;

  function val(id) {
    var el = document.getElementById(id);
    return el ? parseFloat(el.value) : 0;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function updateSliderDisplay(slider) {
    var display = slider.parentElement.querySelector('.slider-value');
    if (!display) return;
    var id = slider.id;
    var v = parseFloat(slider.value);
    if (id === 'speed') display.textContent = v + ' packs/hr';
    else if (id === 'availability') display.textContent = v + '%';
    else if (id === 'quality') display.textContent = v + '%';
    else if (id === 'operators') display.textContent = v + ' people';
    else if (id === 'shift') display.textContent = v + ' hours';
    else if (id === 'speed-increase') display.textContent = '+' + v + '%';
    else if (id === 'avail-sensitivity') display.textContent = v + '% per 10%';
    else if (id === 'quality-sensitivity') display.textContent = v + '% per 10%';
  }

  function updateCalculations() {
    var speed = val('speed');
    var avail = val('availability');
    var quality = val('quality');
    var operators = val('operators');
    var shift = val('shift');
    var speedIncrease = val('speed-increase');
    var availSens = val('avail-sensitivity');
    var qualSens = val('quality-sensitivity');

    if (operators === 0 || shift === 0) return;

    // Baseline PPLH
    var baselinePPLH = speed * (avail / 100) * (quality / 100) / operators;

    // Scenario calculation
    function calcPPLH(pctIncrease) {
      var newSpeed = speed * (1 + pctIncrease / 100);
      var newAvail = Math.max(0, avail - (pctIncrease / 10) * availSens);
      var newQual = Math.max(0, quality - (pctIncrease / 10) * qualSens);
      return newSpeed * (newAvail / 100) * (newQual / 100) / operators;
    }

    var scenarioPPLH = calcPPLH(speedIncrease);
    var changePct = baselinePPLH > 0 ? ((scenarioPPLH - baselinePPLH) / baselinePPLH * 100) : 0;

    // Find optimal
    var optPPLH = baselinePPLH;
    var optIncrease = 0;
    for (var i = 0; i <= 100; i++) {
      var pct = i * 0.5;
      var p = calcPPLH(pct);
      if (p > optPPLH) {
        optPPLH = p;
        optIncrease = pct;
      }
    }
    var optSpeed = speed * (1 + optIncrease / 100);

    // Update displays
    setText('baseline-pplh', baselinePPLH.toFixed(1) + ' packs/labour-hr');
    setText('new-pplh', scenarioPPLH.toFixed(1) + ' packs/labour-hr');

    var changeEl = document.getElementById('new-change');
    if (changeEl) {
      var sign = changePct >= 0 ? '+' : '';
      changeEl.textContent = sign + changePct.toFixed(1) + '%';
      changeEl.style.color = changePct >= 0 ? '#22C55E' : '#EF4444';
    }

    setText('optimal-speed', Math.round(optSpeed) + ' packs/hr');
    setText('optimal-increase', '+' + optIncrease.toFixed(1) + '%');
    setText('optimal-pplh', optPPLH.toFixed(1) + ' packs/labour-hr');

    drawChart(speed, avail, quality, operators, availSens, qualSens, speedIncrease, baselinePPLH, scenarioPPLH, optIncrease, optPPLH);
  }

  function drawChart(speed, avail, quality, operators, availSens, qualSens, userIncrease, baselinePPLH, scenarioPPLH, optIncrease, optPPLH) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 300 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '300px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = 300;
    var pad = { top: 20, right: 30, bottom: 50, left: 70 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Generate curve data
    var points = [];
    var maxPPLH = 0;
    for (var i = 0; i <= 100; i++) {
      var pct = i * 0.5;
      var newSpeed = speed * (1 + pct / 100);
      var newAvail = Math.max(0, avail - (pct / 10) * availSens);
      var newQual = Math.max(0, quality - (pct / 10) * qualSens);
      var pplh = newSpeed * (newAvail / 100) * (newQual / 100) / operators;
      points.push({ pct: pct, pplh: pplh });
      if (pplh > maxPPLH) maxPPLH = pplh;
    }
    maxPPLH *= 1.15;
    if (maxPPLH === 0) maxPPLH = 10;

    function xPos(pct) { return pad.left + (pct / 50) * plotW; }
    function yPos(p) { return pad.top + plotH - (p / maxPPLH) * plotH; }

    // Grid
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 0.5;
    for (var g = 0; g <= 5; g++) {
      var gy = pad.top + plotH * g / 5;
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(W - pad.right, pad.top + plotH);
    ctx.stroke();

    // X labels
    ctx.fillStyle = '#666';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var x = 0; x <= 50; x += 10) {
      ctx.fillText('+' + x + '%', xPos(x), H - pad.bottom + 20);
    }
    ctx.fillText('Speed Increase', W / 2, H - 5);

    // Y labels
    ctx.textAlign = 'right';
    for (var yi = 0; yi <= 5; yi++) {
      var yv = maxPPLH * (5 - yi) / 5;
      ctx.fillText(yv.toFixed(1), pad.left - 8, pad.top + plotH * yi / 5 + 4);
    }

    // PPLH curve
    ctx.strokeStyle = '#0891B2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach(function (pt, idx) {
      var px = xPos(pt.pct);
      var py = yPos(pt.pplh);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // User scenario dot
    if (userIncrease >= 0 && userIncrease <= 50) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(xPos(userIncrease), yPos(scenarioPPLH), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('You: ' + scenarioPPLH.toFixed(1), xPos(userIncrease) + 10, yPos(scenarioPPLH) - 4);
    }

    // Optimal dot
    if (optIncrease >= 0 && optIncrease <= 50) {
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(xPos(optIncrease), yPos(optPPLH), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Optimal: ' + optPPLH.toFixed(1), xPos(optIncrease) + 10, yPos(optPPLH) + 14);
    }

    // Legend
    ctx.fillStyle = '#0891B2';
    ctx.fillRect(pad.left + 10, pad.top + 6, 14, 3);
    ctx.fillStyle = '#333';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('PPLH Curve', pad.left + 30, pad.top + 10);
  }

  function init() {
    canvas = document.getElementById('pplh-chart');

    var sliders = document.querySelectorAll('.speed-downtime-calc input[type="range"]');
    sliders.forEach(function (slider) {
      updateSliderDisplay(slider);
      slider.addEventListener('input', function () {
        updateSliderDisplay(this);
        updateCalculations();
      });
    });

    updateCalculations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
