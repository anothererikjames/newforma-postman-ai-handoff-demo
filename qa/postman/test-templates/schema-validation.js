// Template: schema-validation
// Applies to: happy-path requests with a known response shape.
// Placeholders: __REQUIRED_FIELDS__ (JSON array of top-level field names)

pm.test("Response body contains all expected fields", function () {
  var body = pm.response.json();
  var requiredFields = __REQUIRED_FIELDS__;
  requiredFields.forEach(function (field) {
    pm.expect(body, "missing field: " + field).to.have.property(field);
  });
});
