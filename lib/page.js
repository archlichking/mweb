var path = require('path');
var merge = require('merge');
var inject = require('./injection').inject;

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

internals.Page.prototype.call = function(injections, callback) {
	// needs to support both array params and single call
	var results = null;
	if (injections) {
		if (typeof injections === 'string') {
			// single injection
			results = this._inject(injections[i], this._dependencies[injections[i]]);
		} else {
			// array call
			results = [];

			for (i in injections) {
				results.push(this._inject(injections[i], this._dependencies[injections[i]]));
			}
		}
	}

	if (callback) {
		callback(results);
	}else{
		return results;
	}
};

internals.Page.prototype.screenshot = function(args) {
	if (this._dependencies) {
		if (this._dependencies.screenshot) {
			// enable screenshot for all cases
			return this._browser.takeScreenshot(path.join(args.path, args.name));
		}
	}
};

// private method

internals.Page.prototype._inject = function(fun, args) {

	if (this[fun] && typeof this[fun] === 'function') {
		return this[fun](args);
	}
};

exports.Page = internals.Page;