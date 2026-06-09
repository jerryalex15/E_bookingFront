module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular/build/karma'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-junit-reporter'),        // kjhtml supprimé : inutile en CI
            require('@angular/build/karma'),
        ],
        reporters: ['progress', 'junit'],         // kjhtml supprimé ici aussi
        junitReporter: {
            outputDir: 'test-results',
            outputFile: 'test-results.xml',
            useBrowserName: false,
        },
        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox', '--disable-gpu'],
            },
        },
        browsers: ['ChromeHeadlessCI'],
        singleRun: true,            // true : Jenkins quitte après les tests
        restartOnFileChange: false, // false : inutile en CI
    });
};