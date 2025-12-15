const fs = require('fs');
const path = require('path');

// Keys considered sensitive
const SENSITIVE_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE',
];

const envPath = path.resolve(__dirname, '..', '.env');
const outPath = path.resolve(__dirname, '..', '.env.clean');

if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath);
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);

const filtered = lines.filter((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return true;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return true;
  const key = trimmed.slice(0, idx);
  return !SENSITIVE_KEYS.includes(key);
});

fs.writeFileSync(outPath, filtered.join('\n'));
console.log('Wrote sanitized env to', outPath);
console.log('Review the file and, if desired, replace your .env with it.');
