import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    {
        ignores: ['dist/', 'node_modules/', '**/*.d.ts', 'coverage/'],
    },
    prettierRecommended,
    eslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
    {
        files: ['**/*.ts', '**/*.spec.ts'],
        extends: [tseslint.configs.recommended],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {},
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        // The build tools and tests run in Node
        files: ['tools/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {},
    },
);
