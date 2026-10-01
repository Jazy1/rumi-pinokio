module.exports = {
  // Kept alive after the run array finishes, like any server.
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        message: "node onboarding/server.js --port={{port}}",
        on: [{
          // The server prints its address on one line when it starts listening.
          "event": "/(http:\\/\\/\\S+)/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        // input.event is the match object from the step above; [1] is the captured URL.
        url: "{{input.event[1]}}",
        // Rumi's own console, mounted on the same server and therefore the same
        // origin -- which is the only way its API can be reached at all.
        console_url: "{{input.event[1]}}/console"
      }
    }
  ]
}
