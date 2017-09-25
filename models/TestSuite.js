'use strict';

class TestSuite {
    constructor(description, opts, tests) {
        this.description = description;
        this.tests = tests;

        if (opts) {
            this.runInDocker = opts.runInDocker;
            this.files = opts.files;
        }
    }
}

module.exports = TestSuite;