var dir = require("./dir");
var rlInterface = require("./rl-interface");

var askQuestion = function(q, queue, answers) {
	var p = Promise.defer();
	var colors = require('colors');
	if (q.before) {
		var before = q.before;
		if (!(before instanceof Array)) before = [ before ];
		before.forEach(function (befMsg) {
			console.log(befMsg + "\n");
		});
	}
    
    var defAnswer = typeof q.default === "function" ? q.default(answers) : q.default;
	rlInterface().question((
        typeof q.question === "string"
        ? q.question
        : q.question(queue, answers)
    ) + " " + colors.gray("(" + (typeof defAnswer === "object" ? JSON.stringify(defAnswer) : defAnswer) + ")") + " ", function(answer) {
		if (answer.length === 0) answer = defAnswer;

		if (q.after) {
			var after = q.after;
			if (!(after instanceof Array)) after = [ after ];
			after.forEach(function (aftMsg) {
				if (typeof aftMsg === 'function') aftMsg = aftMsg(answer, queue, answers);
				if (typeof aftMsg === 'string') console.log(aftMsg);
			});
		}

		if (q.callback) {
			var res = q.callback(answer, queue, answers);
			if (typeof res !== 'undefined') answer = res; 
		}

		p.resolve({ answer: answer, id: q.id });

		return;
	});
	return p.promise;
}
module.exports = {
    ask: function() {
        var questions = [];
        for (var i = 0; i < arguments.length; i++) {
            questions = questions.concat(arguments[i]);
        }

        var questionsClone = questions.slice(0);
        var p = Promise.defer();

        var answers = {};
        var askFirstQuestion = function() {
            if (questionsClone.length === 0) {
                p.resolve(answers);
                return;
            };

            var head = questionsClone.shift();
            askQuestion(head, questionsClone, answers)
            .then(function(a) {
                answers[a.id] = a.answer;
                askFirstQuestion();
            });
            return;
        };
        askFirstQuestion();

        return p.promise;
    },

    isNo: function (str) {
        return ['false', 'no', 'nah', 'n', 'nope'].indexOf(String(str).toLowerCase()) !== -1;
    },

    isYes: function (str) {
        return ['true', 'yes', 'y', 'yeah', 'ye', 'yeh', 'yep', 'yo', 'yip'].indexOf(String(str).toLowerCase()) !== -1;
    }
};