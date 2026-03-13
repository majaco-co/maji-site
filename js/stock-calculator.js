/**
 * maji Stock Calculator — Raw Material Stock Holdings Calculator
 * Finds the optimal service level that minimises total inventory cost.
 */
(function () {
  'use strict';

  /* ---- Standard Normal helpers ---- */
  function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  // Rational approximation for cumulative normal (Abramowitz & Stegun 26.2.17)
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

  // Unit normal loss function: L(z) = phi(z) - z*(1 - Phi(z))
  function unitNormalLoss(z) {
    return normPDF(z) - z * (1 - normCDF(z));
  }

  function calculate() {
    // Read inputs
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

    // Validate
    if ([meanDemand, stdDemand, annualDemand, meanLT, stdLT, orderQty, unitCost, costCapital, storageCost, lostSalesCost].some(isNaN)) {
      alert('Please fill in all fields with valid numbers.');
      return;
    }
    if (isNaN(rejectionRate)) rejectionRate = 0;

    // Combined standard deviation of demand during lead time
    var sigmaDLT = Math.sqrt(meanLT * stdDemand * stdDemand + meanDemand * meanDemand * stdLT * stdLT);

    // Rejection buffer: extra stock to cover rejection rate
    var rejectionBuffer = (rejectionRate / (1 - rejectionRate)) * meanDemand * meanLT;

    // Holding cost per unit per year
    var holdingCostPerUnit = unitCost * costCapital + storageCost;

    // Number of reorder cycles per year
    var cyclesPerYear = annualDemand / orderQty;

    // Search for optimal z-score (0 to 3.5 in 0.01 steps)
    var bestZ = 0;
    var bestCost = Infinity;
    var chartData = [];

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

    // Compute optimal results
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

    // Stockout frequency: expected number per year
    var stockoutFreq = cyclesPerYear * (1 - normCDF(bestZ));

    // Working capital
    var workingCapital = unitCost * optAvgInv;

    // Volatility drivers
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

    // Populate outputs
    setText('optimalServiceLevel', optServiceLevel.toFixed(1) + '%');
    setText('optimalZScore', 'z = ' + bestZ.toFixed(2));
    setText('safetyStock', Math.round(optSS).toLocaleString() + ' units');
    setText('reorderPoint', Math.round(optROP).toLocaleString() + ' units');
    setText('maxStock', Math.round(optMaxStock).toLocaleString() + ' units');
    setText('avgInventory', Math.round(optAvgInv).toLocaleString() + ' units');
    setText('capitalCost', formatCurrency(optCapCost));
    setText('physicalStorageCost', formatCurrency(optStorCost));
    setText('stockoutCost', formatCurrency(optStockoutCost));
    setText('totalCost', formatCurrency(bestCost));
    setText('stockoutFreq', stockoutFreq.toFixed(2) + ' events/year');
    setText('reorderCycles', cyclesPerYear.toFixed(1) + ' cycles/year');
    setText('workingCapital', formatCurrency(workingCapital));
    setText('demandComponent', demandPct.toFixed(0) + '%');
    setText('ltComponent', ltPct.toFixed(0) + '%');
    setText('keyInsight', keyInsight);

    // Show results
    document.getElementById('calc-results').style.display = 'block';

    // Draw chart
    drawChart(chartData, optServiceLevel);
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatCurrency(v) {
    return '\u00A3' + Math.round(v).toLocaleString();
  }

  /* ---- Chart drawing (Canvas) ---- */
  function drawChart(data, optSL) {
    var canvas = document.getElementById('costChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // Hi-DPI support
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 320 * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = '320px';
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = 320;
    var pad = { top: 20, right: 20, bottom: 50, left: 70 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Find axis ranges from data
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

    function xPos(sl) { return pad.left + (sl - slMin) / (slMax - slMin) * plotW; }
    function yPos(c) { return pad.top + plotH - (c / costMax) * plotH; }

    // Grid
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 5; i++) {
      var gy = pad.top + plotH * i / 5;
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

    // X-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var s = 50; s <= 100; s += 10) {
      ctx.fillText(s + '%', xPos(s), H - pad.bottom + 20);
    }
    ctx.fillText('Service Level', W / 2, H - 5);

    // Y-axis labels
    ctx.textAlign = 'right';
    for (var j = 0; j <= 5; j++) {
      var val = costMax * (5 - j) / 5;
      ctx.fillText('\u00A3' + Math.round(val).toLocaleString(), pad.left - 8, pad.top + plotH * j / 5 + 4);
    }

    // Draw lines
    function drawLine(key, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
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

    drawLine('holding', '#22C55E');
    drawLine('stockout', '#EF4444');
    drawLine('total', '#F5C400');

    // Optimal line
    if (optSL >= slMin && optSL <= slMax) {
      ctx.strokeStyle = '#F5C400';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      var ox = xPos(optSL);
      ctx.beginPath(); ctx.moveTo(ox, pad.top); ctx.lineTo(ox, pad.top + plotH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F5C400';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Optimal: ' + optSL.toFixed(1) + '%', ox, pad.top - 4);
    }

    // Legend
    var legX = pad.left + 10;
    var legY = pad.top + 10;
    var legItems = [
      { label: 'Total Cost', color: '#F5C400' },
      { label: 'Holding Cost', color: '#22C55E' },
      { label: 'Stockout Cost', color: '#EF4444' }
    ];
    legItems.forEach(function (item, idx) {
      var ly = legY + idx * 18;
      ctx.fillStyle = item.color;
      ctx.fillRect(legX, ly - 4, 14, 3);
      ctx.fillStyle = '#333';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legX + 20, ly);
    });
  }

  /* ---- Wire up ---- */
  function init() {
    var btn = document.getElementById('calcBtn');
    if (btn) btn.addEventListener('click', calculate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
