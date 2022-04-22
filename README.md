# Adobe Live Reload

Adobe Live Reload implements live reload functionality to Adobe extension development.

### Features

- Reload Adobe Extensions on file save
- Auto open Adobe DevTools on run

### Requirements

- To use *ALR* you'll need Google Chrome as Adobe DevTools only works in Chrome.

- Because Adobe DevTools is hosted independently, *ALR* requires [this Google Chrome extension](https://chrome.google.com/webstore/detail/adobe-live-reload-assista/joafdcjjakhckimnpgadofhoeoohllfk) to communicate with them. Install via the Chrome Web Store to get started.

### Installation

Via npm:

`$ npm i adobe-live-reload -g`

### Usage

- Install the npm package and Google Chrome extensions.
- Navigate to the folder of the extension you want to debug.
- Ensure extension is open in the Adobe Program specified in your .debug file.
- To start the live reload server, run `$ npx adobe-live-reload`.
- Adobe Live Reload will open Adobe DevTools in Google Chrome, live reload is now active and you're ready to debug.
- To close, select the terminal and press "ctrl+c".

## Changelog

## v1.0.4
### Added
- Added more in-depth error and warning messages

### Changed
- Changed script method of execution to allow for global installation

## v1.0.1 - v1.0.3
### Changed
- Updated README

## v1.0.0
### Added
- Added live reload functionality
- Added auto open of Adobe DevTools