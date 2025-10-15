/*
 Lightweight memory + event-loop monitor for Node.js
 - Uses built-in APIs where possible
 - Optional heap snapshot on threshold (requires heapdump package if enabled)
 - Minimal config: set env vars to enable/threshold values

 Usage: node src/utils/mem-monitor.js
 Meant to be run alongside your app (in a separate process) or required into your app during dev.
*/

const fs = require('fs');
const path = require('path');

const pid = process.pid;
const CHECK_INTERVAL_MS = parseInt(process.env.MEM_MONITOR_INTERVAL_MS || '10000', 10); // 10s default
const HEAP_BYTES_THRESHOLD = parseInt(process.env.MEM_MONITOR_HEAP_BYTES || '0', 10); // 0 = disabled
const RSS_BYTES_THRESHOLD = parseInt(process.env.MEM_MONITOR_RSS_BYTES || '0', 10); // 0 = disabled
const EVENT_LOOP_LAG_THRESHOLD_MS = parseInt(process.env.MEM_MONITOR_EVENT_LOOP_LAG_MS || '200', 10); // 200ms
const ENABLE_HEAPDUMP = process.env.MEM_MONITOR_ENABLE_HEAPDUMP === '1';

let heapdump;
if (ENABLE_HEAPDUMP) {
  try {
    heapdump = require('heapdump');
  } catch (err) {
    console.warn('heapdump not installed; heap snapshots disabled. To enable install heapdump package');
  }
}

function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function takeHeapSnapshot(tag = 'snapshot') {
  if (!heapdump) return;
  const filename = path.join(process.cwd(), `heap-${tag}-${Date.now()}.heapsnapshot`);
  console.log(`Writing heap snapshot to ${filename}`);
  return new Promise((resolve, reject) => {
    heapdump.writeSnapshot(filename, (err, filename) => {
      if (err) return reject(err);
      resolve(filename);
    });
  });
}

function checkMemory() {
  const mem = process.memoryUsage();
  const rss = mem.rss;
  const heapTotal = mem.heapTotal;
  const heapUsed = mem.heapUsed;

  console.log(`[mem-monitor] pid=${pid} rss=${bytesToMB(rss)} heapUsed=${bytesToMB(heapUsed)} heapTotal=${bytesToMB(heapTotal)}`);

  if (RSS_BYTES_THRESHOLD > 0 && rss > RSS_BYTES_THRESHOLD) {
    console.warn(`[mem-monitor] RSS threshold exceeded: ${bytesToMB(rss)} > ${bytesToMB(RSS_BYTES_THRESHOLD)}`);
    if (ENABLE_HEAPDUMP) takeHeapSnapshot('rss');
  }

  if (HEAP_BYTES_THRESHOLD > 0 && heapUsed > HEAP_BYTES_THRESHOLD) {
    console.warn(`[mem-monitor] heapUsed threshold exceeded: ${bytesToMB(heapUsed)} > ${bytesToMB(HEAP_BYTES_THRESHOLD)}`);
    if (ENABLE_HEAPDUMP) takeHeapSnapshot('heapused');
  }
}

// Simple event-loop lag measurement
let lastTime = Date.now();
function checkEventLoopLag() {
  const start = process.hrtime.bigint();
  setTimeout(() => {
    const end = process.hrtime.bigint();
    const deltaMs = Number(end - start) / 1000000.0;
    const lag = deltaMs - (CHECK_INTERVAL_MS);
    // deltaMs should be close to CHECK_INTERVAL_MS; calculate observed timeout overshoot
    const observed = deltaMs - (0);
    if (observed > EVENT_LOOP_LAG_THRESHOLD_MS) {
      console.warn(`[mem-monitor] event-loop lag detected: ${observed.toFixed(2)}ms`);
      if (ENABLE_HEAPDUMP) takeHeapSnapshot('evlooplag');
    }
  }, CHECK_INTERVAL_MS);
}

console.log('Starting mem-monitor (interval:', CHECK_INTERVAL_MS, 'ms)');

// Start periodic checks
setInterval(() => {
  checkMemory();
  checkEventLoopLag();
}, CHECK_INTERVAL_MS);

// Also listen for uncaughtException/UnhandledRejection to create snapshot
process.on('uncaughtException', (err) => {
  console.error('mem-monitor caught uncaughtException', err);
  if (ENABLE_HEAPDUMP) takeHeapSnapshot('uncaught');
  // do not exit here; this script is a monitor
});

process.on('unhandledRejection', (err) => {
  console.error('mem-monitor caught unhandledRejection', err);
  if (ENABLE_HEAPDUMP) takeHeapSnapshot('unhandledrejection');
});

// Keep process alive
process.stdin.resume();
