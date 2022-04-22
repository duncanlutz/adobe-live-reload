#! /usr/bin/env node
const shell = require("shelljs");
const fs = require('fs');
(
    async () => {
        const loc = await shell.exec("npm root -g", { silent: true });
        if (!fs.existsSync(loc.stdout.replace('\n', '') + '/adobe-live-reload/adobe-live-reload.js')) {
            shell.exec('echo "\033[1;31m alr error: Can\'t locate adobe-live-reload.js. Try installing this package globally."');
            process.exit(1)
        }
        if (loc.stderr) {
            console.log(loc.stderr);
        }
        shell.exec(`node ` + loc.stdout.replace('\n', '') + '/adobe-live-reload/adobe-live-reload.js');
    }
)()