const path = require('path');

try {
    require('ts-node').register();
    require(path.resolve(__dirname, './TimeSyncWorker.ts'));
} catch (e) { //Prod environment, no ts-node so import directly.
    require(path.resolve(__dirname, './TimeSyncWorker.js'));
}
