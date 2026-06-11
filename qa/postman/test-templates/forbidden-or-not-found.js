// Template: forbidden-or-not-found
// Applies to: requests against unknown/inaccessible resource IDs.
// This API answers 404 consistently; 403 is accepted for APIs that hide existence.

pm.test("Unknown resource returns 403 or 404", function () {
  pm.expect(pm.response.code).to.be.oneOf([403, 404]);
});

pm.test("Error body uses the standard error shape", function () {
  var body = pm.response.json();
  pm.expect(body).to.have.property("error");
  pm.expect(body.error.code).to.be.a("string");
  pm.expect(body.error.message).to.be.a("string");
  pm.expect(body.error.message.length).to.be.above(0);
});
