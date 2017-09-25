'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const tar = require('tar');
const Docker = require('node-docker-api').Docker;
const path = require('path');
const TestSets = require('./models/TestSets');
const SolutionReport = require('./models/SolutionReport');
const config = require('./TestsExecutorConfig');
const streamToPromise = require('stream-to-promise');

function getCmdFactory(command, container) {
    return () => {
        return Promise.resolve()
            .then(() => container.exec.create({Cmd: command.split(' '), AttachStdout: true, AttachStderr: true}))
            .then((exec) => exec.start({Detach: false}))
            .then((stream) => streamToPromise(stream))
            .then((data) => data.toString().slice(8).replace(config.STREAM_DELIMITER, ''));
    };
}

function execute(testSuite, sourceFile) {
    if (!testSuite.runInDocker)
        throw new Error('This test suite is not designed to run in a docker');

    const docker = new Docker({socketPath: config.DOCKER_SOCK_PATH});
    let _container;
    let sourceFileTar = `${path.basename(sourceFile)}.tar`;
    let results = [];

    return docker.container.create({
        Image: 'node:8',
        Cmd: ['/bin/bash', '-c', 'tail -f /var/log/dmesg']
    })
        .then((container) => {
            _container = container;
            return container.start();
        })
        .then(() => {
            let files = [sourceFile];
            if (testSuite.files)
                files = files.concat(testSuite.files);
            return tar.create({file: sourceFileTar}, files)
        })
        .then(() => _container.fs.put(sourceFileTar, {path: '/'}))
        .then(() => {
            let testCmdFactories = [];
            testSuite.tests.map((test) => {
                let cmd = test.input;
                if (!test.fullCommand)
                    cmd = `node ${sourceFile} ${cmd}`;
                testCmdFactories.push(getCmdFactory(cmd, _container))
            });
            return testCmdFactories.reduce((x, y) => x.then(y).then(d => results.push(d)), Promise.resolve());
        })
        .catch((error) => console.log(error))
        .then(() => {
            fs.unlinkAsync(sourceFileTar);
            _container.kill();
            _container.delete({force: true});
            return results
        });
}

function runTests(testSuite, sourceFile) {
    return execute(testSuite, sourceFile)
        .then((results) => {
            let testsPassed = true;
            let description = '';

            testSuite.tests.map((test, i) => {
                if (!testsPassed)
                    return;
                let comparer = test.comparer;

                let expectedOut = comparer.parse(test.output);
                let out = comparer.parse(results[i]);

                testsPassed = comparer.equals(out, expectedOut) || test.freeOutput;
                if (!test.hideLog)
                    description += testsPassed ?
                        `Test ${test.errorDescription}: success\n` :

                        `Fails on test: ${test.errorDescription}\n\n
                        Expected out: ${expectedOut}\n
                        Out: ${results[i]}`;
            });

            if (testsPassed)
                description += 'All tests passed\n';

            return new SolutionReport(testsPassed, description);
        })
        .catch((err) => console.log(err));
}

runTests(TestSets.entropyTestSuite, './solutions/entropy.js')
    .then((sr) => console.log(sr.description))
    .catch((err) => console.log(err));