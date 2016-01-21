var path = require("path");
var replaceSep = require("../../util/cpath").replaceSep;
var preConfig = require("../../util/pre-config");
var installers = require("../installers");
var isYes = require("../../util/qa").isYes;
var mergeObjects = require("../../util/merge-objects");

module.exports = [
    {
        id: "assetsSrcDir",
        before: ["\nSo last but not least: asset files."],
        question: "Tell me your assets source directory.",
        default: function(answers) {
            return preConfig.src.assets.dir
                ? replaceSep(preConfig.src.assets.dir)
                : path.join(replaceSep(answers.srcBase), "/");
        }
    },
    {
        id: "assetsSrcPattern",
        question: "Which files should be copied?",
        default: preConfig.src.assets.pattern ? JSON.stringify(preConfig.src.assets.pattern) : '[".htaccess", { "ext": ["html", "php", "json", "yml", "js", "css", "png", "jpg", "svg", "ttf", "woff", "woff2", "eot"] }]',
        callback: function(answer, queue) {
            try {
                var parsedAnswer = JSON.parse(answer);
                if (typeof parsedAnswer === "object" && parsedAnswer instanceof Array)
                    return parsedAnswer;
                else
                    throw "invalid";
            } catch (e) {
                console.log("That's not a valid array. Please try again.");
                queue.unshift(mergeObjects(this, {}));
            }
        }
    },
    {
        id: "assetsDst",
        question: "And where should they go?",
        default: function(answers) {
            return preConfig.dist.assets
                ? replaceSep(preConfig.dist.assets)
                : path.join(replaceSep(answers.distBase), "/");
        },
        after: ["\nYou've configured your assets.\n"]
    },
];