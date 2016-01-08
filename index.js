var dir = require("./util/dir");

var colors = require("colors");

var cpath = require("./util/cpath");

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

	console.log("\nGood.");

	try { fs.mkdirSync(dir + 'node_modules', 511); } catch (e) {}


    // get questions
    var styleQuestions = require("./data/questions/style");
    var scriptQuestions = require("./data/questions/script");
    var assetQuestions = require("./data/questions/asset");

    // ask questions
	return QA.ask(styleQuestions, scriptQuestions, assetQuestions);

}).then(function(qaAnswers) {
    console.log("That's it, we're ready to go! I'll launch some stuff now, please be patient.");

    answers = qaAnswers;

	answers.scriptsSrcDir = cpath.normalize(answers.scriptsSrcDir);
	answers.stylesSrcDir = cpath.normalize(answers.stylesSrcDir);
	answers.scriptsDst = cpath.normalize(answers.scriptsDst);
	answers.stylesDst = cpath.normalize(answers.stylesDst);

	var config = {
		"src": {
			"scripts": {
				"dir": answers.scriptsSrcDir,
				"files": answers.scriptsSrcFiles,
				"modules": (answers.scriptsBrowserifyModules && answers.scriptsBrowserifyModules.length) ? answers.scriptsBrowserifyModules : null,
				"start": (answers.scriptsBrowserifyStart && answers.scriptsBrowserifyStart.length) ? answers.scriptsBrowserifyStart : null
			},
			"styles": {
				"dir": answers.stylesSrcDir,
				"files": answers.stylesSrcFiles,
				"start": answers.stylesSrcStart,
				"autoprefixer": answers.stylesAutoprefixer
			},
			"assets": {
				"dir": answers.assetsSrcDir,
				"pattern": answers.assetsSrcPattern
			}
		},
		"dist": {
			"assets": answers.assetsDst,
			"scripts": answers.scriptsDst,
			"styles": answers.stylesDst
		},
		"compiler": {
			"scripts": {
                "compiler": answers.scriptsCompiler,
                "options": answers.scriptCompilerOptions
            },
			"styles": {
                "compiler": answers.stylesCompiler,
                "options": answers.stylesCompilerOptions
            },
			"browserify": answers.scriptsBrowserify
		}
	};

	return cpath.write("config.json", JSON.stringify(config, null, 4));

}).then(function () {
    
	console.log("\n" + colors.magenta("config.json") + " has been created.");

	cpath.copy(__dirname + '/data/gulpfile-pattern.js', dir + 'gulpfile.js');

	console.log(colors.magenta("gulpfile.js") + " has been created.");



	cpath.mkpathSync(answers.assetsSrcDir, dir);
	console.log(colors.magenta(answers.assetsSrcDir) + " has been created.");

	cpath.mkpathSync(answers.stylesSrcDir, dir);
	console.log(colors.magenta(answers.stylesSrcDir) + " has been created.");

	cpath.mkpathSync(answers.scriptsSrcDir, dir);
	console.log(colors.magenta(answers.scriptsSrcDir) + " has been created.");


	cpath.mkpathSync(answers.assetsDst, dir);
	console.log(colors.magenta(answers.assetsDst) + " has been created.");

	cpath.mkpathSync(answers.stylesDst, dir);
	console.log(colors.magenta(answers.stylesDst) + " has been created.")

	cpath.mkpathSync(answers.scriptsDst, dir);
	console.log(colors.magenta(answers.scriptsDst) + " has been created.")

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

    installersClone.push({
        name: answers.scriptsCompiler,
        success: colors.cyan(answers.scriptsCompiler) + ' has been installed.'
    });
    installersClone.push({
        name: answers.stylesCompiler,
        success: colors.cyan(answers.stylesCompiler) + ' has been installed.'
    });

    return install(installersClone);
}).then(function () {
    console.log("\n\nAll packages have been installed.");
    console.log("");
    console.log("Congrats and have fun!");
    rlInterface().close();
});;