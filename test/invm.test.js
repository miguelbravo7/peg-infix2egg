const { runFromFile } = require('../lib/invm.js');
let originalLogMethod;
let callLog = [];

beforeAll(() => {
    originalLogMethod = console.log;
    console.log = function (...args) {
        callLog.push(args);
    };
});

afterEach(() => {
    callLog = [];
});

afterAll(() => {
    console.log = originalLogMethod;
    callLog = [];
});

test('prueba al parser infix', () => {
    runFromFile('test/examples/dot2.in');
    expect(callLog).toEqual([['4-5'], [3], [10]]);
})