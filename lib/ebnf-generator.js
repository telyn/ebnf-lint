var TypeError = function(expected, found) {
	this.name = "TypeError";
	this.expected = expected;
	this.found = found;
	this.message = "Expected "+this.expected + ", got "+this.found+ ".";

	this.toString = function() {
		return this.message;
	}
}
var generateTerminal = function(terminal) {
	if(terminal.type != "terminal") {
		throw new TypeError("terminal", terminal.type);
	}
	if(terminal.value.indexOf('"') == -1) {
		return '"' + terminal.value + '"';
	} else {
		return "'" + terminal.value + "'";
	}
};
var generateIdentifier = function(identifier) {
	if(identifier.type != "identifier") {
		throw new TypeError("identifier", identifier.type);
	}
	return identifier.name;
};
var generateGroup = function(production) {
	if(production.type != "group") {
		throw new TypeError("group", production.type);
	}
	return "( " + generateProduction(production.value) + " )";
};
var generateMany = function(production) {
	if(production.type != "many") {
		throw new TypeError("many", production.type);
	}
	return "{ " + generateProduction(production.value) + " }";
};
var generateOptional = function(production) {
	if(production.type != "optional") {
		throw new TypeError("optional", production.type);
	}
	return "[ " + generateProduction(production.value) + " ]";
};
var generateSequence = function(production) {
	if(production.type != "sequence") {
		throw new TypeError("sequence", production.type);
	}
	return production.list.reduce(function(acc, item) {
		return acc + generateProduction(item) + " , ";
	}, '').slice(0,-3);
};
var generateChoice = function(production) {
	if(production.type != "choice") {
		throw new TypeError("choice", production.type);
	}
	return production.options.reduce(function(acc, option) {
		return acc + generateProduction(option) + " | ";
	}, '').slice(0,-3);
};
var generateProduction = function(production) {
	switch(production.type) {
		case "terminal":
			return generateTerminal(production);
			break;
		case "identifier":
			return generateIdentifier(production);
			break;
		case "group":
			return generateGroup(production);
			break;
		case "many":
			return generateMany(production);
			break;
		case "optional":
			return generateOptional(production);
			break;
		case "sequence":
			return generateSequence(production);
			break;
		case "choice":
			return generateChoice(production);
			break;
		default:
			throw new Error("Expected a production, got a '"+production.type+"'.");
	}
};
var generateRule = function(rule) {
	if(rule.type != "rule") {
		throw new TypeError("rule", rule.type);
	}
	return generateIdentifier(rule.identifier) + " = " + generateProduction(rule.production) + ";\r\n\r\n";
};
var generate = function(ast) {
	var code = ''
	for(r in ast) {
		code += generateRule(ast[r]);
	}
	return code;
};

module.exports = {
	generate: generate,
	generateRule: generateRule,
	TypeError: TypeError
};