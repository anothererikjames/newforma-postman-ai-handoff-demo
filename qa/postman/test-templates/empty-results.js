// Template: empty-results
// Applies to: search endpoints — a query with no matches is a SUCCESS case.

pm.test("Search with no matches returns 200 (not 404)", function () {
  pm.response.to.have.status(200);
});

pm.test("Results array is empty and total is 0", function () {
  var body = pm.response.json();
  pm.expect(body.results).to.be.an("array");
  pm.expect(body.results.length).to.eql(0);
  pm.expect(body.total).to.eql(0);
});
