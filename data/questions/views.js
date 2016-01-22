var colors = require("colors");
var path = require("path");
var replaceSep = require("../../util/cpath").replaceSep;
var preConfig = require("../../util/pre-config");
var installers = require("../installers");
var QA = require("../../util/qa");
var mergeObjects = require("../../util/merge-objects");
var isYes = QA.isYes;

var getDetails = function(compiler) {
    switch (compiler) {
        case "gulp-jade":
            return {
                ext: "jade",
            };

        case "gulp-haml":
            return {
                ext: "haml",
            };

        case "gulp-handlebars":
            return {
                ext: "hbs",
            };

        case "gulp-mustache":
            return {
                ext: "mustache",
            };

        case "gulp-twig":
            return {
                ext: "twig",
            };

        default:
            return {
                ext: "html",
            };
    }
}

module.exports = [
    {
        id: "viewsCompiler",
        question: "What's your view compiler module?",
        default: preConfig.compiler.views.compiler ? preConfig.compiler.views.compiler : "gulp-sass"
    },
    {
        id: "viewsCompilerOptions",
        question: function(queue, answers) {
            return "You may provide some options for the " + colors.cyan(answers.viewsCompiler) + " compiler.";
        },
        default: preConfig.compiler.views.options ? JSON.stringify(preConfig.compiler.views.options) : "{}",
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
        id: "viewsSrcDir",
        question: "The views source directory?",
        default: function(answers) {
            return preConfig.src.views.dir
                ? replaceSep(preConfig.src.views.dir)
                : path.join(replaceSep(answers.srcBase), getDetails(answers.viewsCompiler).dir + "/");
        }
    },
    {
        id: "viewsSrcFiles",
        question: "The files to keep track of there?",
        default: function(answers) {
            return preConfig.src.views.files ? replaceSep(preConfig.src.views.files) : "**/*." + getDetails(answers.viewsCompiler).ext;
        }
    },
    {
        id: "viewsDst",
        question: "The according views output directory?",
        default: function(answers) {
            return preConfig.dist.views ? replaceSep(preConfig.dist.views) : path.join(replaceSep(answers.distBase), "views/");
        },
        after: ["\nGreat. You've configured your views. Now let's go for your scripts.\n"]
    },
];