module.exports = function(a, b) {
	var n = {};
	for (var i in a) {
		n[i] = a[i];
	}
	for (var i in b) {
		if (typeof n[i] !== "undefined") return;
		n[i] = b[i];
	}
	return n;
}