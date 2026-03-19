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

      // Update the multiplication chain
      var chain = document.getElementById('calc-chain');
      var parts = [];
      for (var i = 0; i < n; i++) parts.push(u + '%');
      chain.innerHTML = parts.join(' <span class="chain-op">&times;</span> ') +
        ' <span class="chain-op">=</span> <strong class="chain-result">' + systemAvail.toFixed(1) + '%</strong>';

      // Update bars
      var indBar = document.getElementById('calc-bar-individual');
      var sysBar = document.getElementById('calc-bar-system');
      indBar.style.width = u + '%';
      sysBar.style.width = systemAvail + '%';

      // Colour the system bar based on severity
      if (systemAvail >= 80) sysBar.className = 'avail-bar-fill bar-ok';
      else if (systemAvail >= 60) sysBar.className = 'avail-bar-fill bar-warn';
      else sysBar.className = 'avail-bar-fill bar-bad';

      // Update the table
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
  var simFrame = null;
  var SIM_STATIONS = 5;
  var SIM_BUFFER_SIZE = 4;
  var SIM_TICK_MS = 600;
  var SIM_UPTIME = 0.88; // 88% per station per tick
  var SIM_CYCLE_TICKS = 2; // ticks to process one unit

  // Shared failure schedule so both lines see the same breakdowns
  var failureSchedule = [];
  var tickCount = 0;

  function Station(id) {
    this.id = id;
    this.isUp = true;
    this.downTicks = 0;
    this.processing = false;
    this.progressTicks = 0;
    this.hasUnit = false;
  }

  function SimLine(hasBuffers) {
    this.hasBuffers = hasBuffers;
    this.stations = [];
    for (var i = 0; i < SIM_STATIONS; i++) {
      this.stations.push(new Station(i));
    }
    this.buffers = [];
    for (var i = 0; i < SIM_STATIONS - 1; i++) {
      this.buffers.push(0);
    }
    this.produced = 0;
    this.blocked = 0; // ticks spent blocked
    this.starved = 0; // ticks spent starved
  }

  SimLine.prototype.tick = function (failures) {
    var stations = this.stations;
    var buffers = this.buffers;
    var bufSize = this.hasBuffers ? SIM_BUFFER_SIZE : 0;

    // Apply failures
    for (var i = 0; i < stations.length; i++) {
      if (failures[i]) {
        stations[i].isUp = false;
        stations[i].downTicks = 3 + Math.floor(Math.random() * 4); // 3-6 ticks down
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

      // If station has a unit and is processing
      if (st.hasUnit) {
        st.progressTicks++;
        if (st.progressTicks >= SIM_CYCLE_TICKS) {
          // Try to pass downstream
          if (i === stations.length - 1) {
            // Last station — output
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
              // Blocked, wait
            }
          } else {
            // One-piece flow: pass directly if next station is free
            if (!stations[i + 1].hasUnit && stations[i + 1].isUp) {
              stations[i + 1].hasUnit = true;
              stations[i + 1].processing = true;
              stations[i + 1].progressTicks = 0;
              st.hasUnit = false;
              st.processing = false;
              st.progressTicks = 0;
            } else {
              this.blocked++;
              // Blocked, wait
            }
          }
        }
      }

      // If station is empty, try to pull from upstream buffer or accept from upstream
      if (!st.hasUnit && st.isUp) {
        if (i === 0) {
          // First station — infinite supply
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
          // One-piece flow: upstream pushes (handled in upstream's output step)
        }
      }
    }
  };

  var flowLine, bufferLine;

  function initSim() {
    var container = document.getElementById('sim-container');
    if (!container) return;

    resetSim();
    renderSim();

    var startBtn = document.getElementById('sim-start');
    var resetBtn = document.getElementById('sim-reset');

    if (startBtn) startBtn.addEventListener('click', function () {
      if (simRunning) {
        pauseSim();
        startBtn.textContent = 'Resume';
      } else {
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
  }

  function resetSim() {
    flowLine = new SimLine(false);
    bufferLine = new SimLine(true);
    // Pre-fill buffers
    for (var i = 0; i < bufferLine.buffers.length; i++) {
      bufferLine.buffers[i] = 2;
    }
    tickCount = 0;
    failureSchedule = [];
  }

  function startSim() {
    if (simRunning) return;
    simRunning = true;
    simInterval = setInterval(function () {
      simTick();
      renderSim();
    }, SIM_TICK_MS);
  }

  function pauseSim() {
    simRunning = false;
    clearInterval(simInterval);
  }

  function simTick() {
    tickCount++;

    // Generate failures (same for both lines)
    var failures = [];
    for (var i = 0; i < SIM_STATIONS; i++) {
      failures.push(Math.random() > SIM_UPTIME);
    }

    flowLine.tick(failures);
    bufferLine.tick(failures);
  }

  function renderSim() {
    // Update counters
    var flowCount = document.getElementById('sim-flow-count');
    var bufCount = document.getElementById('sim-buf-count');
    var tickEl = document.getElementById('sim-ticks');

    if (flowCount) flowCount.textContent = flowLine.produced;
    if (bufCount) bufCount.textContent = bufferLine.produced;
    if (tickEl) tickEl.textContent = tickCount;

    // Advantage
    var advEl = document.getElementById('sim-advantage');
    if (advEl && flowLine.produced > 0) {
      var adv = ((bufferLine.produced - flowLine.produced) / flowLine.produced * 100).toFixed(0);
      advEl.textContent = (adv >= 0 ? '+' : '') + adv + '%';
      advEl.style.color = adv >= 0 ? '#006458' : '#b53a1e';
    } else if (advEl) {
      advEl.textContent = '--';
    }

    // Render station visuals
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

      var pct = st.hasUnit ? Math.min(100, (st.progressTicks / SIM_CYCLE_TICKS) * 100) : 0;

      html += '<div class="' + cls + '">' +
        '<div class="sim-station-label">S' + (i + 1) + '</div>' +
        '<div class="sim-progress"><div class="sim-progress-fill" style="width:' + pct + '%"></div></div>' +
        (!st.isUp ? '<div class="sim-down-icon">!</div>' : '') +
        '</div>';

      // Buffer between stations
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
