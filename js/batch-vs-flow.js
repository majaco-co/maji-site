/**
 * maji Batch vs Flow — interactive elements
 * 1. System availability calculator
 * 2. Production line simulation (one-piece flow vs buffered)
 * 3. Cumulative output chart
 *
 * Availability model:
 *   MTTR = 4.5 ticks (mean of uniform 3–6)
 *   MTBF = A × MTTR / (1 − A)
 *   P(fail per up-tick) = 1 / MTBF
 *   This ensures a station set to 90% is actually up ~90% of all ticks.
 */
(function () {
  'use strict';

  var MTTR = 4.5; // mean of uniform(3,6)

  // ─── Availability Calculator ───

  function initAvailCalc() {
    var stationsSlider = document.getElementById('calc-stations');
    var uptimeSlider = document.getElementById('calc-uptime');
    if (!stationsSlider || !uptimeSlider) return;

    function update() {
      var n = parseInt(stationsSlider.value);
      var u = parseInt(uptimeSlider.value);

      document.getElementById('calc-stations-val').textContent = n;
      document.getElementById('calc-uptime-val').textContent = u + '%';

      var systemAvail = Math.pow(u / 100, n) * 100;
      var lostPct = u - systemAvail;

      document.getElementById('calc-individual').textContent = u + '%';
      document.getElementById('calc-system').textContent = systemAvail.toFixed(1) + '%';
      document.getElementById('calc-lost').textContent = lostPct.toFixed(1) + '%';

      var chain = document.getElementById('calc-chain');
      var parts = [];
      for (var i = 0; i < n; i++) parts.push(u + '%');
      chain.innerHTML = parts.join(' <span class="chain-op">&times;</span> ') +
        ' <span class="chain-op">=</span> <strong class="chain-result">' + systemAvail.toFixed(1) + '%</strong>';

      var indBar = document.getElementById('calc-bar-individual');
      var sysBar = document.getElementById('calc-bar-system');
      indBar.style.width = u + '%';
      sysBar.style.width = systemAvail + '%';

      if (systemAvail >= 80) sysBar.className = 'avail-bar-fill bar-ok';
      else if (systemAvail >= 60) sysBar.className = 'avail-bar-fill bar-warn';
      else sysBar.className = 'avail-bar-fill bar-bad';

      renderTable(u);
    }

    function renderTable(uptime) {
      var tbody = document.getElementById('calc-table-body');
      if (!tbody) return;
      var rows = '';
      for (var s = 2; s <= 8; s++) {
        var sys = Math.pow(uptime / 100, s) * 100;
        var cls = sys >= 80 ? 'tbl-ok' : sys >= 60 ? 'tbl-warn' : 'tbl-bad';
        rows += '<tr><td>' + s + '</td><td>' + uptime + '%</td><td class="' + cls + '">' + sys.toFixed(1) + '%</td><td class="' + cls + '">' + (uptime - sys).toFixed(1) + '%</td></tr>';
      }
      tbody.innerHTML = rows;
    }

    stationsSlider.addEventListener('input', update);
    uptimeSlider.addEventListener('input', update);
    update();
  }

  // ─── Line Simulation ───

  var simRunning = false;
  var simInterval = null;
  var SIM_BUFFER_SIZE = 4; // user-configurable
  var tickCount = 0;

  // cycleTicks: 1 (fastest) to 6 (slowest) — ticks per cycle
  var stationConfigs = [
    { uptime: 90, cycleTicks: 5 },
    { uptime: 90, cycleTicks: 5 },
    { uptime: 90, cycleTicks: 5 },
    { uptime: 90, cycleTicks: 5 },
    { uptime: 90, cycleTicks: 5 }
  ];

  var simSpeed = 2;
  var flowHistory = [];
  var bufferHistory = [];

  function getTickMs() { return Math.round(1000 / simSpeed); }

  function calcFailProb(uptimePct) {
    var a = uptimePct / 100;
    if (a >= 1) return 0;
    if (a <= 0) return 1;
    var mtbf = a * MTTR / (1 - a);
    return 1 / mtbf;
  }

  function Station(id, cycleTicks, failProb) {
    this.id = id;
    this.cycleTicks = cycleTicks;
    this.failProb = failProb;
    this.isUp = true;
    this.downTicks = 0;
    this.processing = false;
    this.progressTicks = 0;
    this.hasUnit = false;
  }

  function SimLine(hasBuffers) {
    this.hasBuffers = hasBuffers;
    this.stations = [];
    for (var i = 0; i < stationConfigs.length; i++) {
      var cfg = stationConfigs[i];
      this.stations.push(new Station(i, cfg.cycleTicks, calcFailProb(cfg.uptime)));
    }
    this.buffers = [];
    for (var i = 0; i < stationConfigs.length - 1; i++) {
      this.buffers.push(0);
    }
    this.produced = 0;
    this.blocked = 0;
    this.starved = 0;
  }

  SimLine.prototype.tick = function (rolls, downDurations) {
    var stations = this.stations;
    var buffers = this.buffers;
    var bufSize = this.hasBuffers ? SIM_BUFFER_SIZE : 0;

    // Failures & recovery
    for (var i = 0; i < stations.length; i++) {
      var st = stations[i];
      if (st.isUp) {
        if (rolls[i] < st.failProb) {
          st.isUp = false;
          st.downTicks = downDurations[i];
          st.processing = false;
          st.progressTicks = 0;
        }
      } else {
        st.downTicks--;
        if (st.downTicks <= 0) st.isUp = true;
      }
    }

    // One-piece flow: if ANY station is down, entire line stops
    if (!this.hasBuffers) {
      var anyDown = false;
      for (var i = 0; i < stations.length; i++) {
        if (!stations[i].isUp) { anyDown = true; break; }
      }
      if (anyDown) return;
    }

    // Process right to left (pull system)
    for (var i = stations.length - 1; i >= 0; i--) {
      var st = stations[i];
      if (!st.isUp) continue;

      if (st.hasUnit) {
        st.progressTicks++;
        if (st.progressTicks >= st.cycleTicks) {
          if (i === stations.length - 1) {
            this.produced++;
            st.hasUnit = false;
            st.processing = false;
            st.progressTicks = 0;
          } else if (this.hasBuffers) {
            if (buffers[i] < bufSize) {
              buffers[i]++;
              st.hasUnit = false;
              st.processing = false;
              st.progressTicks = 0;
            } else {
              this.blocked++;
            }
          } else {
            if (!stations[i + 1].hasUnit && stations[i + 1].isUp) {
              stations[i + 1].hasUnit = true;
              stations[i + 1].processing = true;
              stations[i + 1].progressTicks = 0;
              st.hasUnit = false;
              st.processing = false;
              st.progressTicks = 0;
            } else {
              this.blocked++;
            }
          }
        }
      }

      if (!st.hasUnit && st.isUp) {
        if (i === 0) {
          st.hasUnit = true;
          st.processing = true;
          st.progressTicks = 0;
        } else if (this.hasBuffers) {
          if (buffers[i - 1] > 0) {
            buffers[i - 1]--;
            st.hasUnit = true;
            st.processing = true;
            st.progressTicks = 0;
          } else {
            this.starved++;
          }
        } else {
          this.starved++;
        }
      }
    }
  };

  var flowLine, bufferLine;

  // ─── Config UI ───

  function renderStationConfigs() {
    var container = document.getElementById('sim-station-configs');
    if (!container) return;

    var html = '';
    for (var i = 0; i < stationConfigs.length; i++) {
      var cfg = stationConfigs[i];
      html += '<div class="ssc-row">' +
        '<span class="ssc-label">S' + (i + 1) + '</span>' +
        '<input type="number" class="ssc-input" data-idx="' + i + '" data-field="uptime" ' +
          'min="50" max="99" step="1" value="' + cfg.uptime + '" title="Availability %">' +
        '<span class="ssc-unit">%</span>' +
        '<input type="number" class="ssc-input ssc-input-sm" data-idx="' + i + '" data-field="cycleTicks" ' +
          'min="1" max="6" step="1" value="' + cfg.cycleTicks + '" title="Ticks per cycle (1=fastest, 6=slowest)">' +
        '<span class="ssc-unit"></span>' +
        '</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.ssc-input').forEach(function (input) {
      input.addEventListener('input', function () {
        var idx = parseInt(this.dataset.idx);
        var field = this.dataset.field;
        var val = parseInt(this.value);
        if (isNaN(val)) return;
        if (field === 'uptime') val = Math.max(50, Math.min(99, val));
        if (field === 'cycleTicks') val = Math.max(1, Math.min(6, val));
        stationConfigs[idx][field] = val;
        if (simRunning) {
          applyConfigsToRunning();
        } else {
          resetSim(); renderSim(); drawChart();
        }
      });
    });
  }

  function addStation() {
    if (stationConfigs.length >= 8) return;
    stationConfigs.push({ uptime: 90, cycleTicks: 5 });
    renderStationConfigs();
    if (!simRunning) { resetSim(); renderSim(); }
  }

  function removeStation() {
    if (stationConfigs.length <= 2) return;
    stationConfigs.pop();
    renderStationConfigs();
    if (!simRunning) { resetSim(); renderSim(); }
  }

  // ─── Sim lifecycle ───

  function initSim() {
    var container = document.getElementById('sim-container');
    if (!container) return;

    renderStationConfigs();
    resetSim();
    renderSim();

    var startBtn = document.getElementById('sim-start');
    var resetBtn = document.getElementById('sim-reset');
    var addBtn = document.getElementById('sim-add-station');
    var removeBtn = document.getElementById('sim-remove-station');
    var speedSlider = document.getElementById('sim-speed');

    if (startBtn) startBtn.addEventListener('click', function () {
      if (simRunning) {
        pauseSim();
        startBtn.textContent = 'Resume';
      } else {
        if (tickCount === 0) { resetSim(); renderSim(); }
        else { applyConfigsToRunning(); } // pick up any parameter changes
        startSim();
        startBtn.textContent = 'Pause';
      }
    });

    if (resetBtn) resetBtn.addEventListener('click', function () {
      pauseSim();
      resetSim();
      renderSim();
      drawChart();
      if (startBtn) startBtn.textContent = 'Start Simulation';
    });

    if (addBtn) addBtn.addEventListener('click', function () {
      pauseSim();
      addStation();
      resetSim();
      renderSim();
      drawChart();
      if (startBtn) startBtn.textContent = 'Start Simulation';
    });

    if (removeBtn) removeBtn.addEventListener('click', function () {
      pauseSim();
      removeStation();
      resetSim();
      renderSim();
      drawChart();
      if (startBtn) startBtn.textContent = 'Start Simulation';
    });

    if (speedSlider) {
      document.getElementById('sim-speed-val').textContent = simSpeed;
      speedSlider.addEventListener('input', function () {
        simSpeed = parseFloat(this.value);
        document.getElementById('sim-speed-val').textContent = simSpeed;
        if (simRunning) {
          clearInterval(simInterval);
          simInterval = setInterval(function () {
            simTick();
            renderSim();
            drawChart();
          }, getTickMs());
        }
      });
    }

    var bufferSlider = document.getElementById('sim-buffer-size');
    if (bufferSlider) {
      document.getElementById('sim-buffer-val').textContent = SIM_BUFFER_SIZE;
      bufferSlider.addEventListener('input', function () {
        SIM_BUFFER_SIZE = parseInt(this.value);
        document.getElementById('sim-buffer-val').textContent = SIM_BUFFER_SIZE;
      });
    }

    drawChart();
  }

  function applyConfigsToRunning() {
    // Update failProb and cycleTicks on existing stations without losing state
    [flowLine, bufferLine].forEach(function (line) {
      for (var i = 0; i < line.stations.length && i < stationConfigs.length; i++) {
        var cfg = stationConfigs[i];
        line.stations[i].failProb = calcFailProb(cfg.uptime);
        line.stations[i].cycleTicks = cfg.cycleTicks;
      }
    });
  }

  function resetSim() {
    flowLine = new SimLine(false);
    bufferLine = new SimLine(true);
    tickCount = 0;
    flowHistory = [0];
    bufferHistory = [0];
  }

  function startSim() {
    if (simRunning) return;
    simRunning = true;
    simInterval = setInterval(function () {
      simTick();
      renderSim();
      drawChart();
    }, getTickMs());
  }

  function pauseSim() {
    simRunning = false;
    clearInterval(simInterval);
  }

  function simTick() {
    tickCount++;

    // Generate shared random rolls and down-durations
    var rolls = [];
    var downDurations = [];
    for (var i = 0; i < stationConfigs.length; i++) {
      rolls.push(Math.random());
      downDurations.push(3 + Math.floor(Math.random() * 4)); // 3–6
    }

    flowLine.tick(rolls, downDurations);
    bufferLine.tick(rolls, downDurations);

    flowHistory.push(flowLine.produced);
    bufferHistory.push(bufferLine.produced);
  }

  function getBottleneckCycleTicks() {
    var max = 0;
    for (var i = 0; i < stationConfigs.length; i++) {
      if (stationConfigs[i].cycleTicks > max) max = stationConfigs[i].cycleTicks;
    }
    return max;
  }

  function getBottleneckIndices() {
    var max = getBottleneckCycleTicks();
    var indices = [];
    for (var i = 0; i < stationConfigs.length; i++) {
      if (stationConfigs[i].cycleTicks === max) indices.push(i);
    }
    return indices;
  }

  function calcEfficiency(produced) {
    if (tickCount < 2) return null;
    var bnsTicks = getBottleneckCycleTicks();
    if (bnsTicks === 0) return null;
    var potential = tickCount / bnsTicks;
    if (potential <= 0) return null;
    return (produced / potential) * 100;
  }

  function renderSim() {
    var flowCount = document.getElementById('sim-flow-count');
    var bufCount = document.getElementById('sim-buf-count');

    if (flowCount) flowCount.textContent = flowLine.produced;
    if (bufCount) bufCount.textContent = bufferLine.produced;

    var advEl = document.getElementById('sim-advantage');
    if (advEl && flowLine.produced > 0) {
      var adv = ((bufferLine.produced - flowLine.produced) / flowLine.produced * 100).toFixed(0);
      advEl.textContent = (adv >= 0 ? '+' : '') + adv + '%';
      advEl.style.color = adv >= 0 ? '#006458' : '#b53a1e';
    } else if (advEl) {
      advEl.textContent = '--';
    }

    // Efficiency — cumulative: actual output / (total ticks / bottleneck cycle ticks)
    var flowEff = calcEfficiency(flowLine.produced);
    var bufEff = calcEfficiency(bufferLine.produced);
    var flowEffEl = document.getElementById('sim-flow-eff');
    var bufEffEl = document.getElementById('sim-buf-eff');
    if (flowEffEl) flowEffEl.textContent = flowEff !== null ? flowEff.toFixed(0) + '%' : '--';
    if (bufEffEl) bufEffEl.textContent = bufEff !== null ? bufEff.toFixed(0) + '%' : '--';

    var bnIndices = getBottleneckIndices();
    renderLineVisual('sim-flow-line', flowLine, bnIndices);
    renderLineVisual('sim-buf-line', bufferLine, bnIndices);
  }

  function renderLineVisual(containerId, line, bnIndices) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var html = '';
    for (var i = 0; i < line.stations.length; i++) {
      var st = line.stations[i];
      var cls = 'sim-station';
      if (!st.isUp) cls += ' sim-down';
      else if (st.hasUnit) cls += ' sim-active';
      else cls += ' sim-idle';
      if (bnIndices && bnIndices.indexOf(i) !== -1) cls += ' sim-constraint';

      var pct = st.hasUnit ? Math.min(100, (st.progressTicks / st.cycleTicks) * 100) : 0;

      html += '<div class="' + cls + '">' +
        '<div class="sim-station-label">S' + (i + 1) + '</div>' +
        '<div class="sim-progress"><div class="sim-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="sim-ct-label">' + st.cycleTicks + 't / ' + stationConfigs[i].uptime + '%</div>' +
        (!st.isUp ? '<div class="sim-down-icon">!</div>' : '') +
        '</div>';

      if (i < line.stations.length - 1) {
        if (line.hasBuffers) {
          var buf = line.buffers[i];
          // Two rows of up to 10
          var row1 = Math.min(buf, 10);
          var row2 = Math.max(0, buf - 10);
          var cap1 = Math.min(SIM_BUFFER_SIZE, 10);
          var cap2 = Math.max(0, SIM_BUFFER_SIZE - 10);
          var dots1 = '';
          for (var d = 0; d < cap1; d++) {
            dots1 += '<span class="sim-buf-dot' + (d < row1 ? ' filled' : '') + '"></span>';
          }
          var dots2 = '';
          if (cap2 > 0) {
            for (var d = 0; d < cap2; d++) {
              dots2 += '<span class="sim-buf-dot' + (d < row2 ? ' filled' : '') + '"></span>';
            }
          }
          html += '<div class="sim-buffer"><div class="sim-buf-row">' + dots1 + '</div>' +
            (cap2 > 0 ? '<div class="sim-buf-row">' + dots2 + '</div>' : '') + '</div>';
        } else {
          html += '<div class="sim-no-buffer"><span class="sim-arrow">&rarr;</span></div>';
        }
      }
    }
    el.innerHTML = html;
  }

  // ─── Cumulative Output Chart ───

  function drawChart() {
    var canvas = document.getElementById('sim-chart');
    if (!canvas) return;

    var dpr = window.devicePixelRatio || 1;
    var wrap = document.getElementById('sim-chart-wrap');
    var W = wrap ? (wrap.clientWidth - 32) : 400;
    if (W < 100) W = 400;
    var H = 300;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var pad = { top: 20, right: 20, bottom: 32, left: 50 };
    var plotW = W - pad.left - pad.right;
    var plotH = H - pad.top - pad.bottom;

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);

    var n = flowHistory.length;
    if (n < 2) {
      ctx.fillStyle = '#7A7A7A';
      ctx.font = '12px "TT Hoves Pro", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Start the simulation to see cumulative output', W / 2, H / 2);
      return;
    }

    var maxY = Math.max(bufferHistory[n - 1], flowHistory[n - 1], 1) * 1.1;
    var maxX = n - 1;

    function xPos(i) { return pad.left + (i / maxX) * plotW; }
    function yPos(v) { return pad.top + plotH - (v / maxY) * plotH; }

    // Grid
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var gy = pad.top + plotH * g / 4;
      ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(W - pad.right, gy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(W - pad.right, pad.top + plotH);
    ctx.stroke();

    // Y labels
    ctx.fillStyle = '#7A7A7A';
    ctx.font = '10px "DM Mono", monospace';
    ctx.textAlign = 'right';
    for (var yi = 0; yi <= 4; yi++) {
      var yv = maxY * (4 - yi) / 4;
      ctx.fillText(Math.round(yv), pad.left - 6, pad.top + plotH * yi / 4 + 4);
    }

    // X label
    ctx.textAlign = 'center';
    ctx.fillText('Cycles', W / 2, H - 4);

    // Tick labels on x axis
    var xStep = Math.max(1, Math.floor(maxX / 5));
    for (var xi = 0; xi <= maxX; xi += xStep) {
      ctx.fillText(xi, xPos(xi), pad.top + plotH + 16);
    }

    // Draw step: skip points if too many for pixel width
    var step = Math.max(1, Math.floor(n / plotW));

    // Flow line (red)
    ctx.strokeStyle = '#b53a1e';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var i = 0; i < n; i += step) {
      var px = xPos(i);
      var py = yPos(flowHistory[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    // Always draw last point
    ctx.lineTo(xPos(n - 1), yPos(flowHistory[n - 1]));
    ctx.stroke();

    // Buffer line (green)
    ctx.strokeStyle = '#006458';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < n; i += step) {
      var px = xPos(i);
      var py = yPos(bufferHistory[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(xPos(n - 1), yPos(bufferHistory[n - 1]));
    ctx.stroke();

    // Legend
    var legX = pad.left + 12;
    var legY = pad.top + 10;

    ctx.fillStyle = 'rgba(250,250,250,0.85)';
    ctx.fillRect(legX - 4, legY - 10, 130, 36);

    ctx.strokeStyle = '#b53a1e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + 16, legY); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = '10px "DM Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('Flow', legX + 22, legY + 3);

    ctx.strokeStyle = '#006458'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX, legY + 16); ctx.lineTo(legX + 16, legY + 16); ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillText('Buffered', legX + 22, legY + 19);
  }

  // ─── Init ───

  function init() {
    initAvailCalc();
    initSim();

    window.addEventListener('resize', function () {
      drawChart();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
