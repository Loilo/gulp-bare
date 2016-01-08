var colors = require("colors");

var installers = [
    "colors",
    "glob",
    "beepbeep",
    "gulp",
    "gulp-watch",
    "gulp-plumber"
].map(function(module) {
    return {
        name: module,
        success: colors.cyan(module) + " has been installed.\n"
    }
});

module.exports = installers;