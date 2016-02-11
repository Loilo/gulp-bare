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
var minimatch = require('minimatch');
var watch = require('gulp-watch');


if (config.use.views) {
    var viewsCompiler = require(config.compiler.views.compiler);
    var viewsOptions = config.compiler.views.options;
}

if (config.use.styles) {
    var stylesCompiler = require(config.compiler.styles.compiler);
    var stylesOptions = config.compiler.styles.options;
}

if (config.use.scripts) {
    var scriptsCompiler = require(config.compiler.scripts.compiler);
    var scriptsOptions = config.compiler.scripts.options;
}


var makeGlobList = function(src, where) {
    var exclude = [], include = [];

    if (where == null)
        where = '.';
    if (typeof src === "string") {
        if (src[0] === '!') {
            exclude = [path.join(where, src.substr(1))];
        } else {
            include = [path.join(where, src)];
        }
        return {
            include: include,
            exclude: exclude
        }
    } else if (typeof src === "object") {
        var globList = {
            include: include,
            exclude: exclude
        };
        if (src instanceof Array) {
            for (var i = 0; i < src.length; i++) {
                var newList = makeGlobList(src[i], where);
                globList.include = globList.include.concat(newList.include);
                globList.exclude = globList.exclude.concat(newList.exclude);
            }

            globList.include = unique(globList.include);
            globList.exclude = unique(globList.exclude);

            return globList;
        } else {
            var prefix = '';
            var what = '**/*';
            if (src.in) {
                prefix = src.in;
            }
            if (src.what) {
                what = src.what;
            }
            if (src.ext) {
                if (typeof src.ext === "string") {
                    if (src.ext[0] === '!') {
                        exclude = [path.join(where, what + '.' + src.ext.substr(1))];
                        include = [];
                    } else {
                        include = [path.join(where, what + '.' + src.ext)];
                        exclude = [];
                    }
                } else if (src.ext instanceof Array) {
                    exclude = src.ext.filter(function(val) { return val[0] === '!'; }).map(function(val) {
                        return path.join(where, what + '.' + val.substr(1));
                    });
                    include = src.ext.filter(function(val) { return val[0] !== '!'; }).map(function(val) {
                        return path.join(where, what + '.' + val);
                    });
                } else {
                    exclude = [];
                    include = [];
                }
            } else {
                if (what[0] === '!') {
                    exclude = [path.join(where, what.substr(1))];
                } else {
                    include = [path.join(where, what)];
                }
                return {
                    include: include,
                    exclude: exclude
                }
            }
            include = unique(include);
            exclude = unique(exclude);

            return {
                include: include,
                exclude: exclude
            };
        }
    }
}

var find = function(src, where, getFiles) {
    var globs = makeGlobList(src, where);

    if (!getFiles) {
        return globs.include.concat(globs.exclude.map(function(val) {
            return "!" + val;
        }));
    }

    var include = globs.include;
    var exclude = globs.exclude;

    var files = [];
    var includeMagically = include.filter(function(inc) {
        return glob.hasMagic(inc);
    });
    var includeRegularly = include.filter(function(inc) {
        return !glob.hasMagic(inc);
    });

    includeMagically.forEach(function(includePattern) {
        files = files.concat(glob.sync(includePattern));
    });

    files = unique(files);

    files = files.filter(function(file) {
        var foundInExcludes = exclude.map(function(excludePattern) {
            return minimatch(file, excludePattern);
        }).indexOf(true);
        
        return foundInExcludes === -1;
    });

    includeRegularly.forEach(function(includePattern) {
        files = files.concat(glob.sync(includePattern));
    });
    
    files = unique(files);

    return files;
}

// error handling
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


var replaceSep = function(str) {
    return str.replace(new RegExp('\\' + path.sep, 'g'), '/');
};


var buildTasks = [];
var watchTasks = [];


// views
if (config.use.views) {
    var buildViews = function () {
        var viewFiles = find(config.src.views.files, config.src.views.dir, true);
        var merge = require('merge-stream');

        var streams = viewFiles.map(function(file) {

            var dest = file.substr(config.src.views.dir.length).split('/');
            dest.pop();
            dest = dest.join('/');

            return gulp
                .src(file)
                .pipe(plumber(plumberOptions(config.src.views.dir)))
                .pipe(viewsCompiler(viewsOptions))
                .pipe(gulp.dest(path.join(config.dist.views, dest)));
        });

        return merge.apply(this, streams);
    };

    gulp.task('build-views', buildViews);


    gulp.task('watch-views', function () {
        var options = {
            unlink: '-'.red + 'Removed',
            add: '+'.green + 'Added',
            change: '*'.cyan + 'Changed'
        };


        var viewFiles = find(config.src.views.files, config.src.views.dir, false);

        return watch(viewFiles, function (vinyl) {
            vinyl.path = replaceSep(vinyl.path);
            var viewsDir = replaceSep(config.src.views.dir);
            var to = vinyl.path.split(viewsDir)[1];

            var toPath = to.split('/');
            toPath.pop();
            toPath = toPath.join('/');
            
            if (vinyl.event === 'unlink') {
                fs.unlinkSync(config.dist.views + to);
            } else {
                gulp.src(config.src.views.dir + to)
                    .pipe(plumber(plumberOptions(config.src.views.dir)))
                    .pipe(viewsCompiler(viewsOptions))
                    .pipe(gulp.dest(path.join(config.dist.views, toPath)));
            }
        });
    });
    
    buildTasks.push('build-views');
    watchTasks.push('watch-views');
}



