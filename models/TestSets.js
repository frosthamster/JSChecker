'use strict';
const {Test, TestSuite} = require('../models');
const {FloatComparer} = require('../comparers');

module.exports = {
    entropyTestSuite: new TestSuite('Calculating the entropy of a text tests', {runInDocker: true},
        [
            new Test('a', '0', 'one symbol', {comparer: FloatComparer}),
            new Test('aabbc', '0.9602297178607613', 'simple text', {comparer: FloatComparer}),
            new Test('', '0', 'empty text', {comparer: FloatComparer})
        ]),

    TestSuite: new TestSuite('Calculating the entropy of a text tests', {runInDocker: true},
        [
            new Test('encode in.txt out.txt', '', 'encode', {hideLog: true}),
            new Test('decode out.txt in2.txt', '', 'decode', {hideLog: true}),
            new Test('diff in.txt out.txt', '', 'simple text')
        ]),
};