var test = require('selenium-webdriver/testing');
var chai = require('chai');
var path = require('path');
var chaiWebdriver = require('chai-webdriver');
var config = require('config');

var b = require('../lib').Browser;
var bn = require('../lib').BROWSER_NAME;
var bl = require('../lib').BROWSER_LOG;
var expect = chai.expect;

test.describe('unit test for mweb.js', function() {
	var browser = null;
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

		test.it('and removed correctly', function(){
			browser.deleteCookie('key');
			browser.getCookie('key').then(function(cookie) {
				expect(cookie).to.equal(null);
			});
		});

		test.it("console log should be enabled correctly", function(){
			// google.com should contain no console logs
			browser.getConsoleLogs(bl.CONSOLE_BROWSER).then(function(logs){
				expect(logs.toString()).to.equal([].toString());
			});
		});
	});

});