// assets
if (config.use.assets) {
    var buildAssets = function () {
        var assetFiles = find(config.src.assets.pattern, config.src.assets.dir, true);
        var merge = require('merge-stream');

        var streams = assetFiles.map(function(file) {

            var dest = file.substr(config.src.assets.dir.length).split('/');
            dest.pop();
            dest = dest.join('/');

            return gulp
                .src(file)
                .pipe(gulp.dest(path.join(config.dist.assets, dest)));
        });

        return merge.apply(this, streams);
    };

    gulp.task('build-assets', buildAssets);


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
                    .pipe(gulp.dest(path.join(config.dist.assets, toPath)));
            }
        });
    });
    
    buildTasks.push('build-assets');
    watchTasks.push('watch-assets');
}


if (config.use.scripts) {
    if (config.compiler.browserify) {
        var browserify = require('browserify');
        var watchify = require('watchify');
        var rename = require('gulp-rename');
    }


    var buildScriptsBasic = function () {
        return gulp
            .src(config.src.scripts.dir + config.src.scripts.files)
            .pipe(plumber(plumberScriptOptions))
            .pipe(scriptsCompiler(scriptsOptions))
            .pipe(gulp.dest(config.dist.scripts))
    };
    gulp.task('build-scripts-basic', buildScriptsBasic);


    if (config.compiler.browserify) {
        var merge = require('merge-stream');
        var source = require('vinyl-source-stream');

        var buildBrowserifyScript = function (file, watch) {
            var props = {
                cache: {},
                packageCache: {},
                entries: [path.join(config.src.scripts.dir, file)],
                paths: [
                    path.join(__dirname, config.compiler.browserify.modules)
                ],
                debug : true,
            };
            for (var prop in config.compiler.browserify.options) {
                props[prop] = config.compiler.browserify.options[prop];
            }

            var bundler = browserify(props);
            
            if (config.compiler.browserify.transform) {
                bundler.plugin(config.compiler.browserify.transform, config.compiler.browserify.transformOptions)
            }

            // watchify() if watch requested, otherwise run browserify() once
            if (watch) {
                bundler = watchify(bundler);
                bundler.on('update', function(ids) {
                    ids.forEach(function(id) {
                        var filename = id.split(path.join(__dirname, config.src.scripts.dir, '/'))[1];
                        console.log('*'.cyan + 'Changed ' + filename.magenta);
                    });
                });
            }



            var basename = path.basename(file).split('.');
            basename.pop();
            basename = basename.join('.');

            function rebundle() {
                var stream = bundler.bundle();
                return stream
                    .on('error', function (err) {
                        // var args = Array.prototype.slice.call(arguments);
                        console.log(err.toString());
                        this.emit('end'); // Keep gulp from hanging on this task
                    })
                    .pipe(source(file))
                    .pipe(rename(basename + '.js'))
                    .pipe(gulp.dest(config.dist.scripts));
            }

            // listen for an update and run rebundle
            bundler.on('update', function() {
                rebundle();
            });

            return rebundle();
        }

        gulp.task('build-scripts-browserify', function () {
            var streams = [];
            var files = glob.sync(path.join(config.src.scripts.dir, config.compiler.browserify.start));
            files.forEach(function (file) {
                streams.push(buildBrowserifyScript(file.split(replaceSep(config.src.scripts.dir))[1], false));
            });

            return merge.apply(this, streams);
        });

        gulp.task('watch-scripts-browserify', function () {
            var streams = [];
            var files = glob.sync(path.join(config.src.scripts.dir, config.compiler.browserify.start));
            files.forEach(function (file) {
                streams.push(buildBrowserifyScript(file.split(replaceSep(config.src.scripts.dir))[1], true));
            });

            return merge.apply(this, streams);
        });

        gulp.task('build-scripts', ['build-scripts-browserify']);
        gulp.task('watch-scripts', ['watch-scripts-browserify']);
    } else {
        gulp.task('build-scripts', ['build-scripts-basic']);
        gulp.task('watch-scripts', ['watch-scripts-basic']);
    }


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

            console.log(options[vinyl.event] + ' ' + (to + '.' + ext).magenta + '...');

            if (vinyl.event === 'unlink') {
                fs.unlinkSync(config.dist.scripts + toPath);
            } else {
                gulp.src(config.src.scripts.dir + to + '.' + ext)
                    .pipe(plumber(plumberScriptOptions))
                    .pipe(scriptsCompiler(scriptsOptions))
                    .pipe(gulp.dest(config.dist.scripts + toPath));
            }
        });
    });


    buildTasks.push('build-scripts');
    watchTasks.push('watch-scripts');
}


if (config.use.styles) {
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
    

    buildTasks.push('build-styles');
    watchTasks.push('watch-styles');
}



gulp.task('build', buildTasks);
gulp.task('watch', watchTasks);