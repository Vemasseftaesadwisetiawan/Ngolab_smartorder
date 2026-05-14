try {
  const native = require('lightningcss-win32-x64-msvc');
  console.log('Success:', native);
} catch (e) {
  console.error('Error requiring lightningcss-win32-x64-msvc:');
  console.error(e);
}
