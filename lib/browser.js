var webdriver = require('selenium-webdriver');
var proxy = require('selenium-webdriver/proxy');
var fs = require('fs');
var path = require('path');

var By = webdriver.By;

var SeleniumServer = require('selenium-webdriver/remote').SeleniumServer;
var seleniumServerJar = require('selenium-server-standalone-jar');

var config = require('config');

/** output general test configuration
 */

console.log('Host:      ' + config.host);
console.log('Browser:   ' + config.browser.name);
console.log('Proxy:     ' + config.proxy);
// get raw array
console.log('Useragent: ' + config.browser.useragent);
console.log('Args:      ' + config.getOriginalConfig().browser.args);
console.log('Exts:      ' + config.getOriginalConfig().browser.exts);

var internals = {};

internals.BROWSER_NAME = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    PHANTOMJS: 'phantomjs'
};

internals.Browser = function() {
    this.server_ = new SeleniumServer(seleniumServerJar.path, {
        port: 4444
    });

    this.capacities_ = {
        args: config.getOriginalConfig().browser.args,
        useragent: config.getOriginalConfig().browser.useragent,
        exts: config.getOriginalConfig().browser.exts
    };

    switch (config.browser.name.toLowerCase()) {
        case internals.BROWSER_NAME.CHROME:

            // dont have to start selenium server for chrome
            this.name_ = internals.BROWSER_NAME.CHROME;
            this.capacities_.webdriverCaps = new webdriver.Capabilities.chrome();
            break;
        case internals.BROWSER_NAME.FIREFOX:

            this.name_ = internals.BROWSER_NAME.FIREFOX;
            this.capacities_.webdriverCaps = new webdriver.Capabilities.firefox();
            break;
        case internals.BROWSER_NAME.PHANTOMJS:

            this.name_ = internals.BROWSER_NAME.PHANTOMJS;
            this.capacities_.webdriverCaps = new webdriver.Capabilities()
                .set(webdriver.Capability.BROWSER_NAME, webdriver.Browser.PHANTOM_JS);
            // .set(webdriver.Capability.SUPPORTS_APPLICATION_CACHE, false)
            // .set(webdriver.Capability.SUPPORTS_LOCATION_CONTEXT, true)
            // .set(webdriver.Capability.LOGGING_PREFS, {
            //     'driver': 'ALL'
            // });

            if (this.capacities_.args) {
                this.capacities_.webdriverCaps.set('phantomjs.cli.args', this.capacities_.args);
            }

            if (this.capacities_.useragent) {
                this.capacities_.webdriverCaps.set('phantomjs.page.settings.userAgent', this.capacities_.useragent);
            }

            break;
        default:

            console.log('\t- Browser: ' + config.browser.name + ' is not supported...');
            process.exit(code = 1);
            break;
    }

    this.driver = new internals.BrowserBuilder(this);
    // this.driver.manage().deleteAllCookies();
    var myOptions = new webdriver.WebDriver.Options(this.driver);

    self = this;
    if (config.cookie) {
        self.driver.get(config.host).then(function() {
            myOptions.deleteAllCookies().then(function() {
                var date = new Date(2016, 1, 1, 1, 1, 1, 1);
                myOptions.addCookie('ab-override', config.cookie, '/', '.walmart.com', false, date);
            });
        });
    }
};

internals.BrowserBuilder = function(browser) {

    // real builder stuff
    var builder = new webdriver.Builder();
    builder.withCapabilities(browser.capacities_.webdriverCaps);

    switch (browser.name_) {
        case internals.BROWSER_NAME.CHROME:
            // by default args should be an json object
            if (browser.capacities_.args || browser.capacities_.useragent || browser.capacities_.exts) {
                var chromeOptions = require('selenium-webdriver/chrome').Options;
                var options = chromeOptions.fromCapabilities(browser.capacities_.webdriverCaps);
                var cmd_args = [];
                if (browser.capacities_.args) {
                    cmd_args = cmd_args.concat(browser.capacities_.args);
                }
                if (browser.capacities_.useragent) {
                    cmd_args.push('--user-agent="' + browser.capacities_.useragent + '"');
                }

                options.addArguments(cmd_args);
                if (browser.capacities_.exts) {
                    options.addExtensions(browser.capacities_.exts);
                }
                builder.setChromeOptions(options);
            }
            break;
        case internals.BROWSER_NAME.FIREFOX:

            // start selenium standalone server for firefox
            if (browser.server_.isRunning()) {
                browser.server_.stop();
            }
            browser.server_.start();
            builder.usingServer(browser.server_.address());
            break;
        case internals.BROWSER_NAME.PHANTOMJS:
            // start selenium standalone server for phantomjs
            if (browser.server_.isRunning()) {
                browser.server_.stop();
            }
            browser.server_.start();
            builder.usingServer(browser.server_.address());
            break;
        default:

            break;
    }

    if (config.proxy) {
        builder.setProxy(proxy.manual({
            http: config.proxy,
            https: config.proxy
        }));
    }

    return builder.build();
};


// Browser.prototype.config = nconf;
internals.Browser.prototype.host = config.getOriginalConfig().host;
internals.Browser.prototype.get = function(url) {

    this.driver.get(url);
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
    }, 80000)
        .then(function() {
            self.driver.wait(function() {
                return self.driver.findElement(by).isDisplayed();
            }, 80000);
        });
};


internals.Browser.prototype.waitForElementNotPresent = function(by) {
    self = this;
    this.driver.wait(function() {
        return self.driver.isElementPresent(by).then(function(present) {
            return present === false;
        });
    }, 80000);
};



//wait for attribute to have value 
internals.Browser.prototype.waitForAttributeToEqual = function(by, attribute, value) {

    self = this;

    this.driver.wait(function() {

        return self.driver.findElement(by).getAttribute(attribute).then(function(text) {

            return text === value;
        });
    }, 80000);
};

//wait for element, then open a url. for native tests. 
internals.Browser.prototype.waitForElementThenOpenUrl = function(by, url) {
    self = this;

    this.driver.wait(function() {
        return self.driver.isElementPresent(by);
    }, 80000)
        .then(function() {
            self.driver.wait(function() {
                return self.driver.findElement(by).isDisplayed();
            }, 80000);
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