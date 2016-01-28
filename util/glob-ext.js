var glob = require('glob');
var minimatch = require('minimatch');
var path = require('path');
var unique = function(arr) {
    return arr.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    })
};

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

    console.log(JSON.stringify(globs, null, 2));

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

module.exports = find;