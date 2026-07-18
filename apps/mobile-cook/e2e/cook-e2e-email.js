// Generates a unique cook email when COOK_EMAIL is not passed to maestro test -e.
var email = typeof COOK_EMAIL !== 'undefined' ? String(COOK_EMAIL) : '';
if (!email || email.indexOf('${') === 0) {
  email = 'maestro.cook.' + Date.now() + '@shc.local';
}
output.cookEmail = email;