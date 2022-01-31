const fs = require('fs');

const { topEnv } = require('@ull-esit-pl-1920/p7-t3-egg-2-miguel');
const InfixParser = require('./InfixParser.js')

function run(program) {
    let env = Object.create(topEnv);
    let obj = new InfixParser(program);
    let tree = obj.parse();
    return tree.evaluate(env);
}

function runFromFile(path) {
    let program = fs.readFileSync(path, 'utf-8');
    return run(program);
}

module.exports = {
    run,
    runFromFile
}