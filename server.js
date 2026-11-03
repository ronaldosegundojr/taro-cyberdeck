/* =========================================================================
   COLMEIA OS — Lightweight HTTP Server for Raspberry Pi / Orange Pi
   Serves static files + provides system info API endpoints.
   
   Usage:
     node server.js              (default port 3000)
     PORT=8080 node server.js    (custom port)
   
   On Pi, run at boot with:
     node /path/to/server.js &
   ========================================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = __dirname;

// ── MIME TYPES ──────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2'
};

// ── HELPERS ─────────────────────────────────────────────────────────────
function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 3000 }).trim();
  } catch (_) {
    return null;
  }
}

function getCpuTemp() {
  // Raspberry Pi
  let t = safeExec('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null');
  if (t) return (parseInt(t, 10) / 1000).toFixed(1);
  // Orange Pi / Allwinner
  t = safeExec('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null');
  if (t) {
    const val = parseInt(t, 10);
    return (val > 1000 ? val / 1000 : val).toFixed(1);
  }
  // Generic Linux
  t = safeExec('sensors 2>/dev/null | grep -m1 "Core 0" | awk \'{print $3}\'');
  if (t) return t.replace('+', '').replace('°C', '').trim();
  return null;
}

function getCpuUsage() {
  const load = os.loadavg();
  const cores = os.cpus().length;
  return Math.min(100, Math.round((load[0] / cores) * 100));
}

function getNetworkInfo() {
  const nets = os.networkInterfaces();
  let ip = '127.0.0.1';
  let iface = 'lo';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ip = net.address;
        iface = name;
        break;
      }
    }
  }
  return { ip, iface };
}

function getProcesses() {
  const out = safeExec('ps aux --sort=-%cpu 2>/dev/null | head -11 | tail -10');
  if (!out) return [];
  return out.split('\n').filter(Boolean).map(line => {
    const parts = line.split(/\s+/);
    return {
      pid: parseInt(parts[1], 10),
      name: parts[10] || 'unknown',
      cpu: parseFloat(parts[2]) || 0,
      mem: parseFloat(parts[3]) || 0
    };
  });
}

function getDiskInfo() {
  const out = safeExec("df -BM / 2>/dev/null | tail -1 | awk '{print $2,$3,$5}'");
  if (!out) return null;
  const [total, used, pct] = out.split(/\s+/);
  return {
    total: parseInt(total, 10),
    used: parseInt(used, 10),
    percent: parseInt(pct, 10)
  };
}

function getSwapInfo() {
  const out = safeExec("free -m 2>/dev/null | grep Swap | awk '{print $2,$3}'");
  if (!out) return null;
  const [total, used] = out.split(/\s+/);
  return { total: parseInt(total, 10), used: parseInt(used, 10) };
}

function getUptime() {
  const secs = os.uptime();
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function getWifiName() {
  // Try iwgetid
  let name = safeExec('iwgetid -r 2>/dev/null');
  if (name) return name;
  // Try reading from NetworkManager
  name = safeExec("nmcli -t -f active,ssid dev wifi 2>/dev/null | grep '^yes:' | cut -d: -f2");
  if (name) return name;
  // Fallback to interface name
  const nets = os.networkInterfaces();
  for (const n of Object.keys(nets)) {
    if (n !== 'lo' && !n.startsWith('docker') && !n.startsWith('br-')) return n.toUpperCase();
  }
  return 'UNKNOWN';
}

// ── BUILD SYSTEM INFO PAYLOAD ───────────────────────────────────────────
function buildSystemInfo() {
  const net = getNetworkInfo();
  const cpus = os.cpus();
  return {
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
    kernel: `${os.type()} ${os.release()}`,
    cpuModel: cpus.length > 0 ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length,
    cpuUsage: getCpuUsage(),
    cpuTemp: getCpuTemp(),
    ip: net.ip,
    wifi: getWifiName(),
    ram: {
      used: Math.round((os.totalmem() - os.freemem()) / 1048576),
      total: Math.round(os.totalmem() / 1048576)
    },
    swap: getSwapInfo(),
    disk: getDiskInfo(),
    uptime: getUptime(),
    processes: getProcesses(),
    nodeVersion: process.version
  };
}

// ── REQUEST HANDLER ─────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ── API ROUTES ──────────────────────────────────────────────────────
  if (pathname === '/api/system' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(buildSystemInfo()));
    return;
  }

  if (pathname === '/api/exec' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { command } = JSON.parse(body);
        if (!command || typeof command !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid command' }));
          return;
        }
        // Basic safety: block dangerous commands
        const blocked = ['rm -rf', 'mkfs', 'dd if=', ':(){', 'shutdown', 'reboot', 'init 0', 'init 6'];
        if (blocked.some(b => command.toLowerCase().includes(b))) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command blocked for safety' }));
          return;
        }
        const output = safeExec(command);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ output: output || '' }));
      } catch (_) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Execution failed' }));
      }
    });
    return;
  }

  if (pathname === '/api/reboot' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'rebooting' }));
    setTimeout(() => safeExec('sudo reboot'), 500);
    return;
  }

  if (pathname === '/api/shutdown' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'shutting down' }));
    setTimeout(() => safeExec('sudo shutdown -h now'), 500);
    return;
  }

  // ── STATIC FILE SERVING ─────────────────────────────────────────────
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(ROOT, path.normalize(filePath));

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const net = getNetworkInfo();
  console.log(`
╔══════════════════════════════════════════════════╗
║         COLMEIA OS — SERVER ONLINE               ║
╠══════════════════════════════════════════════════╣
║  Local:   http://localhost:${PORT}                  ║
║  Network: http://${net.ip}:${PORT}            ║
║  Host:    ${os.hostname().padEnd(38)}║
║  Node:    ${process.version.padEnd(38)}║
╚══════════════════════════════════════════════════╝
`);
});
