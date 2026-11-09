const fs = require('fs');
const logoBuf = fs.readFileSync('public/logo.png');
const b64 = logoBuf.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="500" viewBox="0 0 500 500">
  <image width="500" height="500" href="data:image/png;base64,${b64}" />
</svg>
`;
fs.writeFileSync('public/favicon.svg', svg, 'utf8');
console.log('Successfully updated public/favicon.svg with base64 of public/logo.png');
