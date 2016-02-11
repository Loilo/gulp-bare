var dir = require("./dir");

var preConfig;
try { preConfig = require(dir + 'config.json'); }
catch (e) {
    preConfig = {
        "use": {
            "scripts": false,
            "styles": false,
            "assets": false,
            "views": false
        },
        "src": {
            "scripts": {},
            "styles": {},
            "assets": {}
        },
        "dist": {},
        "compiler": {
            "styles": {},
            "scripts": {},
            "views": {}
        }
    };
}

module.exports = preConfig;