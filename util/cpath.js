var path = require('path');
var fs = require('fs');

module.exports = {
	normalize: function(p, sep) {
		if (typeof sep !== 'string') sep = path.sep;
		p = path.normalize(p);
		if (p.substr(-1) !== sep) p += sep;
		return p;
	},
	mkpath: function(p, src, sep) {
		if (typeof sep !== 'string') sep = path.sep;
		if (typeof src !== 'string') src = '.' + path.sep;

		p = p.split(sep);
		p.pop();
		var mkHead = function (pathes) {
			var head = pathes.shift();
			fs.mkdir(src + head, function (e) {
				mkHead(pathes);
			});
		}

		var strPath = '';
		var pathes = [];
		for (var i = 0; i < p.length; i++) {
			strPath += p[i] + sep;
			pathes.push(strPath);
		}
	},
	mkpathSync: function (p, src, sep) {
		if (typeof sep !== 'string') sep = path.sep;
		if (typeof src !== 'string') src = '.' + path.sep;

		p = p.split(sep);
		p.pop();
		var strPath = '';
		for (var i = 0; i < p.length; i++) {
			strPath += p[i] + sep;
			try {
				fs.mkdirSync(src + strPath);
			} catch (e) {}
		};
	},
	
	copy: function(source, target) {
		var cbCalled = false;
		var p = Promise.defer();

		var rd = fs.createReadStream(source);
		rd.on("error", function(err) {
			done(err);
		});
		var wr = fs.createWriteStream(target);
		wr.on("error", function(err) {
			done(err);
		});
		wr.on("close", function(ex) {
			done();
		});
		rd.pipe(wr);

		function done(err) {
			if (!cbCalled) {
				p.resolve(err);
				cbCalled = true;
			}
		}

		return p.promise;
	},
	
	replaceSep: function(str) {
		return str.replace(new RegExp('\\' + path.sep, 'g'), '/');
	},

	write: function(file, data, options) {
		var p = Promise.defer();
		fs.writeFile(file, data, options, function() {
			p.resolve();
		});
		return p.promise;
	}
};