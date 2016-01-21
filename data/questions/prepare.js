var QA = require("../../util/qa");
var preConfig = require("../../util/pre-config");

module.exports = [
    {
        id: "srcBase",
        before: ["Great - let's start right away!"],
        question: "What's your source files' base directory?",
        default: preConfig.src.base ? preConfig.src.base : "src/"
    },
    {
        id: "distBase",
        question: "And the general output path?",
        default: preConfig.dist.base ? preConfig.dist.base : "dst/"
    },
    {
        id: "useStyles",
        before: ["Okay. Then first about your styles."],
        question: "Do you want to use a styles precompiler?",
        default: preConfig.use.styles ? "yes" : "no",
        callback: function(answer, queue, answers) {
            if (QA.isYes(answer))
                queue.unshift(...require("./style"));
        }
    },
    {
        id: "useScripts",
        question: "Do you want to use a scripts precompiler?",
        default: preConfig.use.scripts ? "yes" : "no",
        callback: function(answer, queue, answers) {
            if (QA.isYes(answer))
                queue.unshift(...require("./script"));
        }
    },
    {
        id: "useAssets",
        question: "Do you want to automatically copy your assets?",
        default: preConfig.use.assets ? "yes" : "no",
        callback: function(answer, queue, answers) {
            if (QA.isYes(answer))
                queue.unshift(...require("./asset"));
        }
    }
];