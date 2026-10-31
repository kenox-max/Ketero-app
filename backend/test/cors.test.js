const assert = require('assert');
const { isAllowedCorsOrigin } = require('../middleware/corsOrigin');

const configured = ['https://ketero.et', 'http://localhost:8081'];

assert.equal(isAllowedCorsOrigin(undefined, configured), true, 'native requests without Origin remain supported');
assert.equal(isAllowedCorsOrigin('http://localhost:8081', configured), true, 'configured local frontend is allowed');
assert.equal(isAllowedCorsOrigin('https://ketero-app.vercel.app', configured), true, 'production Vercel domain is allowed');
assert.equal(isAllowedCorsOrigin('https://ketero-app-git-main-niko-b20b.vercel.app', configured), true, 'Ketero Vercel preview domains are allowed');
assert.equal(isAllowedCorsOrigin('https://unrelated-app.vercel.app', configured), false, 'unrelated Vercel projects are rejected');
assert.equal(isAllowedCorsOrigin('http://ketero-app-preview.vercel.app', configured), false, 'insecure Vercel origins are rejected');

process.stdout.write('CORS origin checks passed.\n');
