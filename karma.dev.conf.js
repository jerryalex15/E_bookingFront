module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular/build/karma'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),  // utile en local
            require('@angular/build/karma'),
        ],
        reporters: ['progress', 'kjhtml'],         // affiche dans le browser
        browsers: ['Chrome'],                      // Chrome normal, pas headless
        singleRun: false,                          // watch mode
        restartOnFileChange: true,
    });
};