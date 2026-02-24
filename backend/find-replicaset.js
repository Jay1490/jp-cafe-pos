// find-replicaset.js
// Run: node find-replicaset.js
// This finds your Atlas replica set name so we can connect directly

const tls = require('tls');
const dns = require('dns');

console.log('\n🔍 Finding Atlas Replica Set Name...\n');

// We already know these hosts from debug output
const hosts = [
  'ac-qvermaw-shard-00-00.ey0fcja.mongodb.net',
  'ac-qvermaw-shard-00-01.ey0fcja.mongodb.net',
  'ac-qvermaw-shard-00-02.ey0fcja.mongodb.net',
];

// Try to resolve each host IP directly
let resolved = 0;
hosts.forEach(host => {
  dns.resolve4(host, (err, ips) => {
    if (err) {
      console.log(`❌ ${host} → DNS failed: ${err.message}`);
    } else {
      console.log(`✅ ${host} → ${ips.join(', ')}`);
    }
    resolved++;
    if (resolved === hosts.length) {
      console.log('\n📋 Copy the .env below and replace your current .env:\n');
      console.log('─'.repeat(60));
      console.log(`MONGODB_URI=mongodb://JP:jp149@${hosts.join(':27017,')}:27017/jaycafe?ssl=true&authSource=admin&retryWrites=true&w=majority`);
      console.log('─'.repeat(60));
      console.log('\nJWT_SECRET=jaycafe_super_secret_jwt_key_2024_xK9mP3qR');
      console.log('PORT=5000');
      console.log('FRONTEND_URL=http://localhost:5173');
      console.log('NODE_ENV=development');
      console.log('\n✅ Copy everything between the lines into your .env file');
      console.log('Then run: node server.js\n');
    }
  });
});
