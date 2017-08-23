'use strict';

class SolutionReport {
    constructor(testsPassed, description) {
        this.testsPassed = testsPassed;
        this.description = description;
    }
}

module.exports = SolutionReport;