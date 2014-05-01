var path = require('path');
var merge = require('merge');

var internals = {};

internals.Page = function(browser) {

	this._browser = browser;
};

internals.Page.prototype.screenshot = function(DepArg, RunArg) {
	var params = merge(DepArg, RunArg);
	// console.log(path.join(params.path, params.name));
	this._browser.takeScreenshot(path.join(params.path, params.name));
	return this;
};

internals.Page.prototype.consoleLog = function(logType){
	return this._browser.getConsoleLogs(logType);
};

internals.Page.prototype.setDependencyParam = function(params){
	this._currentStepParams = params;
	return this;
};

internals.Page.prototype.callDependencies = function(dependencies){
	for(d in dependencies){
		if(dependencies[d] && typeof this[d] == 'function'){
			// call
			this[d](dependencies[d], this._currentStepParams);
		}
	}
};

exports.Page = internals.Page;