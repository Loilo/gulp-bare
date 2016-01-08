var config = require('./config.json');

var unique = function(arr) {
    return arr.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    })
};


var colors = require('colors');
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var plumber = require('gulp-plumber');
var beep = require('beepbeep');
var glob = require('glob');
var watch = require('gulp-watch');
var stylesCompiler = require(config.compiler.styles.compiler);
var scriptsCompiler = require(config.compiler.scripts.compiler);
var stylesOptions = config.compiler.styles.options;
var scriptsOptions = config.compiler.scripts.options;

var find = function(src, where, concrete) {
    if (typeof concrete === "undefined")
        concrete = true;

    if (where == null)
        where = '.';
    if (typeof src === "string") {
        if (concrete)
            return glob.sync(path.join(where, src));
        else
            return path.join(where, src);
    } else if (typeof src === "object") {
        var files = [];
        if (src instanceof Array) {
            for (var i = 0; i < src.length; i++)
                files = files.concat(find(src[i], where, concrete));

            files = unique(files);

            return files;
        } else {
            var prefix = '';
            var what = '*';
            var patterns = [];
            if (src.in) {
                prefix = src.in;
            }
            if (src.what) {
                what = src.what;
            }
            if (src.ext) {
                if (typeof src.ext === "string") {
                    patterns = [what + '.' + src.ext];
                } else if (src.ext instanceof Array) {
                    var exclude = src.ext.filter(function(val) { return val[0] === '!'; }).map(function(val) { return val.subtr(1); });
                    var include = src.ext.filter(function(val) { return val[0] !== '!'; });

                    if (exclude.length) {
                        patterns.push('!(' + exclude.map(function(ext) {
                            return what + '.' + ext;
                        }).join('|') + ')');
                    }
                    if (include.length) {
                        patterns.push(what + '.{' + include.join(',') + '}');
                    }
                }
            } else {
                patterns = [what];
            }
            patterns.forEach(function(pattern) {
                if (concrete)
                    files = files.concat(glob.sync(path.join(where, prefix, pattern)));
                else
                    files = files.concat(path.join(where, prefix, pattern));
            });
            files = unique(files);
            return files;
        }
    }
}

var plumberOptions = function (dir) {
	return {
		errorHandler: function (err) {
			beep();
			if (err.fileName) {
				console.log(err.name.red + ' in ' + replaceSep(err.fileName).substr(replaceSep(__dirname).length + 1 + replaceSep(dir).length).magenta);
				console.log(err.codeFrame);
			} else {
				console.log(err.toString());
			}
		}
	};
};
var plumberScriptOptions = plumberOptions(config.src.scripts.dir);
var plumberStyleOptions = {
	errorHandler: function (err) {
		beep();
		if (err.messageFormatted)
			console.log(err.messageFormatted);
		else
			console.log(err.toString());
	}
};

var tmpDir = config.compiler.browserify ? '.tmp' + path.sep : '';

var replaceSep = function(str) {
	return str.replace(new RegExp('\\' + path.sep, 'g'), '/');
};



var buildAssets = function () {
    var assetFiles = find(config.src.assets.pattern, config.src.assets.dir);

	return gulp
		.src(assetFiles)
		.pipe(gulp.dest(config.dist.assets));
};

gulp.task('build-assets', buildAssets);



if (config.compiler.browserify) {
	var browserify = require('browserify');
	var watchify = require('watchify');
}


var buildScriptsBasic = function () {
	return gulp
		.src(config.src.scripts.dir + config.src.scripts.files)
		.pipe(plumber(plumberScriptOptions))
		.pipe(scriptsCompiler(scriptsOptions))
		.pipe(gulp.dest(tmpDir + config.dist.scripts))
};
gulp.task('build-scripts-basic', buildScriptsBasic);


