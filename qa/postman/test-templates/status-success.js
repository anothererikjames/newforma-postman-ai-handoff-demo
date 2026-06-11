// Template: status-success
// Applies to: every happy-path request.
// Placeholders: __EXPECTED_STATUS__ (e.g. 200, 201)

pm.test("Status code is __EXPECTED_STATUS__", function () {
  pm.response.to.have.status(__EXPECTED_STATUS__);
});

pm.test("Response body is valid JSON", function () {
  pm.response.to.be.json;
});
