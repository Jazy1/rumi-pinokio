module.exports = {
  run: [
    // The launcher and Rumi are the same repository now, so one pull updates
    // both. --autostash so a lockfile npm happened to touch does not stop it;
    // any real local change is stashed and put back afterwards.
    {
      method: "shell.run",
      params: {
        message: "git pull --autostash"
      }
    },
    {
      method: "shell.run",
      params: {
        message: "npm ci --no-fund --no-audit || npm install --no-fund --no-audit"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "bot",
        message: "npm ci --no-fund --no-audit || npm install --no-fund --no-audit"
      }
    }
  ]
}
