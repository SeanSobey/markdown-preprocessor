module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"node": true
	},
	"extends": [
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"project": "./tsconfig.json",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint",
		"@typescript-eslint/tslint",
		"functional"
	],
	"rules": {
		"@typescript-eslint/adjacent-overload-signatures": "warn",
		"@typescript-eslint/array-type": ["warn", {
			"readonly ": "generic",
			"default": "generic"
		}],
		"@typescript-eslint/ban-types": "warn",
		"@typescript-eslint/class-name-casing": "warn",
		"@typescript-eslint/consistent-type-assertions": "warn",
		"@typescript-eslint/consistent-type-definitions": "off",
		"@typescript-eslint/explicit-member-accessibility": [
			"warn",
			{
				"accessibility": "explicit"
			}
		],
		"@typescript-eslint/indent": [
			"warn",
			"tab",
			{
				"FunctionDeclaration": {
					"parameters": "first"
				},
				"FunctionExpression": {
					"parameters": "first"
				}
			}
		],
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/member-delimiter-style": [
			"warn",
			{
				"multiline": {
					"delimiter": "semi",
					"requireLast": true
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": false
				}
			}
		],
		"@typescript-eslint/member-ordering": "warn",
		"@typescript-eslint/no-empty-function": "warn",
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-inferrable-types": "warn",
		"@typescript-eslint/no-misused-new": "warn",
		"@typescript-eslint/no-namespace": "warn",
		"@typescript-eslint/no-parameter-properties": "off",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/no-var-requires": "off",
		"@typescript-eslint/prefer-for-of": "warn",
		"@typescript-eslint/prefer-function-type": "warn",
		"@typescript-eslint/prefer-namespace-keyword": "warn",
		"@typescript-eslint/quotes": [
			"warn",
			"single"
		],
		"@typescript-eslint/semi": [
			"warn",
			"always"
		],
		"@typescript-eslint/triple-slash-reference": "warn",
		"@typescript-eslint/type-annotation-spacing": "warn",
		"@typescript-eslint/unified-signatures": "warn",
		"arrow-body-style": "warn",
		"arrow-parens": [
			"off",
			"as-needed"
		],
		"comma-dangle": "off",
		"complexity": "off",
		"constructor-super": "warn",
		"curly": "warn",
		"dot-notation": "warn",
		"eol-last": "off",
		"eqeqeq": [
			"warn",
			"smart"
		],
		"functional/no-let": "error",
		"functional/prefer-readonly-type": [
			"error",
			{
				"allowLocalMutation": true,
				"checkImplicit": true,
			}
		],
		"guard-for-in": "warn",
		"id-blacklist": "off",
		"id-match": "off",
		"import/order": "off",
		"max-classes-per-file": "off",
		"max-len": "off",
		"new-parens": "warn",
		"no-bitwise": "warn",
		"no-caller": "warn",
		"no-cond-assign": "warn",
		"no-console": [
			"warn",
			{
				"allow": [
					"log",
					"warn",
					"dir",
					"timeLog",
					"assert",
					"clear",
					"count",
					"countReset",
					"group",
					"groupEnd",
					"table",
					"dirxml",
					"error",
					"groupCollapsed",
					"Console",
					"profile",
					"profileEnd",
					"timeStamp",
					"context"
				]
			}
		],
		"no-debugger": "warn",
		"no-empty": "warn",
		"no-eval": "warn",
		"no-fallthrough": "off",
		"no-invalid-this": "off",
		"no-multiple-empty-lines": "warn",
		"no-new-wrappers": "warn",
		"no-redeclare": "warn",
		"no-shadow": [
			"warn",
			{
				"hoist": "all"
			}
		],
		"no-throw-literal": "warn",
		"no-trailing-spaces": "warn",
		"no-undef-init": "warn",
		"no-underscore-dangle": "off",
		"no-unsafe-finally": "warn",
		"no-unused-expressions": "warn",
		"no-unused-labels": "warn",
		"no-var": "warn",
		"object-shorthand": "warn",
		"one-var": [
			"warn",
			"never"
		],
		"prefer-const": "warn",
		"quote-props": [
			"warn",
			"consistent-as-needed"
		],
		"radix": "warn",
		"space-before-function-paren": [
			"warn",
			{
				"anonymous": "never",
				"asyncArrow": "always",
				"named": "never"
			}
		],
		"spaced-comment": [
			"off",
			"never"
		],
		"use-isnan": "warn",
		"valid-typeof": "off",
		"@typescript-eslint/tslint/config": [
			"error",
			{
				"lintFile": "./tsconfig.json",
				"rules": {
					"ban": [
						true,
						[
							"_",
							"extend"
						],
						[
							"_",
							"isNull"
						],
						[
							"_",
							"isDefined"
						]
					],
					"import-containment": [
						true,
						{
							"containmentPath": "path/to/libs",
							"allowedExternalFileNames": [
								"index"
							],
							"disallowedInternalFileNames": [
								"index"
							]
						}
					],
					"import-spacing": true,
					"jsdoc-format": true,
					"no-arguments": true,
					"no-label": true,
					"no-reference-import": true,
					"one-line": [
						true,
						"check-open-brace",
						"check-catch",
						"check-else",
						"check-whitespace"
					],
					"typedef": [
						true,
						"call-signature",
						"parameter",
						"property-declaration"
					]
				}
			}
		]
	}
};
