'use strict';
const StringComparer = require('../comparers/StringComparer');

class Test {
    constructor(input, output, errorDescription, opts) {
        this.input = input;
        this.output = output;
        this.errorDescription = errorDescription;

        if (opts) {
            this.comparer = opts.comparer ? opts.comparer : StringComparer;
            this.fullCommand = opts.fullCommand;
            this.freeOutput = opts.freeOutput;
            this.hideLog = opts.hideLog;
        }
    }
}

module.exports = Test;