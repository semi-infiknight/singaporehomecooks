// Generates unique cook phone for Maestro when COOK_MOBILE is not passed.
var mobile = typeof COOK_MOBILE !== 'undefined' ? String(COOK_MOBILE) : '';
if (!mobile || mobile.indexOf('${') === 0) {
  mobile = '9' + String(Date.now()).slice(-7);
}
output.cookMobile = mobile;
