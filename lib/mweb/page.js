var path = require('path');
var merge = require('merge');

var internals = {};

internals.Page = function(browser) {

	this._browser = browser;
};

internals.Page.prototype.screenshot = function(fpath, fname) {
	return this._browser.takeScreenshot(path.join(fpath, fname));
};

/* ---------- end */

exports.Page = internals.Page;