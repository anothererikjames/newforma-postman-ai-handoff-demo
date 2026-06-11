// Template: create-resource
// Applies to: happy-path create (POST) requests.
// Placeholders: __ID_FIELD__, __ID_PREFIX__, __REQUIRED_FIELDS__, __SAVE_AS_VARIABLE__

pm.test("Resource is created with status 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Created resource has an ID with the expected prefix", function () {
  var body = pm.response.json();
  pm.expect(body.__ID_FIELD__).to.be.a("string");
  pm.expect(body.__ID_FIELD__.indexOf("__ID_PREFIX__")).to.eql(0);
});

pm.test("Created resource contains the expected fields", function () {
  var body = pm.response.json();
  var requiredFields = __REQUIRED_FIELDS__;
  requiredFields.forEach(function (field) {
    pm.expect(body, "missing field: " + field).to.have.property(field);
  });
});

// Save the new ID so follow-up requests in the run can use it.
pm.collectionVariables.set("__SAVE_AS_VARIABLE__", pm.response.json().__ID_FIELD__);
