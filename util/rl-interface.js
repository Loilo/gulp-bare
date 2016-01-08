var readline = require('readline');
var int = null;

module.exports = function () {
	if (int === null) {
		int = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	return int;
}