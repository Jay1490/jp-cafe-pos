// debug-mongo.js
// Run this inside jay-cafe-backend folder:
//   node debug-mongo.js
// Then share the output so we know exactly what to fix

const dns = require('dns');
const net = require('net');
const https = require('https');

console.log('\n🔍 JAY CAFÉ - MongoDB Debug Tool');
console.log('='.repeat(45));

// ── Test 1: Internet ──────────────────────────────
console.log('\n[1] Testing internet connection...');
https.get('https://www.google.com', (res) => {
  console.log('✅ Internet OK - Google reachable (status:', res.statusCode + ')');
}).on('error', (e) => {
  console.log('❌ NO INTERNET:', e.message);
  console.log('   → Fix your internet connection first');
});

// ── Test 2: DNS SRV lookup ────────────────────────
console.log('[2] Testing MongoDB DNS lookup...');
const SRV = '_mongodb._tcp.jay-cafe-cluster.ey0fcja.mongodb.net';

dns.resolveSrv(SRV, (err, addresses) => {
  if (err) {
    console.log('❌ DNS SRV FAILED (default DNS):', err.message);

    // Try Google DNS
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);
    resolver.resolveSrv(SRV, (err2, addr2) => {
      if (err2) {
        console.log('❌ DNS SRV FAILED (Google DNS too):', err2.message);
        console.log('\n   LIKELY CAUSE: Your Atlas cluster is PAUSED or DELETED');
        console.log('   → Go to MongoDB Atlas → Clusters → Click RESUME if paused');
        console.log('   → Or check if cluster name "jay-cafe-cluster" is correct');
      } else {
        console.log('✅ Google DNS works! Hosts:', addr2.map(a => a.name + ':' + a.port));
        console.log('\n   FIX: Your default DNS is blocking MongoDB');
        console.log('   → Windows: Set DNS to 8.8.8.8 / 8.8.4.4');
        console.log('   → Run: netsh interface ip set dns "Wi-Fi" static 8.8.8.8');
      }
    });

  } else {
    console.log('✅ DNS resolved! Found', addresses.length, 'host(s):');
    addresses.forEach(a => console.log('   -', a.name + ':' + a.port));

    // ── Test 3: TCP port 27017 ──────────────────
    console.log('\n[3] Testing TCP port 27017...');
    const host = addresses[0].name;
    const sock = new net.Socket();
    sock.setTimeout(5000);

    sock.connect(27017, host, () => {
      console.log('✅ PORT 27017 OPEN! MongoDB is reachable');
      console.log('\n   → Connection should work. Check your .env file:');
      console.log('   MONGODB_URI=mongodb+srv://JP:jp149@jay-cafe-cluster.ey0fcja.mongodb.net/jaycafe?retryWrites=true&w=majority');
      sock.destroy();
    });

    sock.on('error', (e) => {
      console.log('❌ PORT 27017 BLOCKED:', e.message);
      console.log('\n   CAUSE: Your ISP/router blocks port 27017');
      console.log('   FIX OPTIONS:');
      console.log('   1. Use mobile hotspot instead of WiFi');
      console.log('   2. Use the TLS port fix below');
      sock.destroy();
    });

    sock.on('timeout', () => {
      console.log('❌ PORT 27017 TIMEOUT - ISP is blocking it');
      console.log('\n   FIX: See TLS port fix below');
      sock.destroy();
    });
  }
});

// ── Test 4: Atlas website ─────────────────────────
console.log('[4] Testing MongoDB Atlas website...');
https.get('https://cloud.mongodb.com', (res) => {
  console.log('✅ Atlas website reachable');
}).on('error', (e) => {
  console.log('❌ Cannot reach Atlas website:', e.message);
});

// ── Test 5: Check .env exists ─────────────────────
console.log('[5] Checking .env file...');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const hasUri = content.includes('MONGODB_URI');
  const hasJwt = content.includes('JWT_SECRET');
  console.log('✅ .env file exists');
  console.log('   MONGODB_URI present:', hasUri ? '✅' : '❌ MISSING!');
  console.log('   JWT_SECRET present:', hasJwt ? '✅' : '❌ MISSING!');
  if (hasUri) {
    const line = content.split('\n').find(l => l.startsWith('MONGODB_URI'));
    console.log('   URI value:', line?.substring(0, 60) + '...');
  }
} else {
  console.log('❌ .env FILE NOT FOUND in:', envPath);
  console.log('   → Create .env file in jay-cafe-backend folder!');
}

// ── Summary ───────────────────────────────────────
setTimeout(() => {
  console.log('\n' + '='.repeat(45));
  console.log('✅ Debug complete! Share the output above.');
  console.log('='.repeat(45) + '\n');
}, 7000);
