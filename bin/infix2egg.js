#!/usr/bin/env node
const { runFromEVM } = require('@ull-esit-pl-1920/p7-t3-egg-2-miguel');
const { runFromFile } = require('../lib/invm.js');

const fileName = process.argv.slice(2).shift();
if (fileName && fileName.length > 0) {
    if (fileName.split('.').pop() === 'evm') {
        runFromEVM(fileName);
    } else {
        runFromFile(fileName);
    }
}