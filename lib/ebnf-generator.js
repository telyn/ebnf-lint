var TypeError = function(expected, found) {
	this.name = "TypeError";
	this.expected = expected;
	this.found = found;
	this.message = "Expected "+this.expected + ", got "+this.found+ ".";

	this.toString = function() {
		return this.message;
	};
}
var makeGenerator = function(type, callback) {
	return function(production) {
		if(production.type != type) {
			throw new TypeError(type, production.type);
		}
		return callback(production);
	};
};
var generateTerminal = makeGenerator("terminal", function(terminal) {
	if(terminal.value.indexOf('"') == -1) {
		return '"' + terminal.value + '"';
	} else {
		return "'" + terminal.value + "'";
	}
});
var generateIdentifier = makeGenerator("identifier", function(identifier) {
	return identifier.name;
});
var generateGroup = makeGenerator("group", function(production) {
	return "( " + generateProduction(production.value) + " )";
});
var generateMany = makeGenerator("many", function(production) {
	return "{ " + generateProduction(production.value) + " }";
});
var generateOptional = makeGenerator("optional", function(production) {
	return "[ " + generateProduction(production.value) + " ]";
});
var generateSpecial = makeGenerator("special", function(production) {
	return "? " + production.value + " ?";
});
var generateException = makeGenerator("exception", function(production) {
	return generateProduction(production.from) + " - "+generateProduction(production.exception);
});
var generateSequence = makeGenerator("sequence", function(production) {
	return production.list.reduce(function(acc, item) {
		return acc + generateProduction(item) + " , ";
	}, '').slice(0,-3);
});
var generateChoice = makeGenerator("choice", function(production) {
	return production.options.reduce(function(acc, option) {
		return acc + generateProduction(option) + " | ";
	}, '').slice(0,-3);
});
var generateProduction = function(production) {
	switch(production.type) {
		case "terminal":
			return generateTerminal(production);
		case "identifier":
			return generateIdentifier(production);
		case "group":
			return generateGroup(production);
		case "many":
			return generateMany(production);
		case "optional":
			return generateOptional(production);
		case "special":
			return generateSpecial(production);	
		case "exception":
			return generateException(production);
		case "sequence":
			return generateSequence(production);
		case "choice":
			return generateChoice(production);
		default:
			throw new Error("Unknown production type '"+production.type+"'.");
	}
};
var generateRule = function(rule) {
	if(rule.type != "rule") {
		throw new TypeError("rule", rule.type);
	}
	return generateIdentifier(rule.identifier) + " = " + generateProduction(rule.production) + ";\r\n\r\n";
};
var generate = function(ast) {
	var code = '';
	for(var r in ast.rules) {
		code += generateRule(ast.rules[r]);
	}
	return code;
};

module.exports = {
	generate: generate,
	generateRule: generateRule,
	TypeError: TypeError
};
