module.exports = {
  run: [
    // Claude Code lives in Pinokio's own npm prefix, not the system one, so a
    // teammate on a fresh machine gets it installed here rather than being told
    // to go and do it themselves.
    {
      when: "{{!which('claude')}}",
      method: "shell.run",
      params: {
        message: "npm install -g @anthropic-ai/claude-code"
      }
    },
    {
      method: "shell.run",
      params: {
        // Interactive: Claude Code is a TTY program. Without this it would stop
        // at its first prompt and wait forever with no keyboard attached.
        input: true,
        // Runs from the repository root, so the session sees the launcher and
        // Rumi together -- which is the whole point of them sharing a repo.
        message: "claude"
      }
    }
  ]
}
