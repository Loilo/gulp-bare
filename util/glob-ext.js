var glob = require('glob');
var path = require('path');
var unique = function(arr) {
    return arr.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    })
};
var find = function(src, where) {
    if (where == null)
        where = '.';
    if (typeof src === "string") {
        return glob.sync(path.join(where, src));
    } else if (typeof src === "object") {
        var files = [];
        if (src instanceof Array) {
            for (var i = 0; i < src.length; i++)
                files = files.concat(find(src[i], where));
            files = unique(glob.sync(path.join(where, files)));
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
                    patterns.push('!(' + exclude.map(function(ext) {
                        return what + '.' + ext;
                    }).join('|') + ')');
                    patterns.push(what + '.{' + include.join(',') + '}');
                }
            } else {
                patterns = [what];
            }
            patterns.forEach(function(pattern) {
                files = files.concat(glob.sync(path.join(where, prefix, pattern)));
            });
            files = unique(files);
            return files;
        }
    }
}
module.exports = find;