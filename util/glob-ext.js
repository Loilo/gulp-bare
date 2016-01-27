var glob = require('glob');
var path = require('path');
var unique = function(arr) {
    return arr.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    })
};
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
                var exclude, include;
                if (typeof src.ext === "string") {
                    patterns = [what + '.' + src.ext];
                    if (src.ext[0] === '!') {
                        exclude = [src.ext.substr(1)];
                    } else {
                        include = [src.ext];
                    }
                } else if (src.ext instanceof Array) {
                    exclude = src.ext.filter(function(val) { return val[0] === '!'; }).map(function(val) { return val.subtr(1); });
                    include = src.ext.filter(function(val) { return val[0] !== '!'; });
                }

                if (exclude.length) {
                    patterns.push('!(' + exclude.map(function(ext) {
                        return what + '.' + ext;
                    }).join('|') + ')');
                }
                if (include.length) {
                    patterns.push(what + '.{' + include.join(',') + '}');
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
module.exports = find;