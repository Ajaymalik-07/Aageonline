# Browser Automation Prohibition

1. Coding agents must **NEVER** invoke `browser_subagent`, `browser-use`, or any browser navigation tools.
2. Do not automatically open browsers or navigate to URLs (e.g. `http://localhost:3000/...`) to check page rendering, inspect console errors, take screenshots, or scroll through pages.
3. All feature verification must be conducted through static code inspection, terminal-based linters, build checks (`npm run build`), or automated tests (`npm test`) unless the user explicitly and directly requests opening a browser.
