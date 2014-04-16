var webdriver = require('selenium-webdriver');
var proxy = require('selenium-webdriver/proxy');
var fs = require('fs');

var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var seleniumServerJar = require('selenium-server-standalone-jar');

var internals = {};

internals.BROWSER_NAME = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    PHANTOMJS: 'phantomjs'
};

internals.BROWSER_LOG = {
    CONSOLE_DRIVER: 'driver',
    CONSOLE_BROWSER: 'browser'
};

internals.Browser = function(config) {
    
    this.config = config ? config : require('config');
    
    this.host = this.config.host;
    this.timeout = this.config.timeout ? this.config.timeout : 80000;

    this._server = new SeleniumServer(seleniumServerJar.path, {
        port: 4444
    });

    this._capacities = this.config.getOriginalConfig().browser;

    switch (this.config.browser.name.toLowerCase()) {
        case internals.BROWSER_NAME.CHROME:

            // don't have to start selenium server for chrome
            this.name = internals.BROWSER_NAME.CHROME;
            this._capacities.webdriverCaps = new webdriver.Capabilities.chrome();
            break;
        case internals.BROWSER_NAME.FIREFOX:

            this.name = internals.BROWSER_NAME.FIREFOX;
            this._capacities.webdriverCaps = new webdriver.Capabilities.firefox();
            break;
        case internals.BROWSER_NAME.PHANTOMJS:

            this.name = internals.BROWSER_NAME.PHANTOMJS;
            this._capacities.webdriverCaps = new webdriver.Capabilities()
                .set(webdriver.Capability.BROWSER_NAME, webdriver.Browser.PHANTOM_JS);
            // .set(webdriver.Capability.SUPPORTS_APPLICATION_CACHE, false)
            // .set(webdriver.Capability.SUPPORTS_LOCATION_CONTEXT, true)
            // .set(webdriver.Capability.LOGGING_PREFS, {
            //     'driver': 'ALL'
            // });

            if (this._capacities.args) {
                this._capacities.webdriverCaps.set('phantomjs.cli.args', this._capacities.args);
            }

            if (this._capacities.useragent) {
                this._capacities.webdriverCaps.set('phantomjs.page.settings.userAgent', this._capacities.useragent);
            }

            break;
        default:

            throw new Error('\t- Browser: ' + this.config.browser.name + ' is not supported...');
            break;
    }

    // enable browser console log for all
    this._capacities.webdriverCaps.set(webdriver.Capability.LOGGING_PREFS, {
        'browser': 'ALL'
    });

    this.driver = new internals._buildBrowser(this);
};

internals._buildBrowser = function(browser) {

    // real builder stuff
    var builder = new webdriver.Builder();
    builder.withCapabilities(browser._capacities.webdriverCaps);

    switch (browser.name) {
        case internals.BROWSER_NAME.CHROME:
            // by default args should be an json object
            if (browser._capacities.args || browser._capacities.useragent || browser._capacities.exts) {
                var chromeOptions = require('selenium-webdriver/chrome').Options;
                var options = chromeOptions.fromCapabilities(browser._capacities.webdriverCaps);
                var cmd_args = [];
                if (browser._capacities.args) {
                    cmd_args = cmd_args.concat(browser._capacities.args);
                }
                if (browser._capacities.useragent) {
                    cmd_args.push('--user-agent="' + browser._capacities.useragent + '"');
                }

                options.addArguments(cmd_args);
                if (browser._capacities.exts) {
                    options.addExtensions(browser._capacities.exts);
                }
                builder.setChromeOptions(options);
            }
            break;
        case internals.BROWSER_NAME.FIREFOX:

            // start selenium standalone server for firefox
            if (browser._server.isRunning()) {
                browser._server.stop();
            }
            browser._server.start();
            builder.usingServer(browser._server.address());
            break;
        case internals.BROWSER_NAME.PHANTOMJS:
            // start selenium standalone server for phantomjs
            if (browser._server.isRunning()) {
                browser._server.stop();
            }
            browser._server.start();
            builder.usingServer(browser._server.address());
            break;
        default:

            break;
    }

    if (browser.config.proxy) {
        builder.setProxy(proxy.manual({
            http: browser.config.proxy,
            https: browser.config.proxy
        }));
    }

    return builder.build();
};

