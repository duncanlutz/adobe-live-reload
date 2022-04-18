const vscode = require('vscode');
const fs = require('fs');
const http = require('http').createServer();
const md5 = require('md5');
const path = require('path');
require('log-timestamp');
const tcpPortUsed = require('tcp-port-used');
const open = require('open');
const axios = require('axios');
const io = require('socket.io')(http, {
	cors: { origin: "*" }
});

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('alr.runAdobe', function () {

		let wf;

		if (vscode.workspace.workspaceFolders !== undefined) {
			wf = vscode.workspace.workspaceFolders[0].uri.path;
		}

		// if (!fs.existsSync(`${wf}/.debug`)) {
		// 	throw new Error('Cannot locate .debug file');
		// }

		const manifest = fs.readFileSync(`${wf}/.debug`, `ascii`);

		const port = parseInt(manifest.match(/(?<=Port=")\d*(?=")/gm)[0]);
		let baseUrl = `http://localhost:${port}`


		tcpPortUsed.check(port, 'localhost')
			.then(inUse => {
				axios({
					method: 'GET',
					url: `${baseUrl}/json/list?t=${new Date().getTime()}`
				}).then(res => {
					const data = res.data[0];
					const devUrl = data.devtoolsFrontendUrl;
					open(`${baseUrl}${devUrl}`);
				})
			})
			.catch(err => {
				throw new Error(err);
			})

		const mainFold = wf;

		const watchFiles = (file) => {
			let md5Previous = null;
			let fsWait = false;
			fs.watch(file, (event, filename) => {
				if (filename) {
					if (fsWait) return;
					fsWait = setTimeout(() => {
						fsWait = false;
					}, 100);
					const md5Current = md5(fs.readFileSync(file));
					if (md5Current === md5Previous) {
						return;
					}
					md5Previous = md5Current;
					io.emit('reload');
				}
			});
		}

		const getAllFiles = function (dirPath, arrayOfFiles) {
			files = fs.readdirSync(dirPath)

			arrayOfFiles = arrayOfFiles || []

			files.forEach(function (file) {
				if (fs.statSync(dirPath + "/" + file).isDirectory()) {
					arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
				} else {
					if (file.substring(0, 1) === '.') {
						return;
					}
					arrayOfFiles.push(path.join(dirPath, "/", file))
				}
			})

			return arrayOfFiles
		}

		const allFiles = getAllFiles(mainFold);

		allFiles.forEach(file => {
			watchFiles(file);
		})

		io.on('connection', (socket) => {
		});

		http.listen(12687, () => console.log('Adobe Live Reload Enabled'));

		// Display a message box to the user

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
