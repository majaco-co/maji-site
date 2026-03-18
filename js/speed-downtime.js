/**
 * maji Speed-Downtime Trade-off Calculator
 * Finds the optimal line speed where PPLH peaks.
 * Enhanced with visual slider feedback, smooth chart, animated optimal marker,
 * and user-vs-optimal comparison.
 */
(function () {
  'use strict';

  // Polyfill for roundRect
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === 'number') r = [r, r, r, r];
      var rad = r[0] || 0;
      this.moveTo(x + rad, y);
      this.lineTo(x + w - rad, y);
      this.quadraticCurveTo(x + w, y, x + w, y + rad);
      this.lineTo(x + w, y + h - rad);
      this.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      this.lineTo(x + rad, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - rad);
      this.lineTo(x, y + rad);
      this.quadraticCurveTo(x, y, x + rad, y);
      this.closePath();
      return this;
    };
  }

  var canvas, ctx;
  var chartTooltipEl = null;
  var chartMeta = {};

  function val(id) {
    var el = document.getElementById(id);
    return el ? parseFloat(el.value) : 0;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function updateSliderFill(slider) {
    var min = parseFloat(slider.min);
    var max = parseFloat(slider.max);
    var val = parseFloat(slider.value);
    var pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--fill-pct', pct + '%');
  }

  function updateSliderDisplay(slider) {
    var display = slider.parentElement.querySelector('.slider-value');
    if (!display) return;
    var id = slider.id;
    var v = parseFloat(slider.value);
    var text = '';
    if (id === 'speed') text = v + ' packs/hr';
    else if (id === 'availability') text = v + '%';
    else if (id === 'quality') text = v + '%';
    else if (id === 'operators') text = v + ' people';
    else if (id === 'shift') text = v + ' hours';
    else if (id === 'speed-increase') text = '+' + v + '%';
    else if (id === 'avail-sensitivity') text = v + '% per 10%';
    else if (id === 'quality-sensitivity') text = v + '% per 10%';

    display.textContent = text;

    // Pop animation
    display.classList.remove('slider-value--changed');
    void display.offsetWidth;
    display.classList.add('slider-value--changed');

    updateSliderFill(slider);
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

    var baselinePPLH = speed * (avail / 100) * (quality / 100) / operators;

    function calcPPLH(pctIncrease) {
      var newSpeed = speed * (1 + pctIncrease / 100);
      var newAvail = Math.max(0, avail - (pctIncrease / 10) * availSens);
      var newQual = Math.max(0, quality - (pctIncrease / 10) * qualSens);
      return newSpeed * (newAvail / 100) * (newQual / 100) / operators;
    }

    var scenarioPPLH = calcPPLH(speedIncrease);
    var changePct = baselinePPLH > 0 ? ((scenarioPPLH - baselinePPLH) / baselinePPLH * 100) : 0;

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

    // Update standard displays
    setText('baseline-pplh', baselinePPLH.toFixed(1) + ' packs/labour-hr');
    setText('new-pplh', scenarioPPLH.toFixed(1) + ' packs/labour-hr');

    var changeEl = document.getElementById('new-change');
    if (changeEl) {
      var sign = changePct >= 0 ? '+' : '';
      changeEl.textContent = sign + changePct.toFixed(1) + '%';
      changeEl.style.color = changePct >= 0 ? '#006458' : '#EF4444';
    }

    setText('optimal-speed', Math.round(optSpeed) + ' packs/hr');
    setText('optimal-increase', '+' + optIncrease.toFixed(1) + '%');
    setText('optimal-pplh', optPPLH.toFixed(1) + ' packs/labour-hr');

    // Update comparison cards if they exist
    var compYou = document.getElementById('sd-comp-you-value');
    var compOpt = document.getElementById('sd-comp-opt-value');
    var compYouSub = document.getElementById('sd-comp-you-sub');
    var compOptSub = document.getElementById('sd-comp-opt-sub');

    if (compYou) compYou.textContent = scenarioPPLH.toFixed(1);
    if (compOpt) compOpt.textContent = optPPLH.toFixed(1);
    if (compYouSub) compYouSub.textContent = 'At +' + speedIncrease + '% speed (' + Math.round(speed * (1 + speedIncrease / 100)) + ' packs/hr)';
    if (compOptSub) compOptSub.textContent = 'At +' + optIncrease.toFixed(1) + '% speed (' + Math.round(optSpeed) + ' packs/hr)';

    // Color the change indicator on result items
    var resultItems = document.querySelectorAll('.result-item');
    resultItems.forEach(function (item) {
      item.classList.remove('result-optimal', 'result-warning', 'result-danger');
    });

    // Highlight optimal PPLH result
    var optPplhEl = document.getElementById('optimal-pplh');
    if (optPplhEl) {
      var parent = optPplhEl.closest('.result-item');
      if (parent) parent.classList.add('result-optimal');
    }

    // Highlight scenario change
    if (changeEl) {
      var changeParent = changeEl.closest('.result-item');
      if (changeParent) {
        if (changePct >= 0) changeParent.classList.add('result-optimal');
        else changeParent.classList.add('result-danger');
      }
    }

    drawChart(speed, avail, quality, operators, availSens, qualSens, speedIncrease, baselinePPLH, scenarioPPLH, optIncrease, optPPLH);
  }

  function drawChart(speed, avail, quality, operators, availSens, qualSens, userIncrease, baselinePPLH, scenarioPPLH, optIncrease, optPPLH) {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 340 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '340px';
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = 340;
    var pad = { top: 28, right: 30, bottom: 55, left: 75 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Background
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#FAFAFA');
    bgGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

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

    // Store for tooltip
    chartMeta = { points: points, maxPPLH: maxPPLH, pad: pad, plotW: plotW, plotH: plotH, W: W, H: H, userIncrease: userIncrease, scenarioPPLH: scenarioPPLH, optIncrease: optIncrease, optPPLH: optPPLH };

    function xPos(pct) { return pad.left + (pct / 50) * plotW; }
    function yPos(p) { return pad.top + plotH - (p / maxPPLH) * plotH; }

    // Grid
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 5; g++) {
      var gy = pad.top + plotH * g / 5;
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
    }
    for (var gx = 0; gx <= 50; gx += 10) {
      var gxPos = xPos(gx);
      ctx.beginPath(); ctx.moveTo(gxPos, pad.top); ctx.lineTo(gxPos, pad.top + plotH); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(W - pad.right, pad.top + plotH);
    ctx.stroke();

    // X labels
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var x = 0; x <= 50; x += 10) {
      ctx.fillText('+' + x + '%', xPos(x), H - pad.bottom + 22);
    }
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Speed Increase', W / 2, H - 8);

    // Y labels
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'right';
    for (var yi = 0; yi <= 5; yi++) {
      var yv = maxPPLH * (5 - yi) / 5;
      ctx.fillText(yv.toFixed(1), pad.left - 10, pad.top + plotH * yi / 5 + 4);
    }

    // Fill area under curve with gradient
    ctx.globalAlpha = 0.08;
    var areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    areaGrad.addColorStop(0, '#006458');
    areaGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    points.forEach(function (pt, idx) {
      var px = xPos(pt.pct);
      var py = yPos(pt.pplh);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(xPos(points[points.length - 1].pct), pad.top + plotH);
    ctx.lineTo(xPos(0), pad.top + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // PPLH curve - smooth with gradient stroke
    ctx.strokeStyle = '#006458';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach(function (pt, idx) {
      var px = xPos(pt.pct);
      var py = yPos(pt.pplh);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Baseline marker (at 0%)
    ctx.beginPath();
    ctx.arc(xPos(0), yPos(points[0].pplh), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#64748B';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // User scenario dot
    if (userIncrease >= 0 && userIncrease <= 50) {
      // Line from baseline to user
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(points[0].pplh));
      ctx.lineTo(xPos(userIncrease), yPos(scenarioPPLH));
      ctx.stroke();
      ctx.setLineDash([]);

      // Dot
      ctx.beginPath();
      ctx.arc(xPos(userIncrease), yPos(scenarioPPLH), 7, 0, Math.PI * 2);
      ctx.fillStyle = scenarioPPLH >= points[0].pplh ? '#008577' : '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = scenarioPPLH >= points[0].pplh ? '#004a40' : '#991B1B';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      var labelX = xPos(userIncrease) + 12;
      if (labelX + 80 > W - pad.right) {
        ctx.textAlign = 'right';
        labelX = xPos(userIncrease) - 12;
      }
      ctx.fillText('You: ' + scenarioPPLH.toFixed(1), labelX, yPos(scenarioPPLH) - 6);
    }

    // Optimal dot with animated glow effect
    if (optIncrease >= 0 && optIncrease <= 50) {
      // Outer glow rings
      ctx.beginPath();
      ctx.arc(xPos(optIncrease), yPos(optPPLH), 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 100, 88, 0.08)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(xPos(optIncrease), yPos(optPPLH), 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 100, 88, 0.15)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(xPos(optIncrease), yPos(optPPLH), 6, 0, Math.PI * 2);
      ctx.fillStyle = '#006458';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#004a40';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      var optLabelX = xPos(optIncrease) + 12;
      var optLabelY = yPos(optPPLH) + 16;
      if (optLabelX + 100 > W - pad.right) {
        ctx.textAlign = 'right';
        optLabelX = xPos(optIncrease) - 12;
      }
      ctx.fillText('Optimal: ' + optPPLH.toFixed(1), optLabelX, optLabelY);
    }

    // Legend
    var legX = W - pad.right - 160;
    var legY = pad.top + 14;

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legX - 8, legY - 10, 160, 60, 6);
    ctx.fill();
    ctx.stroke();

    var legItems = [
      { label: 'PPLH Curve', color: '#006458', type: 'line' },
      { label: 'Your Scenario', color: '#008577', type: 'dot' },
      { label: 'Optimal Point', color: '#006458', type: 'dot' }
    ];

    legItems.forEach(function (item, idx) {
      var ly = legY + idx * 18;
      if (item.type === 'line') {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(legX, ly);
        ctx.lineTo(legX + 14, ly);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(legX + 7, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      }
      ctx.fillStyle = '#334155';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legX + 22, ly + 4);
    });
  }

  function initChartTooltip() {
    chartTooltipEl = document.createElement('div');
    chartTooltipEl.className = 'chart-tooltip';
    document.body.appendChild(chartTooltipEl);
  }

  function handleChartHover(e) {
    if (!chartTooltipEl || !chartMeta.points || !chartMeta.points.length) return;

    var rect = canvas.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;
    var pad = chartMeta.pad;

    if (mouseX < pad.left || mouseX > chartMeta.W - pad.right || mouseY < pad.top || mouseY > pad.top + chartMeta.plotH) {
      chartTooltipEl.classList.remove('visible');
      return;
    }

    var pctAtMouse = ((mouseX - pad.left) / chartMeta.plotW) * 50;
    var closest = chartMeta.points.reduce(function (best, pt) {
      return Math.abs(pt.pct - pctAtMouse) < Math.abs(best.pct - pctAtMouse) ? pt : best;
    }, chartMeta.points[0]);

    var html = '<div style="font-weight:700;margin-bottom:4px;">+' + closest.pct.toFixed(1) + '% speed</div>';
    html += '<div>PPLH: <strong>' + closest.pplh.toFixed(1) + '</strong></div>';

    chartTooltipEl.innerHTML = html;
    chartTooltipEl.classList.add('visible');

    var tx = e.clientX + 16;
    var ty = e.clientY - 10;
    var tooltipRect = chartTooltipEl.getBoundingClientRect();
    if (tx + tooltipRect.width > window.innerWidth - 10) tx = e.clientX - tooltipRect.width - 16;
    chartTooltipEl.style.left = tx + 'px';
    chartTooltipEl.style.top = ty + 'px';
  }

  function init() {
    canvas = document.getElementById('pplh-chart');

    initChartTooltip();

    if (canvas) {
      canvas.addEventListener('mousemove', handleChartHover);
      canvas.addEventListener('mouseleave', function () {
        if (chartTooltipEl) chartTooltipEl.classList.remove('visible');
      });
    }

    var sliders = document.querySelectorAll('.speed-downtime-calc input[type="range"]');
    sliders.forEach(function (slider) {
      updateSliderFill(slider);
      updateSliderDisplay(slider);
      slider.addEventListener('input', function () {
        updateSliderDisplay(this);
        updateCalculations();
      });
    });

    updateCalculations();

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateCalculations();
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
