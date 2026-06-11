// Template: auth-required
// Applies to: the "missing auth" negative request of every authenticated endpoint.

pm.test("Request without a valid bearer token is rejected with 401", function () {
  pm.response.to.have.status(401);
});

pm.test("401 body uses the standard error shape with code UNAUTHORIZED", function () {
  var body = pm.response.json();
  pm.expect(body).to.have.property("error");
  pm.expect(body.error).to.have.property("code", "UNAUTHORIZED");
  pm.expect(body.error.message).to.be.a("string");
  pm.expect(body.error.message.length).to.be.above(0);
});