/** ------------begin  cookie operations */
// returns a promise
internals.Browser.prototype.addCookie = function(name, value, opt_path, opt_domain, opt_isSecure, opt_expiry) {
    return this.driver.manage().addCookie(name, value, opt_path, opt_domain, opt_isSecure, opt_expiry);
};

internals.Browser.prototype.deleteAllCookies = function() {
    return this.driver.manage().deleteAllCookies();
};

internals.Browser.prototype.getCookie = function(name) {
    return this.driver.manage().getCookie(name);
};

internals.Browser.prototype.deleteCookie = function(name) {
    return this.driver.manage().deleteCookie(name);
};
/** ------------end */

/** ------------begin  log operations */
internals.Browser.prototype.getConsoleLogs = function(logType) {
    return this.driver.manage().logs().get(logType);
};

/** ------------end */

internals.Browser.prototype.get = function(url) {

    return this.driver.get(url);
};

internals.Browser.prototype.takeScreenshot = function(name) {

    this.driver.takeScreenshot().then(function(data) {
        fs.writeFileSync(name + '.png', data, 'base64');
    });
};


internals.Browser.prototype.getDriver = function(url) {

    return this.driver;
};


internals.Browser.prototype.wait = function(time) {

    this.driver.sleep(time);
};

//wait for element to be present and visible 
internals.Browser.prototype.waitForElement = function(by) {

    self = this;
    this.driver.wait(function() {
        return self.driver.isElementPresent(by);
    }, this.timeout)
        .then(function() {
            self.driver.wait(function() {
                return self.driver.findElement(by).isDisplayed();
            }, this.timeout);
        });
};


internals.Browser.prototype.waitForElementNotPresent = function(by) {
    self = this;
    this.driver.wait(function() {
        return self.driver.isElementPresent(by).then(function(present) {
            return present === false;
        });
    }, this.timeout);
};



//wait for attribute to have value 
internals.Browser.prototype.waitForAttributeToEqual = function(by, attribute, value) {

    self = this;

    this.driver.wait(function() {

        return self.driver.findElement(by).getAttribute(attribute).then(function(text) {

            return text === value;
        });
    }, this.timeout);
};

//wait for element, then open a url. for native tests. 
internals.Browser.prototype.waitForElementThenOpenUrl = function(by, url) {
    self = this;

    this.driver.wait(function() {
        return self.driver.isElementPresent(by);
    }, this.timeout)
        .then(function() {
            self.driver.wait(function() {
                return self.driver.findElement(by).isDisplayed();
            }, this.timeout);
        })
        .then(function() {
            self.driver.get(url);
        });
};


internals.Browser.prototype.clickAndWait = function(by, time) {
    self = this;

    this.driver.findElement(by).click().then(function() {
        self.driver.sleep(time);
    });
};



internals.Browser.prototype.isElementPresent = function(by) {

    return this.driver.isElementPresent(by);
};


// get text, returns a promise 
internals.Browser.prototype.getText = function(by) {

    return this.driver.findElement(by).getText();
};


//get attribute, returns a promise 
internals.Browser.prototype.getAttribute = function(by, attribute) {

    return this.driver.findElement(by).getAttribute(attribute);
};


internals.Browser.prototype.sendText = function(by, text) {

    this.driver.findElement(by).sendKeys(text);
};


internals.Browser.prototype.clear = function(by) {

    this.driver.findElement(by).clear();
};


internals.Browser.prototype.click = function(by) {

    this.driver.findElement(by).click();
};


internals.Browser.prototype.close = function(by) {
    this.driver.close();
    return this.driver.quit();
};


//returns a promise 
internals.Browser.prototype.findElements = function(by) {

    return this.driver.findElements(by);
};


//returns a webelement 
internals.Browser.prototype.findElement = function(by) {

    return this.driver.findElement(by);
};


// execute javascript in browser, returns a promise
internals.Browser.prototype.executeScript = function(script) {

    return this.driver.executeScript(script, null);
};

exports.Browser = internals.Browser;
exports.BROWSER_NAME = internals.BROWSER_NAME;
exports.BROWSER_LOG = internals.BROWSER_LOG;