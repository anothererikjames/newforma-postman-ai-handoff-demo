// Template: response-time
// Applies to: every request.
// Placeholders: __MAX_RESPONSE_MS__ (from qa/postman/test-policy.json)

pm.test("Response time is below __MAX_RESPONSE_MS__ ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(__MAX_RESPONSE_MS__);
});
