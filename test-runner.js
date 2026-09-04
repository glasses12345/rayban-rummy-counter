// Node.js test runner for Ray-Ban Rummy Counter

// Simulate browser environment for testing
global.window = {
    addEventListener: () => {},
    RummyCounter: null
};

global.document = {
    getElementById: () => ({ innerHTML: '', style: {}, appendChild: () => {} }),
    querySelectorAll: () => [],
    createElement: () => ({
        className: '',
        setAttribute: () => {},
        addEventListener: () => {},
        appendChild: () => {},
        textContent: '',
        style: {}
    }),
    addEventListener: () => {}
};

// Load the app code
const fs = require('fs');
const appCode = fs.readFileSync('./app.js', 'utf8');
const testCode = fs.readFileSync('./tests.js', 'utf8');

// Execute in Node context
eval(appCode);
eval(testCode);
