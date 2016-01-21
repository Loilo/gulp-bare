var dir = require("./dir");

var preConfig;
try { preConfig = require(dir + 'config.json'); }
catch (e) {
    preConfig = {
        "use": {
            "scripts": false,
            "styles": false,
            "assets": false
        },
        "src": {
            "scripts": {},
            "styles": {},
            "assets": {}
        },
        "dist": {},
        "compiler": {
            "styles": {},
            "scripts": {}
        }
    };
}

module.exports = preConfig;