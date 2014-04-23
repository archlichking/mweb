var test = require('selenium-webdriver/testing');
var chai = require('chai');
var path = require('path');
var util = require('util');
var chaiWebdriver = require('chai-webdriver');
var config = require('config');

var b = require('../lib').Browser;
var bn = require('../lib').BROWSER_NAME;
var bl = require('../lib').BROWSER_LOG;
var page = require('../lib').Page;
var expect = chai.expect;

test.describe('unit test for mweb.js', function() {
	var browser = null;
	test.describe('browser.js', function() {
		test.it('BROWSER_NAME should be exported correctly', function() {

			expect(bn.CHROME).to.equal("chrome");
			expect(bn.PHANTOMJS).to.equal("phantomjs");
			expect(bn.FIREFOX).to.equal("firefox");
		});

		test.describe('config should read correctly', function() {

			beforeEach(function() {

			});

			afterEach(function(done) {
				browser.close().then(done);
			});

			test.it('default config.json should read correctly', function() {

				browser = new b(config);

				expect(browser.config.host).to.equal(config.host);
				expect(browser.config.browser.name).to.equal(config.browser.name);
				expect(browser.config.timeout).to.equal(config.timeout);
			});

		});

		test.describe('functional wrapper should work correctly', function() {

			before(function() {

				browser = new b(config);
				browser.get(config.host);
				chai.use(chaiWebdriver(browser.getDriver()));
			});

			after(function(done) {
				browser.close().then(done);
			});

			test.it('cookie should be added correctly', function() {
				var date = new Date(2016, 1, 1, 1, 1, 1, 1);

				browser.addCookie('key', 'value', '/', '.google.com', false, date);
				browser.getCookie('key').then(function(cookie) {
					expect(cookie.name).to.equal('key');
					expect(cookie.domain).to.equal('.google.com');
				});
			});

			test.it('and removed correctly', function() {
				browser.deleteCookie('key');
				browser.getCookie('key').then(function(cookie) {
					expect(cookie).to.equal(null);
				});
			});

			test.it("console log should be enabled correctly", function() {
				// google.com should contain no console logs
				browser.getConsoleLogs(bl.CONSOLE_BROWSER).then(function(logs) {
					expect(logs.toString()).to.equal([].toString());
				});
			});
		});
	});

	test.describe('page.js', function() {
		var Home = function(browser, dependencies) {
			this._browser = browser;
			this._dependencies = dependencies;

			this.helloworld = function() {
				// do something here
				return this.call(arguments);
			};
		};

		before(function() {
			util.inherits(Home, page);
		});

		test.it('page.js inheritance should work correctly', function() {
			var homePage = new Home('browser', 'dependencies');

			expect(homePage).to.be.an.instanceof(Home);
			expect(homePage).to.be.an.instanceof(page);
			expect(homePage.screenshot).to.exist;
			expect(homePage.setDependency).to.exist;
		});

		test.it('and methods inherited from page.js should work correctly', function() {
			// no default option
			var homePage = new Home('browser');
			homePage.setDependency({
				"key": "value"
			});
			expect(homePage._dependencies.key).to.equal("value");

			// one level option
			homePage = new Home('browser', {
				"key": "value"
			});
			homePage.setDependency({
				"key": "value2"
			});
			expect(homePage._dependencies.key).to.equal("value2");

			// two levels option
			homePage = new Home('browser', {
				"key": "value",
				"key2": {
					"in-key": "in-value"
				}
			});
			homePage.setDependency({
				"key2": {
					"in-key": "in-value2"
				}
			});
			expect(homePage._dependencies["key2"]["in-key"]).to.equal("in-value2");
		});

		test.describe('dependency injection should work correctly for page.js', function() {
			test.it('page initialized without dependencies should work correctly', function() {
				var homePage = new Home('browser');
				homePage.helloworld();
			});

			test.it('page initialized with dependencies should work correctly', function() {
				var dependency = {
					screenshot: {
						path: 'this is the screenshot path'
					}
				};

				var homePage = new Home('browser', dependency);
				homePage.helloworld();
			});

			test.it('method injection without callback should work correctly', function() {
				var dependency = {
					screenshot: {
						path: 'this is the screenshot path'
					}
				};

				var homePage = new Home('browser', dependency);

				homePage.screenshot = function(depArgs, runArgs) {
					return [depArgs.path, runArgs];
				}

				var results = homePage.helloworld('screenshot');
				expect(results.length).to.equal(2);
				expect(results[0]).to.equal(dependency.screenshot.path);

				var results = homePage.helloworld('screenshot', 'hehehehehe');
				expect(results.length).to.equal(2);
				expect(results[0]).to.equal(dependency.screenshot.path);
				expect(results[1]).to.equal('hehehehehe');
			});

			test.it('method injection with callback should work correctly', function() {
				var dependency = {
					screenshot: {
						path: 'this is the screenshot path'
					}
				};

				var homePage = new Home('browser', dependency);

				homePage.screenshot = function(depArgs, runArgs) {
					return [depArgs.path, runArgs];
				}

				homePage.helloworld(['screenshot'], 'hehehehehe', function(results) {
					expect(results.length).to.equal(1);
					expect(results[0][0]).to.equal(dependency.screenshot.path);
					expect(results[0][1]).to.equal('hehehehehe');
				});
			});
		});
	});
});