var colors = require("colors");
var replaceSep = require("../../util/cpath").replaceSep;
var preConfig = require("../../util/pre-config");
var installers = require("../installers");
var QA = require("../../util/qa");
var mergeObjects = require("../../util/merge-objects");
var isYes = QA.isYes;

module.exports = [
    {
        id: "stylesCompiler",
        before: ["First about your styles."],
        question: "What's your style compiler module?",
        default: preConfig.compiler.styles.compiler ? preConfig.compiler.styles.compiler : "gulp-sass"
    },
    {
        id: "stylesCompilerOptions",
        question: function(queue, answers) {
            return "You may provide some options for the " + colors.cyan(answers.stylesCompiler) + " compiler.";
        },
        default: preConfig.compiler.styles.options ? JSON.stringify(preConfig.compiler.styles.options) : "{}",
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
        id: "stylesSrcDir",
        question: "The styles source directory?",
        default: preConfig.src.styles.dir ? replaceSep(preConfig.src.styles.dir) :  "src/sass/"
    },
    {
        id: "stylesSrcFiles",
        question: "The files to keep track of there?",
        default: preConfig.src.styles.files ? replaceSep(preConfig.src.styles.files) : "**/*.scss"
    },
    {
        id: "stylesSrcStart",
        question: "The toplevel starting point(s) of your styles?",
        default: preConfig.src.styles.start ? replaceSep(preConfig.src.styles.start) : "*.scss"
    },
    {
        id: "stylesAutoprefixer",
        question: "Autoprefixer browser compability",
        default: typeof preConfig.src.styles.autoprefixer !== "undefined" ? (preConfig.src.styles.autoprefixer === false ? "no" : preConfig.src.styles.autoprefixer) : "last 2 versions",
        callback: function (answer, queue, answers) {
            var useAutoprefixer = !QA.isNo(answer);
            if (!useAutoprefixer) return false;

            installers.push({
                name: 'gulp-autoprefixer',
                success: 'gulp-autoprefixer has been installed.'
            });
        }
    },
    {
        id: "stylesDst",
        question: "The according styles output directory?",
        default: preConfig.dist.styles ? replaceSep(preConfig.dist.styles) : "dst/css/",
        after: ["\nGreat. You've configured your styles. Now let's go for your scripts.\n"]
    },
];