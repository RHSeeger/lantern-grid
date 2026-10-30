// Runs one of the TypeScript build tools: node tools/run.cjs tools/<name>.ts [args...]
//
// The package is "type": "module" (for the webpack/jest/eslint configs), so ts-node is told to treat the tools as
// CommonJS, the same module format the tests use.
const path = require('path');

require('ts-node').register({
    transpileOnly: true,
    project: path.join(__dirname, '..', 'tsconfig.test.json'),
    compilerOptions: { module: 'commonjs' },
    moduleTypes: { '**/*.ts': 'cjs' },
});

const script = process.argv[2];
process.argv.splice(1, 1); // so the tool sees its own path as argv[1], and its arguments after it
require(path.resolve(script)).main();
