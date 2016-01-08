var readline = require('readline-sync');
var int = null;

module.exports = function() {
	return {
		question: function(msg, cb) {
			cb(readline.question(msg));
		}
	};
};