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


let outSocket;


if (!fs.existsSync(`./.debug`)) {
	throw new Error('Cannot locate .debug file');
}

const manifest = fs.readFileSync(`./.debug`, `ascii`);

const ports = manifest.match(/(?<=Port=")\d*(?=")/gm);


ports.forEach(port => {
	const parsedPort = parseInt(port);
	let baseUrl = `http://localhost:${parsedPort}`
	tcpPortUsed.check(parsedPort, 'localhost')
		.then(inUse => {
			if (!inUse) {
				console.log(`port ${parsedPort} not in use`);
				return false;
			}

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
			console.log(err);
		})
})

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

http.listen(12687, () => console.log('Adobe Live Reload Enabled'));

process.stdin.resume();

function exitHandler(options, exitCode) {
	console.log('closing server...');
	outSocket.emit('close');
	http.close(() => {
		
	})
	setTimeout(() => {
		process.exit(0)
	}, 10)
}

process.on('SIGINT', exitHandler.bind(null, {close: true}));