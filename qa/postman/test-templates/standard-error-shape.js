// Template: standard-error-shape
// Applies to: every request. On non-error responses this passes trivially;
// on 4xx/5xx it enforces the consistent { error: { code, message } } shape.

pm.test("Any error response uses the standard error shape", function () {
  if (pm.response.code < 400) {
    pm.expect(pm.response.code).to.be.below(400);
    return;
  }
  var body = pm.response.json();
  pm.expect(body).to.have.property("error");
  pm.expect(body.error.code).to.be.a("string");
  pm.expect(body.error.code.length).to.be.above(0);
  pm.expect(body.error.message).to.be.a("string");
  pm.expect(body.error.message.length).to.be.above(0);
});
