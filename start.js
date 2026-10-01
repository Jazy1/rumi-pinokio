module.exports = {
  daemon: true,
  run: [
    // Rumi's queue and session state want a Redis. 6379 is what .env.template
    // already points REDIS_URL at, so using it means nothing has to be patched.
    // An "already in use" is a pass, not a failure: it means one is running.
    {
      when: "{{platform !== 'win32' && !exists('.use-cloud-redis')}}",
      method: "shell.run",
      params: {
        message: "redis-server --port 6379 --bind 127.0.0.1",
        on: [{
          "event": "/(Ready to accept connections|Address already in use)/",
          "done": true
        }]
      }
    },
    {
      method: "shell.run",
      params: {
        env: {
          // A free port, rather than the hardcoded 3000 the app would default to.
          "PORT": "{{port}}",
          // The zero-AWS queue driver: BullMQ needs only REDIS_URL. Left at the
          // template's default of `sqs`, every queued job dies with
          // "SQS Queue not configured". Injected rather than written into .env
          // because dotenv never overrides a variable that is already set.
          "QUEUE_DRIVER": "bullmq",
          // Stop `rumi start` opening a system browser behind Pinokio's back.
          "RUMI_NO_OPEN": "1"
        },
        message: "node bin/rumi.js start",
        on: [{
          // The startup banner prints the bare local URL and a health URL before
          // the console one, so this anchors on the path rather than taking the
          // first URL it sees. No host or port is assumed.
          "event": "/(http:\\/\\/\\S+\\/console)/",
          "done": true
        }]
      }
    },
    {
      method: "local.set",
      params: {
        url: "{{input.event[1]}}"
      }
    }
  ]
}
