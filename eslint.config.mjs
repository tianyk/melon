import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
	globalIgnores([
		'node_modules',
		'out',
		'dist',
		'resources',
	]),
	{
		files: ['eslint.config.mjs'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: globals.node,
		},
		rules: {
			'eol-last': ['error', 'always'],
			'indent': ['error', 'tab', { SwitchCase: 1 }],
			'linebreak-style': ['error', 'unix'],
			'no-console': 'error',
			'no-trailing-spaces': 'error',
			'quotes': ['error', 'single', { avoidEscape: true }],
			'semi': ['error', 'always'],
		},
	},
	{
		files: ['electron-builder.config.js'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'commonjs',
			globals: globals.node,
		},
		rules: {
			'eol-last': ['error', 'always'],
			'indent': ['error', 'tab', { SwitchCase: 1 }],
			'linebreak-style': ['error', 'unix'],
			'no-console': 'error',
			'no-trailing-spaces': 'error',
			'quotes': ['error', 'single', { avoidEscape: true }],
			'semi': ['error', 'always'],
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
		],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			}],
			'eol-last': ['error', 'always'],
			'indent': ['error', 'tab', { SwitchCase: 1 }],
			'linebreak-style': ['error', 'unix'],
			'no-console': 'error',
			'no-trailing-spaces': 'error',
			'quotes': ['error', 'single', { avoidEscape: true }],
			'semi': ['error', 'always'],
		},
	},
	{
		files: ['src/main/**/*.ts', 'electron.vite.config.ts'],
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		files: ['src/renderer/**/*.{ts,tsx}'],
		extends: [
			react.configs.flat.recommended,
			reactHooks.configs.flat.recommended,
		],
		languageOptions: {
			globals: globals.browser,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'react/display-name': 'off',
			'react/jsx-indent': ['error', 'tab'],
			'react/jsx-indent-props': ['error', 'tab'],
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react-hooks/exhaustive-deps': 'error',
		},
	},
]);
