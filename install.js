module.exports = {
  run: [
    // The launcher ships inside the Rumi checkout, so there is nothing to clone:
    // Pinokio has already put the whole repository here. This is install.sh's
    // mechanical half, minus the `npm link` -- a global symlink has no place in a
    // sandboxed launcher, and `node bin/rumi.js` is documented as identical.
    //
    // `npm ci` rather than `npm install`, so a lockfile is never rewritten under
    // a checkout you are going to commit from. Falls back to install if the
    // lockfile has drifted out of sync with package.json.
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
    },
    // Never clobber an existing .env -- it holds every credential this
    // deployment has. install.sh takes the same care.
    {
      when: "{{!exists('.env')}}",
      method: "fs.copy",
      params: {
        src: ".env.template",
        dest: ".env"
      }
    },
    // Rumi's queue and session state want a Redis. conda-forge has no Windows
    // build, so Windows users paste a hosted address into the setup wizard instead.
    {
      when: "{{platform !== 'win32'}}",
      method: "shell.run",
      params: {
        message: "conda install -y -c conda-forge redis-server"
      }
    }
  ]
}
