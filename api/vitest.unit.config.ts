import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: [
            "tests/services/auth.test.ts",
            "tests/controllers/auth.test.ts",
            "tests/services/issue.test.ts",
        ],
        fileParallelism: false,
        isolate: false,
    },
});
