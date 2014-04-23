var path = require('path');
var merge = require('merge');

var internals = {};

internals.Page = function(browser, dependencies) {

	this._browser = browser;
	this._dependencies = dependencies;
	/*
		options = {
			screenshot: {
				path: 'screenshot path from repo base dir',
				name: 'screenshot file name'
			}
		}Ï
	*/
};

internals.Page.prototype.setDependency = function(dep) {

	if (!this._dependencies) {
		this._dependencies = {};
	}
	this._dependencies = merge(this._dependencies, dep)
};

internals.Page.prototype.call = function(args) {

	var injections = extras = callback = null;
	if (!args) {
		return null;
	} else {
		switch (args.length) {
			case 1:
				injections = args[0];
				break;
			case 2:
				injections = args[0];
				if (typeof args[1] === 'function') {
					// no extra, second param is callback instead
					callback = args[1];
					extras = null;
				} else {
					extras = args[1];
				}
				break;
			case 3:
				injections = args[0];
				extras = args[1];
				callback = args[2];
				break;
			default:
				break;
		}

		if (injections) {
			if (this._dependencies === undefined) {
				throw new Error('No dependencies initialized, please inject dependencies from constructor');
			}
			// needs to support both array params and single call
			var results = null;
			if (typeof injections === 'string') {
				// single injection
				results = this._inject(injections, this._dependencies[injections], extras);
			} else {
				// array call
				results = [];

				for (i in injections) {
					results.push(this._inject(injections[i], this._dependencies[injections[i]], extras));
				}
			}

			if (callback) {
				callback(results);
			} else {
				return results;
			}
		}
	}

};

// private method

internals.Page.prototype._inject = function(func, depArgs, runArgs) {

	if (this[func] && typeof this[func] === 'function') {
		return this[func](depArgs, runArgs);
	}
};

/* ---------- begin: method supported by dependencies injection */

internals.Page.prototype.screenshot = function(depArgs, runArgs) {

	// in screenshot extras is used for file name
	var filename = runArgs ? runArgs : "default_error";

	if (this._dependencies && this._dependencies.screenshot) {
		// enable screenshot for all cases
		return this._browser.takeScreenshot(path.join(depArgs.path, filename));
	} else {
		throw new Error('No dependencies declared or dependencies name declared don\'t match with screenshot');
	}
};

/* ---------- end */

exports.Page = internals.Page;