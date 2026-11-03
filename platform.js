/* =========================================================================
   PLATFORM ABSTRACTION LAYER
   Detects environment (Electron / Browser / Native Linux SBC)
   and provides unified APIs for system info, fullscreen, and persistence.
   ========================================================================= */
const Platform = (() => {
  let _type = 'browser';    // 'electron' | 'browser' | 'native'
  let _apiBase = '';         // For native: http://localhost:PORT
  let _systemInfo = null;
  let _pollingInterval = null;

  // Detect runtime environment
  function detect() {
    if (typeof window !== 'undefined' && window.process && window.process.type) {
      _type = 'electron';
    } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      _type = 'native';
    } else {
      _type = 'browser';
    }
    return _type;
  }

  // Check if server.js API is reachable (Pi / Orange Pi mode)
  async function probeServer() {
    try {
      const res = await fetch('/api/system', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data.platform) {
          _type = 'native';
          return true;
        }
      }
    } catch (_) { /* no server */ }
    return false;
  }

  // Initialize platform detection
  async function init() {
    detect();
    // Even if detected as browser, check for local server (Pi deployment)
    if (_type === 'browser') {
      await probeServer();
    }
    return _type;
  }

  // ── SYSTEM INFO ──────────────────────────────────────────────────────
  // Returns: { ip, wifi, cpuTemp, uptime, cpuUsage, ram, swap, disk, processes, hostname, kernel }
  async function getSystemInfo() {
    if (_type === 'electron') {
      return getSystemInfoElectron();
    } else if (_type === 'native') {
      return getSystemInfoFromServer();
    } else {
      return getSystemInfoMock();
    }
  }

  async function getSystemInfoFromServer() {
    try {
      const res = await fetch('/api/system');
      if (res.ok) {
        _systemInfo = await res.json();
        return _systemInfo;
      }
    } catch (_) {}
    return getSystemInfoMock();
  }

  function getSystemInfoElectron() {
    try {
      const os = require('os');
      const nets = os.networkInterfaces();
      let ip = '127.0.0.1';
      let wifi = 'UNKNOWN';
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            ip = net.address;
            wifi = name;
            break;
          }
        }
      }
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const uptime = os.uptime();

      return {
        platform: 'electron',
        ip,
        wifi,
        hostname: os.hostname(),
        kernel: `${os.type()} ${os.release()}`,
        cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
        cpuCores: cpus.length,
        cpuUsage: Math.min(100, Math.round((loadAvg[0] / cpus.length) * 100)),
        cpuTemp: null,
        ram: { used: Math.round(usedMem / 1048576), total: Math.round(totalMem / 1048576) },
        swap: null,
        disk: null,
        uptime: formatUptime(uptime),
        processes: []
      };
    } catch (_) {
      return getSystemInfoMock();
    }
  }

  function getSystemInfoMock() {
    return {
      platform: 'mock',
      ip: '192.168.1.137',
      wifi: 'COLD_NET_5G',
      hostname: 'colmeia-deck',
      kernel: 'Linux 5.10.103-v8-cyberdeck',
      cpuModel: 'Broadcom BCM2711 @ 1.8GHz',
      cpuCores: 4,
      cpuUsage: Math.floor(Math.random() * 60) + 10,
      cpuTemp: (38.0 + Math.random() * 4).toFixed(1),
      ram: { used: Math.floor(Math.random() * 500) + 3600, total: 8192 },
      swap: { used: 256, total: 4096 },
      disk: { used: 12.4, total: 64 },
      uptime: '0m 0s',
      processes: [
        { pid: 101, name: 'systemd', cpu: 0.1, mem: 0.1 },
        { pid: 1420, name: 'colmeia-core', cpu: (Math.random()*2+1).toFixed(1), mem: 4.2 },
        { pid: 1512, name: 'xorg-server', cpu: (Math.random()*4+2).toFixed(1), mem: 2.8 },
        { pid: 2011, name: 'tarot-synth', cpu: (Math.random()*15).toFixed(1), mem: 5.4 },
        { pid: 2133, name: 'matrix-rain', cpu: (Math.random()*8).toFixed(1), mem: 1.2 },
        { pid: 3201, name: 'netwatch-defense', cpu: 0.2, mem: 0.8 }
      ]
    };
  }

  function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  // ── FULLSCREEN ───────────────────────────────────────────────────────
  async function toggleFullscreen() {
    if (_type === 'electron') {
      try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('toggle-fullscreen');
      } catch (_) {}
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {});
      } else {
        await document.exitFullscreen().catch(() => {});
      }
    }
  }

  // ── REBOOT / SHUTDOWN ────────────────────────────────────────────────
  function reboot() {
    if (_type === 'electron') {
      try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('reboot-app');
      } catch (_) { location.reload(); }
    } else if (_type === 'native') {
      fetch('/api/reboot', { method: 'POST' }).catch(() => location.reload());
    } else {
      location.reload();
    }
  }

  function shutdown() {
    if (_type === 'electron') {
      try {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('shutdown-app');
      } catch (_) { window.close(); }
    } else if (_type === 'native') {
      fetch('/api/shutdown', { method: 'POST' }).catch(() => window.close());
    } else {
      window.close();
    }
  }

  // ── TERMINAL (execute command on native) ─────────────────────────────
  async function execCommand(cmd) {
    if (_type === 'native') {
      try {
        const res = await fetch('/api/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        if (res.ok) {
          const data = await res.json();
          return data.output || '';
        }
      } catch (_) {}
    }
    return null; // Not available in browser/electron
  }

  // ── PERSISTENCE (localStorage with fallback) ─────────────────────────
  function save(key, value) {
    try {
      localStorage.setItem('colmeia_' + key, JSON.stringify(value));
    } catch (_) {}
  }

  function load(key, defaultValue) {
    try {
      const raw = localStorage.getItem('colmeia_' + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (_) {
      return defaultValue;
    }
  }

  function clearAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('colmeia_')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────
  return {
    init,
    detect,
    getType: () => _type,
    isElectron: () => _type === 'electron',
    isNative: () => _type === 'native',
    isBrowser: () => _type === 'browser',
    getSystemInfo,
    execCommand,
    toggleFullscreen,
    reboot,
    shutdown,
    save,
    load,
    clearAll,
    formatUptime
  };
})();
