var colors = require("colors");
var dir = require("./dir");
var exec = require('child_process').exec;

var installModule = function (mod, save, verbose) {
	var p = Promise.defer();
	var name = mod.name;
	var success = mod.success;

    var module;
	try {
		module = require(dir + 'node_modules/' + name);
        if (verbose) console.log("Installing " + colors.cyan(name) + " from cache...\n");
		p.resolve(module);
	} catch (e) {
		if (verbose) console.log("Downloading and installing " + colors.cyan(name) + "...");

		exec('npm install ' + name + (save ? ' --save-dev' : ''), function (err, out, outErr) {
			if (verbose) {
				if (typeof success === 'function') {
					var module = require(dir + '/node_modules/' + name);
					console.log(success(module));
				} else {
					console.log(success);
				}
			}
            module = require(dir + 'node_modules/' + name);
			p.resolve(module);
		});
	}

	return p.promise;
};


var install = function (chain) {
	var p = Promise.defer();
	var chainClone = chain.slice(0);

	var installHead = function () {
		if (chainClone.length === 0) {
			p.resolve();
			return;
		};

		var head = chainClone.shift();
		installModule(head, true, true).then(function() {
            installHead();
        });
	};
	installHead();

	return p.promise;
}
install.module = installModule;

module.exports = install;