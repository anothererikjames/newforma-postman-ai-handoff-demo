// Template: validation-error
// Applies to: the "malformed body" negative request of endpoints that accept a JSON body.

pm.test("Malformed request body is rejected with 400", function () {
  pm.response.to.have.status(400);
});

pm.test("400 body has code VALIDATION_ERROR and field-level details", function () {
  var body = pm.response.json();
  pm.expect(body).to.have.property("error");
  pm.expect(body.error).to.have.property("code", "VALIDATION_ERROR");
  pm.expect(body.error.details).to.be.an("array");
  pm.expect(body.error.details.length).to.be.above(0);
  body.error.details.forEach(function (detail) {
    pm.expect(detail).to.have.property("field");
    pm.expect(detail).to.have.property("message");
  });
});
