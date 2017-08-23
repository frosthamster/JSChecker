'use strict';

class Test {
    constructor(input, output, errorDescription, opts) {
        this.input = input;
        this.output = output;
        this.errorDescription = errorDescription;

        if (opts) {
            this.floatCompare = opts.floatCompare;
            this.fullCommand = opts.fullCommand;
            this.freeOutput = opts.freeOutput;
        }
    }
}

class TestSuite {
    constructor(description, tests, opts) {
        this.description = description;
        this.tests = tests;

        if (opts) {
            this.runInDocker = opts.runInDocker;
            this.files = opts.files;
        }
    }
}

const entropyTestSuite = new TestSuite('Calculating the entropy of a text tests',
    [
        new Test('a', '0', 'one symbol', {floatCompare: true}),
        new Test('aabbc', '0.96', 'simple text', {floatCompare: true}),
        new Test('', '0', 'empty text', {floatCompare: true})
    ]
    , {runInDocker: true});

module.exports.entropyTestSuite = entropyTestSuite;