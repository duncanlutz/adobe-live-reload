#! /usr/bin/env node
const fs = require('fs');
const http = require('http').createServer();
const md5 = require('md5');
const path = require('path');
const tcpPortUsed = require('tcp-port-used');
const open = require('open');
const axios = require('axios');
const io = require('socket.io')(http, {
	cors: { origin: "*" }
});
const shell = require('shelljs');

let outSocket;

const runError = (mes, type) => {
	let col;
	switch (type) {
		case "error": col = '31';
			break;
		case "warning": col = "33";
			break;
		case "message": col = "32";
			break;
	}
	shell.exec('echo "\033[1;' + col + 'm alr ' + type + ': ' + mes + '"');

	if (type === "error") {
		process.exit(1);
	}
}


if (!fs.existsSync(`./.debug`)) {
	runError("Cannot locate .debug file", "error");
}

const manifest = fs.readFileSync(`./.debug`, `ascii`);
const ports = manifest.match(/(?<=Port=")\d*(?=")/gm);
const apps = manifest.match(/(?<=Host Name=\").*?(?=\")/gm);
let portInUse = [];

const runGetPorts = async = () => {
	return new Promise((resolve, reject) => {
		for (let i = 0; i < ports.length; i++) {

			const parsedPort = parseInt(ports[i]);
			let baseUrl = `http://localhost:${parsedPort}`
			tcpPortUsed.check(parsedPort, 'localhost')
				.then(inUse => {
					let curProgram;
					switch (apps[i]) {
						case 'PHSP': curProgram = 'Photoshop';
							break;
						case 'IDSN': curProgram = 'InDesign';
							break;
						case 'AICY': curProgram = 'InCopy';
							break;
						case 'ILST': curProgram = 'Illustrator';
							break;
						case 'PPRO': curProgram = 'Premiere Pro';
							break;
						case 'PRLD': curProgram = 'Prelude';
							break;
						case 'AEFT': curProgram = 'After Effects';
							break;
						case 'FLPR': curProgram = 'Animate';
							break;
						case 'AUDT': curProgram = 'Audition';
							break;
						case 'DRWV': curProgram = 'Dreamweaver';
							break;
						case 'KBRG': curProgram = 'Bridge';
							break;
						case 'RUSH': curProgram = 'Rush';
							break;
					}

					if (!inUse) {
						portInUse.push({
							used: false,
							program: curProgram,
							port: parsedPort
						});
						return;
					}

					portInUse.push({
						used: true,
						program: curProgram,
						port: parsedPort
					});

					axios({
						method: 'GET',
						url: `${baseUrl}/json/list?t=${new Date().getTime()}`
					}).then(res => {
						const data = res.data[0];
						const devUrl = data.devtoolsFrontendUrl;
						open(`${baseUrl}${devUrl}`);
					})
				})
				.then(() => {
					const usedTest = (p) => p.used === false;

					if (portInUse.every(usedTest)) {
						runError(`No .debug ports are active, make sure extension is open.`, 'error');
					}

					let falseProgArr = [];
					let trueProgArr = [];

					if (portInUse.some(usedTest)) {
						portInUse.forEach(p => {
							if (!p.used) {
								falseProgArr.push(p.program)
								return;
							}
							trueProgArr.push(p.program);
						})

						let falseProgStr = "Extension not open in ";
						let trueProgStr = "Continuing in ";

						for (let i = 0; i < falseProgArr.length; i++) {
							if (i === 0 && falseProgArr.length === 1) {
								falseProgStr += `${falseProgArr[i]}. `;
								break;
							}
							if (i === falseProgArr.length - 2) {
								falseProgStr += `${falseProgArr[i]} `;
								continue;
							}
							if (i === 0 && falseProgArr.length > 1) {
								falseProgStr += `${falseProgArr[i]}, `;
								continue;
							}
							if (i === falseProgArr.length - 1) {
								falseProgStr += `or ${falseProgArr[i]}. `;
								break;
							}


							falseProgStr += `${falseProgArr[i]}, `
						}

						for (let i = 0; i < trueProgArr.length; i++) {
							if (i === 0 && trueProgArr.length === 1) {
								trueProgStr += `${trueProgArr[i]}.`;
								break;
							}
							if (i === 0 && trueProgArr.length > 1) {
								trueProgStr += `${trueProgArr[i]}, `;
								continue;
							}
							if (i === trueProgArr.length - 1) {
								trueProgStr += `and ${trueProgArr[i]}. `;
								break;
							}
							if (i === trueProgArr.length - 2) {
								trueProgStr += `${trueProgArr[i]} `;
								continue;
							}

							trueProgStr += `${trueProgArr[i]}, `;
						}

						const errStr = `${falseProgStr}${trueProgStr}`

						runError(errStr, 'warning')
					}
				})
				.then(() => {
					const mainFold = `./`;

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
						outSocket = socket;
						socket.emit('welcome');
						socket.on('close', () => {
							socket.disconnect();

							return;
						})
					});
				})
				.then(() => {
					resolve();
				})
				.catch(err => {
					console.log(err);
					reject();
				})
		}
	})
}

runGetPorts().then(() => {
	setTimeout(() => {
		http.listen(12687, () => runError("Adobe Live Reload is active", "message"));
	}, 100)
})



process.stdin.resume();

function exitHandler(options, exitCode) {
	console.log('closing server...');
	outSocket.emit('close');
	http.close()
	setTimeout(() => {
		process.exit(0)
	}, 10)
}

process.on('SIGINT', exitHandler.bind(null, { close: true }));