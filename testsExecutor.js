'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const tar = require('tar');
const Docker = require('node-docker-api').Docker;
const path = require('path');
const tests = require('./tests');
const SolutionReport = require('./solutionReport');

function promisifyStream(stream, out) {
    return new Promise((resolve, reject) => {
        let data = '';
        stream.on('data', (d) => data += d.toString().slice(8));
        stream.on('end', () => {
            out.push(data);
            resolve();
        });
        stream.on('error', reject)
    });
}

function executeSequentially(promiseFactories) {
    let result = Promise.resolve();
    promiseFactories.forEach((pf) => {
        result = result.then(pf)
    });
    return result;
}

function getCmdFactory(command, container, out) {
    return () => {
        let outLen = out.length;
        return Promise.resolve()
            .then(() => container.exec.create({Cmd: command.split(' '), AttachStdout: true, AttachStderr: true}))
            .then((exec) => exec.start({Detach: false}))
            .then((stream) => promisifyStream(stream, out))
            .then(() => {
                if (outLen === out.length)
                    out.push('');
            });
    }
}

function execute(sourceFile, testSuite) {
    if (testSuite.runInDocker !== true)
        throw new Error('This test suite is not designed to run in a docker');

    const docker = new Docker({socketPath: '/var/run/docker.sock'});
    let _container;
    let sourceFileTar = `${path.basename(sourceFile)}.tar`;
    let results = [];

    return docker.container.create({
        Image: 'node:8',
        Cmd: ['/bin/bash', '-c', 'tail -f /var/log/dmesg'],
        name: 'test'
    })
        .then((container) => container.start())
        .then((container) => _container = container)

        .then(() => {
            let files = [sourceFile];
            if (testSuite.files)
                files = files.concat(testSuite.files);
            return tar.create({file: sourceFileTar}, files)
        })
        .then(() => _container.fs.put(sourceFileTar, {path: '/'}))
        .then(() => fs.unlinkAsync(sourceFileTar))

        .then(() => {
            let testCmdFactories = [];
            for (let i = 0; i < testSuite.tests.length; i++) {
                let test = testSuite.tests[i];
                let cmd = test.input;
                if (test.fullCommand !== true)
                    cmd = `node ${sourceFile} ${cmd}`;
                testCmdFactories.push(getCmdFactory(cmd, _container, results))
            }
            return executeSequentially(testCmdFactories);
        })

        .then(() => _container.kill())
        .then(() => _container.delete({force: true}))
        .then(() => results)
        .catch((error) => console.log(error));
}

function runTests(sourceFile, testSuite) {
    return execute(sourceFile, testSuite)
        .then((results) => {
            let testsPassed = true;
            let description = 'All tests passed';

            for (let i = 0; i < testSuite.tests.length; i++) {
                let test = testSuite.tests[i];
                let expectedOut = test.output;
                let out = results[i];
                let equal = (x, y) => x === y;

                if (test.floatCompare) {
                    expectedOut = Number(expectedOut);
                    out = Number(out);
                    equal = (x, y) => Math.abs(x - y) < 1e-3;
                }

                if (!equal(out, expectedOut)) {
                    testsPassed = false;
                    description = `Fails on test: ${test.errorDescription}\n\nExpected out: ${expectedOut}\nOut: ${results[i]}`;
                    break;
                }
            }

            return new SolutionReport(testsPassed, description);
        })
        .catch((err) => console.log(err));
}

runTests('./solutions/entropy.js', tests.entropyTestSuite)
    .then((sr) => console.log(sr.description))
    .catch((err) => console.log(err));