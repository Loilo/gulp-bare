#!/usr/bin/env node

var dir = require("./util/dir");
var colors = require("colors");
var cpath = require("./util/cpath");
var path = require("path");
var fs = require('fs');

var mergeObjects = require("./util/merge-objects");
var rlInterface = require("./util/rl-interface");
var QA = require("./util/qa");
var install = require("./util/install");

var config = {};
var installers = require("./data/installers");


// global answers object
var answers = null;


// start?
var configNowDeferred = Promise.defer();
rlInterface().question("Configure your gulp-bare now? " + colors.gray("(yes)") + " ", function(answer) {
	configNowDeferred.resolve(answer);
});

// start!
configNowDeferred.promise.then(function(configNow) {

	if (configNow.length !== 0 && !QA.isYes(configNow)) {
        console.log("K, see ya!");
        rlInterface().close();
        process.exit();
	}

	try {
        fs.accessSync(dir + 'node_modules');
    } catch (e) {
        try {
            fs.mkdirSync(dir + 'node_modules', 511);
        } catch (e) {
            console.log("Couldn't create node_modules directory. Sorry.")
        }
    }


    // ask questions
    var prepareQuestions = require("./data/questions/prepare");

	return QA.ask(prepareQuestions);

}).then(function(qaAnswers) {
    answers = qaAnswers;

    if (QA.isNo(answers.useStyles) && QA.isNo(answers.useScripts) && QA.isNo(answers.useAssets)) {
        console.log("K, see ya!");
        rlInterface().close();
        process.exit();
    }

    console.log("That's it, we're ready to go! I'll launch some stuff now, please be patient.");

    var scriptAnswers = {};
    var scriptCompilerAnswers = {};
    if (QA.isYes(answers.useScripts)) {
        answers.scriptsSrcDir = cpath.normalize(answers.scriptsSrcDir);
        answers.scriptsDst = cpath.normalize(answers.scriptsDst);

        scriptAnswers = {
            "dir": answers.scriptsSrcDir,
            "files": answers.scriptsSrcFiles,
        };

        scriptCompilerAnswers = {
            "compiler": answers.scriptsCompiler,
            "options": answers.scriptsCompilerOptions
        };
    }

    var styleAnswers = {};
    var styleCompilerAnswers = {};
    if (QA.isYes(answers.useStyles)) {
        answers.stylesSrcDir = cpath.normalize(answers.stylesSrcDir);
        answers.stylesDst = cpath.normalize(answers.stylesDst);
        
        styleAnswers = {
            "dir": answers.stylesSrcDir,
            "files": answers.stylesSrcFiles,
            "start": answers.stylesSrcStart,
            "autoprefixer": answers.stylesAutoprefixer
        };
        
        styleCompilerAnswers = {
            "compiler": answers.stylesCompiler,
            "options": answers.stylesCompilerOptions
        };
    }

    var viewAnswers = {};
    var viewCompilerAnswers = {};
    if (QA.isYes(answers.useViews)) {
        answers.viewsSrcDir = cpath.normalize(answers.viewsSrcDir);
        answers.viewsDst = cpath.normalize(answers.viewsDst);
        
        viewAnswers = {
            "dir": answers.viewsSrcDir,
            "files": answers.viewsSrcFiles,
        };
        
        viewCompilerAnswers = {
            "compiler": answers.viewsCompiler,
            "options": answers.viewsCompilerOptions
        };
    }

    var assetAnswers = {};
    if (QA.isYes(answers.useAssets)) {
        assetAnswers = {
            "dir": answers.assetsSrcDir,
            "pattern": answers.assetsSrcPattern
        };
    }

	var config = {
        "use": {
            "scripts": QA.isYes(answers.useScripts),
            "styles": QA.isYes(answers.useStyles),
            "assets": QA.isYes(answers.useAssets),
            "views": QA.isYes(answers.useViews),
        },
		"src": {
            "base": answers.srcBase,
			"scripts": scriptAnswers,
			"styles": styleAnswers,
			"assets": assetAnswers,
            "views": viewAnswers,
		},
		"dist": {
            "base": answers.distBase,
			"assets": answers.assetsDst || null,
			"scripts": answers.scriptsDst || null,
			"styles": answers.stylesDst || null
		},
		"compiler": {
			"scripts": scriptCompilerAnswers,
			"styles": styleCompilerAnswers,
            "views": viewCompilerAnswers,
			"browserify": answers.scriptsBrowserify ? {
				"modules": (answers.scriptsBrowserifyModules && answers.scriptsBrowserifyModules.length)
                    ? answers.scriptsBrowserifyModules
                    : null,
				"start": (answers.scriptsBrowserifyStart && answers.scriptsBrowserifyStart.length)
                    ? answers.scriptsBrowserifyStart
                    : null,
                "options": answers.scriptsBrowserifyOptions,
                "transform": answers.scriptsBrowserifyTransform,
                "transformOptions": answers.scriptsBrowserifyTransformOptions || false,
            } : false
		}
	};
    console.log(config);

	return cpath.write("config.json", JSON.stringify(config, null, 4));

}).then(function () {
    
	console.log("\n" + colors.magenta("config.json") + " has been created.");

	cpath.copy(__dirname + '/data/gulpfile-pattern.js', dir + 'gulpfile.js');

	console.log(colors.magenta("gulpfile.js") + " has been created.");



    if (QA.isYes(answers.useAssets)) {
        cpath.mkpathSync(answers.assetsSrcDir, dir);
        console.log(colors.magenta(answers.assetsSrcDir) + " has been created.");
    }

    if (QA.isYes(answers.useStyles)) {
	   cpath.mkpathSync(answers.stylesSrcDir, dir);
	   console.log(colors.magenta(answers.stylesSrcDir) + " has been created.");
    }

    if (QA.isYes(answers.useScripts)) {
	   cpath.mkpathSync(answers.scriptsSrcDir, dir);
	   console.log(colors.magenta(answers.scriptsSrcDir) + " has been created.");
    }


    if (QA.isYes(answers.useAssets)) {
        cpath.mkpathSync(answers.assetsDst, dir);
        console.log(colors.magenta(answers.assetsDst) + " has been created.");
    }

    if (QA.isYes(answers.useStyles)) {
        cpath.mkpathSync(answers.stylesDst, dir);
        console.log(colors.magenta(answers.stylesDst) + " has been created.")
    }

    if (QA.isYes(answers.useScripts)) {
        cpath.mkpathSync(answers.scriptsDst, dir);
        console.log(colors.magenta(answers.scriptsDst) + " has been created.")
    }

    if (QA.isYes(answers.scriptsBrowserify)) {
        cpath.mkpathSync(answers.scriptsBrowserifyModules);
    }

    console.log("\n");

    var p = Promise.defer();

	if (answers.scriptsAddJQuery) {
		var vendorPath = answers.scriptsDst + 'vendor/';

		try { fs.mkdirSync(dir + vendorPath); } catch(e) {}
		console.log(colors.magenta(vendorPath) + " has been created.");

        console.log("\nLoading " + colors.cyan("jQuery") + "...");
		install.module({ name: 'jquery', success: '' }, false, false)
		.then(function () {
			var jqPath = dir + 'node_modules/jquery/dist/jquery.min.js';
			return cpath.copy(jqPath, dir + vendorPath + 'jquery.min.js');
		}).then(function () {
			console.log(colors.cyan("jQuery") + " has been added.\n");
			p.resolve();
		});

	} else {
		p.resolve();
	}
    
    return p.promise;
}).then(function() {
    var installersClone = installers.slice(0);

    if (QA.isYes(answers.useScripts)) {
        installersClone.push({
            name: answers.scriptsCompiler,
            success: colors.cyan(answers.scriptsCompiler) + ' has been installed.'
        });
    }
    
    if (QA.isYes(answers.useStyles)) {
        installersClone.push({
            name: answers.stylesCompiler,
            success: "\n" + colors.cyan(answers.stylesCompiler) + ' has been installed.'
        });
    }
    
    if (QA.isYes(answers.useViews)) {
        installersClone.push({
            name: answers.viewsCompiler,
            success: "\n" + colors.cyan(answers.viewsCompiler) + ' has been installed.'
        });
    }

    return install(installersClone);
}).then(function () {
    console.log("\n\nAll packages have been installed.");
    console.log("");
    console.log("Congrats and have fun!");
    rlInterface().close();
});;