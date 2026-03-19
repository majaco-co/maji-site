/**
 * maji Batch vs Flow — interactive elements
 * 1. System availability calculator
 * 2. Production line simulation (one-piece flow vs buffered)
 */
(function () {
  'use strict';

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
  var SIM_BUFFER_SIZE = 4;
  var tickCount = 0;

  // Station configs — array of { uptime: 0-100, cycleTicks: 1-6 }
  var stationConfigs = [
    { uptime: 88, cycleTicks: 2 },
    { uptime: 88, cycleTicks: 2 },
    { uptime: 88, cycleTicks: 2 },
    { uptime: 88, cycleTicks: 2 },
    { uptime: 88, cycleTicks: 2 }
  ];

  var simSpeed = 2; // cycles per second

  function getTickMs() {
    return Math.round(1000 / simSpeed);
  }

  function Station(id, cycleTicks) {
    this.id = id;
    this.cycleTicks = cycleTicks;
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
      this.stations.push(new Station(i, stationConfigs[i].cycleTicks));
    }
    this.buffers = [];
    for (var i = 0; i < stationConfigs.length - 1; i++) {
      this.buffers.push(0);
    }
    this.produced = 0;
    this.blocked = 0;
    this.starved = 0;
  }

  SimLine.prototype.tick = function (failures) {
    var stations = this.stations;
    var buffers = this.buffers;
    var bufSize = this.hasBuffers ? SIM_BUFFER_SIZE : 0;

    // Apply failures
    for (var i = 0; i < stations.length; i++) {
      if (failures[i]) {
        stations[i].isUp = false;
        stations[i].downTicks = 3 + Math.floor(Math.random() * 4);
        stations[i].processing = false;
        stations[i].progressTicks = 0;
      }
    }

    // Recover
    for (var i = 0; i < stations.length; i++) {
      if (!stations[i].isUp) {
        stations[i].downTicks--;
        if (stations[i].downTicks <= 0) {
          stations[i].isUp = true;
        }
      }
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
          'min="1" max="6" step="1" value="' + cfg.cycleTicks + '" title="Cycle ticks">' +
        '<span class="ssc-unit">ticks</span>' +
        '</div>';
    }
    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.ssc-input').forEach(function (input) {
      input.addEventListener('change', function () {
        var idx = parseInt(this.dataset.idx);
        var field = this.dataset.field;
        var val = parseInt(this.value);
        if (isNaN(val)) return;
        if (field === 'uptime') val = Math.max(50, Math.min(99, val));
        if (field === 'cycleTicks') val = Math.max(1, Math.min(6, val));
        this.value = val;
        stationConfigs[idx][field] = val;
        if (!simRunning) { resetSim(); renderSim(); }
      });
    });
  }

  function addStation() {
    if (stationConfigs.length >= 8) return;
    stationConfigs.push({ uptime: 88, cycleTicks: 2 });
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
        // Re-read configs before starting (in case user changed while paused)
        resetSim();
        renderSim();
        startSim();
        startBtn.textContent = 'Pause';
      }
    });

    if (resetBtn) resetBtn.addEventListener('click', function () {
      pauseSim();
      resetSim();
      renderSim();
      if (startBtn) startBtn.textContent = 'Start Simulation';
    });

    if (addBtn) addBtn.addEventListener('click', function () {
      pauseSim();
      addStation();
      resetSim();
      renderSim();
      if (startBtn) startBtn.textContent = 'Start Simulation';
    });

    if (removeBtn) removeBtn.addEventListener('click', function () {
      pauseSim();
      removeStation();
      resetSim();
      renderSim();
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
          }, getTickMs());
        }
      });
    }
  }

  function resetSim() {
    flowLine = new SimLine(false);
    bufferLine = new SimLine(true);
    for (var i = 0; i < bufferLine.buffers.length; i++) {
      bufferLine.buffers[i] = 2;
    }
    tickCount = 0;
  }

  function startSim() {
    if (simRunning) return;
    simRunning = true;
    simInterval = setInterval(function () {
      simTick();
      renderSim();
    }, getTickMs());
  }

  function pauseSim() {
    simRunning = false;
    clearInterval(simInterval);
  }

  function simTick() {
    tickCount++;

    // Per-station failures using individual uptime
    var failures = [];
    for (var i = 0; i < stationConfigs.length; i++) {
      var threshold = stationConfigs[i].uptime / 100;
      failures.push(Math.random() > threshold);
    }

    flowLine.tick(failures);
    bufferLine.tick(failures);
  }

  function renderSim() {
    var flowCount = document.getElementById('sim-flow-count');
    var bufCount = document.getElementById('sim-buf-count');
    var tickEl = document.getElementById('sim-ticks');

    if (flowCount) flowCount.textContent = flowLine.produced;
    if (bufCount) bufCount.textContent = bufferLine.produced;
    if (tickEl) tickEl.textContent = tickCount;

    var advEl = document.getElementById('sim-advantage');
    if (advEl && flowLine.produced > 0) {
      var adv = ((bufferLine.produced - flowLine.produced) / flowLine.produced * 100).toFixed(0);
      advEl.textContent = (adv >= 0 ? '+' : '') + adv + '%';
      advEl.style.color = adv >= 0 ? '#006458' : '#b53a1e';
    } else if (advEl) {
      advEl.textContent = '--';
    }

    renderLineVisual('sim-flow-line', flowLine);
    renderLineVisual('sim-buf-line', bufferLine);
  }

  function renderLineVisual(containerId, line) {
    var el = document.getElementById(containerId);
    if (!el) return;

    var html = '';
    for (var i = 0; i < line.stations.length; i++) {
      var st = line.stations[i];
      var cls = 'sim-station';
      if (!st.isUp) cls += ' sim-down';
      else if (st.hasUnit) cls += ' sim-active';
      else cls += ' sim-idle';

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
          var dots = '';
          for (var d = 0; d < SIM_BUFFER_SIZE; d++) {
            dots += '<span class="sim-buf-dot' + (d < buf ? ' filled' : '') + '"></span>';
          }
          html += '<div class="sim-buffer">' + dots + '</div>';
        } else {
          html += '<div class="sim-no-buffer"><span class="sim-arrow">&rarr;</span></div>';
        }
      }
    }
    el.innerHTML = html;
  }

  // ─── Init ───

  function init() {
    initAvailCalc();
    initSim();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
