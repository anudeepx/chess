import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
        "./auth.ts",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
};

export default config;