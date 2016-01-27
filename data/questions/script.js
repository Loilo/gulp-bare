var colors = require("colors");
var path = require("path");
var replaceSep = require("../../util/cpath").replaceSep;
var preConfig = require("../../util/pre-config");
var cpath = require("../../util/cpath");
var installers = require("../installers");
var mergeObjects = require("../../util/merge-objects");
var isYes = require("../../util/qa").isYes;
var isNo = require("../../util/qa").isNo;

var getDetails = function(compiler) {
    switch (compiler) {
        case "gulp-tsc":
        case "gulp-typescript":
            return {
                ext: "ts",
                dir: "typescript",
                browserifyTransform: "tsify"
            };

        case "gulp-coffee":
            return {
                ext: "coffee",
                dir: "coffee",
                browserifyTransform: "coffeeify"
            };

        case "gulp-babel":
            return {
                ext: "js",
                dir: "es6",
                browserifyTransform: "babelify"
            };
        
        default:
            return {
                ext: "js",
                dir: "js",
                browserifyTransform: "no"
            };
    }
}

module.exports = [
    {
        id: "scriptsCompiler",
        question: "What's your scripts compiler module?",
        default: preConfig.compiler.scripts.compiler ? preConfig.compiler.scripts.compiler : "gulp-babel"
    },
    {
        id: "scriptsCompilerOptions",
        question: function(queue, answers) {
            return "You may provide some options for the " + colors.cyan(answers.scriptsCompiler) + " compiler.";
        },
        default: preConfig.compiler.scripts.options ? JSON.stringify(preConfig.compiler.scripts.options) : "{}",
        callback: function(answer, queue) {
            try {
                return JSON.parse(answer);
            } catch (e) {
                console.log("That's not a valid object. Please try again.");
                queue.unshift(mergeObjects(this, {}));
            }
        }
    },
    {
        id: "scriptsSrcDir",
        question: "The scripts source directory?",
        default: function(answers) {
            return preConfig.src.scripts.dir ? replaceSep(preConfig.src.scripts.dir) : path.join(replaceSep(answers.srcBase), getDetails(answers.scriptsCompiler).dir, "/");
        }
    },
    {
        id: "scriptsSrcFiles",
        question: "The files to keep track of there?",
        default: function(answers) {
            return preConfig.src.scripts.files ? replaceSep(preConfig.src.scripts.files) : "**/*." + getDetails(answers.scriptsCompiler).ext;
        }
    },
    {
        id: "scriptsDst",
        question: "What's the according output directory?",
        default: function(answers) {
            return preConfig.dist.scripts ? replaceSep(preConfig.dist.scripts) : path.join(replaceSep(answers.distBase), "js/");
        }
    },
    {
        id: "scriptsBrowserify",
        question: "\nDo you want to use " + colors.cyan("browserify") + "?",
        default: preConfig.compiler.browserify ? "yes" : "no",
        callback: function (answer, queue, answers) {
            var useBrowserify = isYes(answer);
            if (!useBrowserify) return false;

            console.log("Okay, let's install some stuff we need for " + colors.cyan("browserify") + ".")

            installers.push({
                name: 'vinyl-source-stream',
                success: "\n" + colors.cyan("vinyl-source-stream") + ' has been installed.\n'
            },
            {
                name: 'merge-stream',
                success: colors.cyan("merge-stream") + ' has been installed.\n'
            },
            {
                name: 'browserify',
                success: colors.cyan("browserify") + ' has been installed.\n'
            },
            {
                name: 'watchify',
                success: colors.cyan("watchify") + ' has been installed.\n'
            },
            {
                name: 'gulp-rename',
                success: "\n" + colors.cyan("gulp-rename") + ' has been installed.\n'
            });

            queue.unshift({
                id: "scriptsBrowserifyStart",
                question: "Your " + colors.cyan("browserify") + " starting file(s)?",
                default: '*.' + getDetails(answers.scriptsCompiler).ext
            },
            {
                id: "scriptsBrowserifyOptions",
                question: function(queue, answers) {
                    return "Your " + colors.cyan("browserify") + " options?";
                },
                default: preConfig.compiler.browserify.options ? JSON.stringify(preConfig.compiler.browserify.options) : "{}",
                callback: function(answer, queue) {
                    try {
                        return JSON.parse(answer);
                    } catch (e) {
                        console.log("That's not a valid object. Please try again.");
                        queue.unshift(mergeObjects(this, {}));
                    }
                }
            },
            {
                id: "scriptsBrowserifyTransform",
                question: function(queue, answers) {
                    return "Use a " + colors.cyan("browserify") + " transform?";
                },
                default: function(answers) {
                    return preConfig.compiler.browserify.transform ? JSON.stringify(preConfig.compiler.browserify.transform) : getDetails(answers.scriptsCompiler).browserifyTransform;
                },
                callback: function(answer, queue) {
                    if (isNo(answer) || answer.length === 0) return false;
                    
                    installers.push({
                        name: answer,
                        success: "\n" + colors.cyan(answer) + ' has been installed.\n'
                    });
                    
                    queue.unshift({
                        id: "scriptsBrowserifyTransformOptions",
                        question: function(queue, answers) {
                            return "Your " + colors.cyan(answers.scriptsBrowserifyTransform) + " options?";
                        },
                        default: preConfig.compiler.browserify.transformOptions ? JSON.stringify(preConfig.compiler.browserify.transformOptions) : answers.scriptsCompilerOptions,
                        callback: function(answer, queue) {
                            try {
                                return JSON.parse(answer);
                            } catch (e) {
                                console.log("That's not a valid object. Please try again.");
                                queue.unshift(mergeObjects(this, {}));
                            }
                        }
                    });
                }
            },
            {
                id: "scriptsBrowserifyModules",
                question: "Where do you want to store your modules?",
                default: function(answers) {
                    return preConfig.src.scripts.modules ? preConfig.src.scripts.modules : (path.join(answers.scriptsSrcDir, 'modules/'));
                },
                callback: function (answer) { return cpath.normalize(answer); }
            });

            return true;
        }
    },


    {
        id: "scriptsAddJQuery",
        question: "\nShould I add jQuery?",
        default: "no",
        callback: function (answer) { return isYes(answer); }
    }
];