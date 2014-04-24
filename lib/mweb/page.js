var path = require('path');
var merge = require('merge');

var internals = {};

internals.Page = function(browser) {

	this._browser = browser;
};

internals.Page.prototype.screenshot = function(fpath, fname) {
	this._browser.takeScreenshot(path.join(fpath, fname));
	return this;
};

internals.Page.prototype.consoleLog = function(logType){
	return this._browser.getConsoleLogs(logType);
};

exports.Page = internals.Page;