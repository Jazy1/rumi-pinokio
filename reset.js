module.exports = {
  // Start over without destroying the checkout -- the repository IS the launcher
  // here, so deleting it would delete your fork's working copy and any commits
  // not yet pushed. This clears everything install and setup generated instead:
  // dependencies, your credentials, and the linked WhatsApp session.
  run: [
    {
      method: "fs.rm",
      params: {
        path: "node_modules"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: "bot/node_modules"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: ".env"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: ".channel-state"
      }
    },
    {
      method: "fs.rm",
      params: {
        path: ".setup-state.json"
      }
    }
  ]
}
