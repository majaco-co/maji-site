/**
 * maji Stock Calculator — Raw Material Stock Holdings Calculator
 * Finds the optimal service level that minimises total inventory cost.
 * Enhanced with animated results, chart tooltips, and visual indicators.
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

  var chartTooltipEl = null;
  var chartData = [];
  var chartMeta = {};

  /* ---- Standard Normal helpers ---- */
  function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  function normCDF(x) {
    if (x < -8) return 0;
    if (x > 8) return 1;
    var neg = x < 0;
    if (neg) x = -x;
    var t = 1 / (1 + 0.2316419 * x);
    var d = 0.3989422804014327;
    var p = d * Math.exp(-0.5 * x * x);
    var a = ((((1.330274429 * t - 1.821255978) * t + 1.781477937) * t - 0.356563782) * t + 0.319381530) * t;
    var c = 1 - p * a;
    return neg ? 1 - c : c;
  }

  function unitNormalLoss(z) {
    return normPDF(z) - z * (1 - normCDF(z));
  }

  function calculate() {
    var meanDemand = parseFloat(document.getElementById('meanDemand').value);
    var stdDemand = parseFloat(document.getElementById('stdDemand').value);
    var annualDemand = parseFloat(document.getElementById('annualDemand').value);
    var meanLT = parseFloat(document.getElementById('meanLT').value);
    var stdLT = parseFloat(document.getElementById('stdLT').value);
    var orderQty = parseFloat(document.getElementById('orderQty').value);
    var unitCost = parseFloat(document.getElementById('unitCost').value);
    var costCapital = parseFloat(document.getElementById('costCapital').value) / 100;
    var storageCost = parseFloat(document.getElementById('storageCost').value);
    var lostSalesCost = parseFloat(document.getElementById('lostSalesCost').value);
    var rejectionRate = parseFloat(document.getElementById('rejectionRate').value) / 100;

    if ([meanDemand, stdDemand, annualDemand, meanLT, stdLT, orderQty, unitCost, costCapital, storageCost, lostSalesCost].some(isNaN)) {
      alert('Please fill in all fields with valid numbers.');
      return;
    }
    if (isNaN(rejectionRate)) rejectionRate = 0;

    var sigmaDLT = Math.sqrt(meanLT * stdDemand * stdDemand + meanDemand * meanDemand * stdLT * stdLT);
    var rejectionBuffer = (rejectionRate / (1 - rejectionRate)) * meanDemand * meanLT;
    var holdingCostPerUnit = unitCost * costCapital + storageCost;
    var cyclesPerYear = annualDemand / orderQty;

    var bestZ = 0;
    var bestCost = Infinity;
    chartData = [];

    for (var zi = 0; zi <= 350; zi++) {
      var z = zi / 100;
      var ss = z * sigmaDLT + rejectionBuffer;
      var avgInv = ss + orderQty / 2;
      var holdCost = holdingCostPerUnit * avgInv;
      var expectedShortage = sigmaDLT * unitNormalLoss(z);
      var stockoutCost = lostSalesCost * cyclesPerYear * expectedShortage;
      var totalCost = holdCost + stockoutCost;

      var sl = normCDF(z) * 100;
      chartData.push({ sl: sl, total: totalCost, holding: holdCost, stockout: stockoutCost, z: z });

      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestZ = z;
      }
    }

    var optSS = bestZ * sigmaDLT + rejectionBuffer;
    var optROP = meanDemand * meanLT + optSS;
    var optAvgInv = optSS + orderQty / 2;
    var optMaxStock = optROP + orderQty;
    var optServiceLevel = normCDF(bestZ) * 100;

    var optHoldCost = holdingCostPerUnit * optAvgInv;
    var optCapCost = unitCost * costCapital * optAvgInv;
    var optStorCost = storageCost * optAvgInv;
    var optExpShortage = sigmaDLT * unitNormalLoss(bestZ);
    var optStockoutCost = lostSalesCost * cyclesPerYear * optExpShortage;

    var stockoutFreq = cyclesPerYear * (1 - normCDF(bestZ));
    var workingCapital = unitCost * optAvgInv;

    var demandVar = meanLT * stdDemand * stdDemand;
    var ltVar = meanDemand * meanDemand * stdLT * stdLT;
    var totalVar = demandVar + ltVar;
    var demandPct = totalVar > 0 ? (demandVar / totalVar * 100) : 50;
    var ltPct = totalVar > 0 ? (ltVar / totalVar * 100) : 50;

    var keyInsight = '';
    if (demandPct > 70) {
      keyInsight = 'Demand variability is the dominant driver. Focus on demand forecasting improvements.';
    } else if (ltPct > 70) {
      keyInsight = 'Lead time variability is the dominant driver. Focus on supplier reliability.';
    } else {
      keyInsight = 'Both demand and lead time variability contribute significantly. Address both.';
    }

    // Populate outputs with animated reveal
    var results = [
      { id: 'optimalServiceLevel', val: optServiceLevel.toFixed(1) + '%' },
      { id: 'optimalZScore', val: 'z = ' + bestZ.toFixed(2) },
      { id: 'safetyStock', val: Math.round(optSS).toLocaleString() + ' units' },
      { id: 'reorderPoint', val: Math.round(optROP).toLocaleString() + ' units' },
      { id: 'maxStock', val: Math.round(optMaxStock).toLocaleString() + ' units' },
      { id: 'avgInventory', val: Math.round(optAvgInv).toLocaleString() + ' units' },
      { id: 'capitalCost', val: formatCurrency(optCapCost) },
      { id: 'physicalStorageCost', val: formatCurrency(optStorCost) },
      { id: 'stockoutCost', val: formatCurrency(optStockoutCost) },
      { id: 'totalCost', val: formatCurrency(bestCost) },
      { id: 'stockoutFreq', val: stockoutFreq.toFixed(2) + ' events/year' },
      { id: 'reorderCycles', val: cyclesPerYear.toFixed(1) + ' cycles/year' },
      { id: 'workingCapital', val: formatCurrency(workingCapital) },
      { id: 'demandComponent', val: demandPct.toFixed(0) + '%' },
      { id: 'ltComponent', val: ltPct.toFixed(0) + '%' },
      { id: 'keyInsight', val: keyInsight }
    ];

    // Show results container
    var resultsEl = document.getElementById('calc-results');
    resultsEl.style.display = 'block';

    // Animate each result item
    results.forEach(function (r, idx) {
      setTimeout(function () {
        var el = document.getElementById(r.id);
        if (el) {
          el.textContent = r.val;
          var parentItem = el.closest('.result-item');
          if (parentItem) {
            parentItem.classList.remove('result-animate-in');
            void parentItem.offsetWidth; // trigger reflow
            parentItem.classList.add('result-animate-in');
            parentItem.style.animationDelay = '0ms';
          }
        }
      }, idx * 40);
    });

    // Apply visual indicators to cost items
    setTimeout(function () {
      applyResultIndicators(optStockoutCost, optCapCost, optStorCost, bestCost, stockoutFreq, optServiceLevel);
    }, 200);

    // Draw chart
    chartMeta = {
      optSL: optServiceLevel,
      optCost: bestCost
    };
    drawChart(chartData, optServiceLevel);
  }

  function applyResultIndicators(stockoutCost, capCost, storCost, totalCost, stockoutFreq, serviceLevel) {
    // Service level indicator
    var slEl = document.getElementById('optimalServiceLevel');
    if (slEl) {
      var parent = slEl.closest('.result-item');
      if (parent) {
        parent.classList.remove('result-optimal', 'result-warning', 'result-danger');
        if (serviceLevel >= 95) parent.classList.add('result-optimal');
        else if (serviceLevel >= 85) parent.classList.add('result-warning');
        else parent.classList.add('result-danger');
      }
    }

    // Stockout frequency indicator
    var sfEl = document.getElementById('stockoutFreq');
    if (sfEl) {
      var parent = sfEl.closest('.result-item');
      if (parent) {
        parent.classList.remove('result-optimal', 'result-warning', 'result-danger');
        if (stockoutFreq <= 1) parent.classList.add('result-optimal');
        else if (stockoutFreq <= 3) parent.classList.add('result-warning');
        else parent.classList.add('result-danger');
      }
    }

    // Total cost emphasis
    var tcEl = document.getElementById('totalCost');
    if (tcEl) {
      tcEl.classList.add('result-total-highlight');
    }
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatCurrency(v) {
    return '\u00A3' + Math.round(v).toLocaleString();
  }

  /* ---- Chart drawing (Canvas) with tooltips ---- */
  function drawChart(data, optSL) {
    var canvas = document.getElementById('costChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 360 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '360px';
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = 360;
    var pad = { top: 28, right: 24, bottom: 55, left: 75 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    var slMin = 50;
    var slMax = 100;
    var costMax = 0;
    var filtered = data.filter(function (d) { return d.sl >= slMin; });
    filtered.forEach(function (d) {
      if (d.total > costMax) costMax = d.total;
      if (d.holding > costMax) costMax = d.holding;
      if (d.stockout > costMax) costMax = d.stockout;
    });
    costMax *= 1.1;
    if (costMax === 0) costMax = 100;

    // Store chart geometry for tooltip lookup
    chartMeta.slMin = slMin;
    chartMeta.slMax = slMax;
    chartMeta.costMax = costMax;
    chartMeta.pad = pad;
    chartMeta.plotW = plotW;
    chartMeta.plotH = plotH;
    chartMeta.W = W;
    chartMeta.H = H;
    chartMeta.filtered = filtered;

    function xPos(sl) { return pad.left + (sl - slMin) / (slMax - slMin) * plotW; }
    function yPos(c) { return pad.top + plotH - (c / costMax) * plotH; }

    // Background gradient
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#FAFAFA');
    bgGrad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 5; i++) {
      var gy = pad.top + plotH * i / 5;
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
    }
    for (var s = 50; s <= 100; s += 10) {
      var gx = xPos(s);
      ctx.beginPath(); ctx.moveTo(gx, pad.top); ctx.lineTo(gx, pad.top + plotH); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(W - pad.right, pad.top + plotH);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var s = 50; s <= 100; s += 10) {
      ctx.fillText(s + '%', xPos(s), H - pad.bottom + 22);
    }
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Service Level', W / 2, H - 8);

    // Y-axis labels
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'right';
    for (var j = 0; j <= 5; j++) {
      var val = costMax * (5 - j) / 5;
      ctx.fillText('\u00A3' + Math.round(val).toLocaleString(), pad.left - 10, pad.top + plotH * j / 5 + 4);
    }

    // Area fill under total cost curve
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#006458';
    ctx.beginPath();
    var started = false;
    filtered.forEach(function (d) {
      var x = xPos(d.sl);
      var y = yPos(d.total);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xPos(filtered[filtered.length - 1].sl), pad.top + plotH);
    ctx.lineTo(xPos(filtered[0].sl), pad.top + plotH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw curves
    function drawLine(key, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 2;
      ctx.beginPath();
      var started = false;
      filtered.forEach(function (d) {
        var x = xPos(d.sl);
        var y = yPos(d[key]);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    drawLine('holding', '#008577', 2.5);
    drawLine('stockout', '#EF4444', 2.5);
    drawLine('total', '#006458', 3);

    // Optimal vertical line
    if (optSL >= slMin && optSL <= slMax) {
      ctx.strokeStyle = '#006458';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      var ox = xPos(optSL);
      ctx.beginPath(); ctx.moveTo(ox, pad.top); ctx.lineTo(ox, pad.top + plotH); ctx.stroke();
      ctx.setLineDash([]);

      // Optimal dot
      var optDataPoint = filtered.reduce(function (closest, d) {
        return Math.abs(d.sl - optSL) < Math.abs(closest.sl - optSL) ? d : closest;
      }, filtered[0]);
      var optY = yPos(optDataPoint.total);

      // Outer glow
      ctx.beginPath();
      ctx.arc(ox, optY, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 100, 88, 0.15)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(ox, optY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#006458';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#004a40';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Optimal: ' + optSL.toFixed(1) + '%', ox, pad.top - 10);
    }

    // Legend
    var legX = pad.left + 14;
    var legY = pad.top + 14;
    var legItems = [
      { label: 'Total Cost', color: '#006458' },
      { label: 'Holding Cost', color: '#008577' },
      { label: 'Stockout Cost', color: '#EF4444' }
    ];

    // Legend background
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legX - 8, legY - 10, 130, legItems.length * 20 + 12, 6);
    ctx.fill();
    ctx.stroke();

    legItems.forEach(function (item, idx) {
      var ly = legY + idx * 20;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legX + 4, ly, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legX + 14, ly + 4);
    });
  }

  /* ---- Chart tooltip on mouse move ---- */
  function initChartTooltip() {
    var canvas = document.getElementById('costChart');
    if (!canvas) return;

    chartTooltipEl = document.createElement('div');
    chartTooltipEl.className = 'chart-tooltip';
    document.body.appendChild(chartTooltipEl);

    canvas.addEventListener('mousemove', function (e) {
      if (!chartMeta.filtered || !chartMeta.filtered.length) return;

      var rect = canvas.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;

      var pad = chartMeta.pad;
      if (mouseX < pad.left || mouseX > chartMeta.W - pad.right || mouseY < pad.top || mouseY > pad.top + chartMeta.plotH) {
        chartTooltipEl.classList.remove('visible');
        return;
      }

      var slAtMouse = chartMeta.slMin + (mouseX - pad.left) / chartMeta.plotW * (chartMeta.slMax - chartMeta.slMin);

      // Find closest data point
      var closest = chartMeta.filtered.reduce(function (best, d) {
        return Math.abs(d.sl - slAtMouse) < Math.abs(best.sl - slAtMouse) ? d : best;
      }, chartMeta.filtered[0]);

      var html = '<div style="font-weight:700;margin-bottom:4px;">Service Level: ' + closest.sl.toFixed(1) + '%</div>';
      html += '<div class="chart-tooltip__row"><span class="chart-tooltip__swatch" style="background:#006458"></span> Total: \u00A3' + Math.round(closest.total).toLocaleString() + '</div>';
      html += '<div class="chart-tooltip__row"><span class="chart-tooltip__swatch" style="background:#008577"></span> Holding: \u00A3' + Math.round(closest.holding).toLocaleString() + '</div>';
      html += '<div class="chart-tooltip__row"><span class="chart-tooltip__swatch" style="background:#EF4444"></span> Stockout: \u00A3' + Math.round(closest.stockout).toLocaleString() + '</div>';

      chartTooltipEl.innerHTML = html;
      chartTooltipEl.classList.add('visible');

      var tx = e.clientX + 16;
      var ty = e.clientY - 10;
      var tooltipRect = chartTooltipEl.getBoundingClientRect();
      if (tx + tooltipRect.width > window.innerWidth - 10) tx = e.clientX - tooltipRect.width - 16;
      chartTooltipEl.style.left = tx + 'px';
      chartTooltipEl.style.top = ty + 'px';
    });

    canvas.addEventListener('mouseleave', function () {
      chartTooltipEl.classList.remove('visible');
    });
  }

  /* ---- Enhanced input styling ---- */
  function enhanceInputs() {
    var inputs = document.querySelectorAll('.calc-row input[type="number"]');
    inputs.forEach(function (input) {
      input.addEventListener('focus', function () {
        this.closest('.calc-row').style.background = 'rgba(0, 100, 88, 0.03)';
        this.closest('.calc-row').style.borderRadius = '8px';
        this.closest('.calc-row').style.transition = 'background 0.3s ease';
      });
      input.addEventListener('blur', function () {
        this.closest('.calc-row').style.background = 'none';
      });
    });
  }

  /* ---- Wire up ---- */
  function init() {
    var btn = document.getElementById('calcBtn');
    if (btn) btn.addEventListener('click', calculate);
    initChartTooltip();
    enhanceInputs();

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (chartData.length > 0) {
          drawChart(chartData, chartMeta.optSL);
        }
      }, 200);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
