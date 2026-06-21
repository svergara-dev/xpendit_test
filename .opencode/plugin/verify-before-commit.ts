export default (async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (output.tool === "bash" && output.args.command?.includes("git commit")) {
        const lint = await $({ command: "npm run lint" })
        if (lint.exitCode !== 0) {
          output.args.command = "echo 'BLOCKED: Lint failed. Fix errors before commit.'"
          return
        }
        const build = await $({ command: "npm run build" })
        if (build.exitCode !== 0) {
          output.args.command = "echo 'BLOCKED: Build failed. Fix errors before commit.'"
          return
        }
        const test = await $({ command: "npm run test" })
        if (test.exitCode !== 0) {
          output.args.command = "echo 'BLOCKED: Tests failed. Fix errors before commit.'"
          return
        }
      }
    },
  }
})