if (config.compiler.browserify) {
	var merge = require('merge-stream');
	var rmdir = require('rimraf');
	var source = require('vinyl-source-stream');

	var buildBrowserifyScript = function (file, watch) {
		var props = {
			cache: {},
			packageCache: {},
			entries: [tmpDir + config.dist.scripts + file],
			paths: [ __dirname + '/' + tmpDir + config.dist.scripts + config.src.scripts.modules.slice(0,-1) ],
			debug : true,
		};

		// watchify() if watch requested, otherwise run browserify() once
		var bundler = watch ? watchify(browserify(props)) : browserify(props);

		function rebundle() {
			var stream = bundler.bundle();
			return stream
				.on('error', function (err) {
					// var args = Array.prototype.slice.call(arguments);
					console.log(err.toString());
					this.emit('end'); // Keep gulp from hanging on this task
				})
				.pipe(source(file))
				.pipe(gulp.dest(config.dist.scripts));
		}

		// listen for an update and run rebundle
		bundler.on('update', function() {
			rebundle();
		});

		return rebundle();
	}

	gulp.task('clear', function () {
		rmdir(tmpDir, function(error){});
	});

	gulp.task('build-scripts-browserify', function () {
		var streams = [];
		var files = glob.sync(tmpDir + config.dist.scripts + config.src.scripts.start + '.js');
		files.forEach(function (file) {
			streams.push(buildBrowserifyScript(file.split(replaceSep(tmpDir + config.dist.scripts))[1], false));
		});

		return merge.apply(this, streams);
	});

	gulp.task('watch-scripts-browserify', function () {
		var streams = [];
		var files = glob.sync(tmpDir + config.dist.scripts + config.src.scripts.start + '.js');
		files.forEach(function (file) {
			streams.push(buildBrowserifyScript(file.split(replaceSep(tmpDir + config.dist.scripts))[1], true));
		});

		return merge.apply(this, streams);
	});

	gulp.task('build-scripts', ['build-scripts-basic', 'build-scripts-browserify', 'clear']);
	gulp.task('watch-scripts', ['build-scripts-basic', 'watch-scripts-basic', 'watch-scripts-browserify']);
} else {
	gulp.task('build-scripts', ['build-scripts-basic']);
	gulp.task('watch-scripts', ['watch-scripts-basic']);
}

gulp.task('build-styles', function () {
	gulp
		.src(config.src.styles.dir + config.src.styles.start)
		.pipe(plumber(plumberStyleOptions))
		.pipe(stylesCompiler(stylesOptions))
		.pipe(autoprefixer({
			browsers: [config.src.styles.autoprefixer]
		}))
		.pipe(gulp.dest(config.dist.styles))
});

gulp.task('build', ['build-scripts', 'build-styles', 'build-assets']);


// watch
gulp.task('watch-scripts-basic', function () {
	var options = {
		unlink: '-'.red + 'Removed',
		add: '+'.green + 'Added',
		change: '*'.cyan + 'Changed'
	};

	return watch(config.src.scripts.dir + config.src.scripts.files, function (vinyl) {
		vinyl.path = replaceSep(vinyl.path);
		var scriptsDir = replaceSep(config.src.scripts.dir);
		var to = vinyl.path.split(scriptsDir)[1].split('.');
		var ext = to.pop();
		to = to.join('.');
		var toPath = to.split('/');
		toPath.pop()
		toPath = toPath.join('/');

		if (vinyl.event === 'unlink') {
			fs.unlinkSync(tmpDir + config.dist.scripts + toPath);
		} else {
			gulp.src(config.src.scripts.dir + to + '.' + ext)
				.pipe(plumber(plumberScriptOptions))
				.pipe(scriptsCompiler(scriptsOptions))
				.pipe(gulp.dest(tmpDir + config.dist.scripts + toPath));
		}
	});
});

gulp.task('watch-assets', function () {
	var options = {
		unlink: '-'.red + 'Removed',
		add: '+'.green + 'Added',
		change: '*'.cyan + 'Changed'
	};


	var assetFiles = find(config.src.assets.pattern, config.src.assets.dir, false);

	return watch(assetFiles, function (vinyl) {
		vinyl.path = replaceSep(vinyl.path);
		var assetsDir = replaceSep(config.src.assets.dir);
		var to = vinyl.path.split(assetsDir)[1];

        var toPath = to.split('/');
        toPath.pop();
        toPath = toPath.join('/');
        
		console.log(options[vinyl.event] + ' ' + to.magenta + '...');

		if (vinyl.event === 'unlink') {
			fs.unlinkSync(config.dist.assets + to);
		} else {
			gulp.src(config.src.assets.dir + to)
				.pipe(gulp.dest(config.dist.assets + toPath));
		}
	});
});

gulp.task('watch-styles', function () {
	var options = {
		unlink: '-'.red + 'Removed',
		add: '+'.green + 'Added',
		change: '*'.cyan + 'Changed'
	};

	return watch(config.src.styles.dir + config.src.styles.files, function (vinyl) {
		vinyl.path = replaceSep(vinyl.path);
		var stylesDir = replaceSep(config.src.styles.dir);
		var to = vinyl.path.split(stylesDir)[1].split('.');
		var ext = to.pop();
		to = to.join('.');
		var toPath = to.split('/');
		toPath.pop()

		console.log(options[vinyl.event] + ' ' + (to + '.' + ext).magenta + '...');

		if (vinyl.event === 'unlink') {
            fs.unlinkSync(config.dist.styles + to + '.css');
		} else {
			gulp
				.src(config.src.styles.dir + config.src.styles.start)
				.pipe(plumber(plumberStyleOptions))
				.pipe(stylesCompiler(stylesOptions))
				.pipe(autoprefixer({
					browsers: [config.src.styles.autoprefixer]
				}))
				.pipe(gulp.dest(config.dist.styles))
		}
	});
});

gulp.task('watch', ['watch-scripts', 'watch-styles', 'watch-assets']);