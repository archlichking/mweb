var test = require('selenium-webdriver/testing');

var internals = {};

internals.Testing = {
	describe: test.describe,
	xdescribe: test.xdescribe,
	// describe.skip: test.describe.skip,
	after: test.after,
	afterEach: test.afterEach,
	before: test.before,
	beforeEach: test.beforeEach,
	it: test.it,
	iit: test.iit,
	xit: test.xit,
	ignore: test.ignore
};

exports.Testing = internals.Testing;