// eslint.config.js
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        rules: {
            "no-unused-vars": "warn",
			"max-len": ["warn", { "code": 80, "tabWidth": 2 }]
        },
    },
];
