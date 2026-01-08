const jwt = require('jsonwebtoken');

// Apple Sign in with Apple credentials
const teamId = 'GL2ZZV53GJ';
const clientId = 'com.ridiculousstyleshare.app';
const keyId = 'QHJ9Q2MP8N';

const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQggxmCOUFcZwEme0Xp
335gvBKrZdOzSYeVMpoeyYSc1dSgCgYIKoZIzj0DAQehRANCAASW/Z7V3hm3wkZZ
FqUwMo0FpBvykVItI+KCtGIKVj1RtuAOxLyd+j2AL/c1O5Rygbnb442/9fwTtyjY
nUv3AqpG
-----END PRIVATE KEY-----`;

const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '180d',  // 6 months (maximum allowed by Apple)
    audience: 'https://appleid.apple.com',
    issuer: teamId,
    subject: clientId,
    keyid: keyId,
});

console.log('='.repeat(60));
console.log('Apple Client Secret (JWT) - 複製以下內容到 Supabase:');
console.log('='.repeat(60));
console.log(token);
console.log('='.repeat(60));
console.log('\n⚠️ 注意：此 Token 將在 6 個月後過期，届時需要重新產生。');
