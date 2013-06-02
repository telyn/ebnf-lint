
var util = require('util');

var SanityChecker = function(ast) {

	var areSequencesEqual = function(a, b) {
		a.list.reduce(function(equal, item, index) {
			return areProductionsEqual(item, b.list[index]);
		});
	}

	//TODO placeholder (requires both sets of options to be in same order.)
	var areChoicesEqual = function(a, b) {
		a.options.reduce(function(equal, item, index) {
			return areProductionsEqual(item, b.options[index]);
		});
	}

	var areProductionsEqual = function(a, b) {
		console.error("\t"+a.type + " == "+b.type+"?");
		if(a.type != b.type) {
			return false;
		}
		switch(a.type) {
			case "terminal":
			case "special":
				return a.value == b.value;
			case "identifier":
				return a.name == b.name;
			case "exception":
				return areProductionsEqual(a.from, b.from) && areProductionsEqual(a.exception, b.exception);
			case "optional":
			case "many":
			case "group":
				return areProductionsEqual(a.value, b.value);
			case "choice":
				return areChoicesEqual(a,b);
			case "sequence":
				return areSequencesEqual(a,b);
			default:
				throw new Error("Unexpected type "+a.type);
		}

	}

	var traverseAllNodes = function(root, callback) {
		//root can be anything from the AST, but NOT an array
		callback(root);
		var traverse = function(node) { return traverseAllNodes(node,callback);	};

		switch(root.type) {
			case "terminal":
				break;
			case "identifier":
				break;
			case "special":
				break;	
			case "optional":
			case "many":
			case "group":
				traverse(root.value);
				break;
			case "repetition":
				throw new Error("Repetition isn't finished yet.");
			case "exception":
				traverse(root.from);
				traverse(root.exception);
			case "choice":
				root.options.forEach(traverse);
				break;
			case "sequence":
				root.list.forEach(traverse);
				break;
			case "rule":
				traverse(root.production);
				break;
			case "grammar":
				root.rules.forEach(traverse);
				break;
			default: 
				throw new Error("Unexpected type "+root.type);

		}
	}

	var findDuplicateProductions = function(rule) {

	}
	var findDuplicateIdentifiers = function() {
		var dupes = [];
		ast.forEach(function(a, aindex) {
			ast.forEach(function(b, bindex) {
				if (aindex < bindex && a.identifier.name == b.identifier.name) {
					b.original = a;
					dupes.push(b);
				}
			});
		});
		return dupes.map(function(dupe) {
			return makeProblem("duplicate rule identifier", {duplicate: dupe, original: dupe.original});
		});
	}

	var findUnusedAndUndeclaredIdentifiers = function() {
		var used = [];
		var declared = [];
		traverseAllNodes(ast, function(node) {
			if(node.type == "rule") {
				declared.push(node);
			} else if(node.type == "identifier") {
				used.push(node);
			}
		});

		var undeclared = used.filter(function(usedid) {
			return  !declared.some(function(declaredrule) {
				return usedid.name == declaredrule.identifier.name;
			});
		});
		var unused = declared.filter(function(declaredrule) {
			return !used.some(function(usedid) {
				return usedid.name == declaredrule.identifier.name;
			});
		});


		var problems = undeclared.map(function(id) { return makeProblem("undeclared identifier", {identifier:id}); });
		problems = problems.concat(unused.map(function(rule) { return makeProblem("unused identifier", {rule: rule}); }));
		
		return problems;
	}
	var findEquivalentRules = function() {

		var equivalentRuleSets = [];
		var worthComparingTo = ast;
		
		while(worthComparingTo.length > 0) {
			var a = worthComparingTo.shift();
			var setindex = -1;
			var stillWorthComparingTo = [];
			while(worthComparingTo.length > 0) {
				var b = worthComparingTo.shift();
				console.log(a.identifier.name + " == " + b.identifier.name + "?");
				if(areProductionsEqual(a.production, b.production)) {
					if(setindex == -1) {
						setindex = equivalentRuleSets.length;
						equivalentRuleSets[setindex] = [a];
					}
					equivalentRuleSets[setindex].push(b);
				} else { 
					stillWorthComparingTo.push(b);
				}
			}
			worthComparingTo = stillWorthComparingTo;
		}
		return equivalentRuleSets.map(function(ruleset) {
			return makeProblem('equivalent rules', { rules: ruleset });
		});
	}

	var makeProblem = function(type, extra) {

		var getLine = function(obj) { return obj.line; };
		var getColumn = function(obj) { return obj.column; };
		var getRuleIdentifier = function(rule) { return rule.identifier; };
		var makeRuleReference = function(rule) {
			return util.format("%s (%d:%d)", rule.identifier.name, rule.line, rule.column);
		};
		var assembleProblemObject = function(type, level, line, column, message, extra) {
			var problem = {
				type: type,
				level: level,
				line: line,
				column: column,
				rawmessage: message,
				data: extra
			};
			return problem;
		}

		var problem = {};

		switch(type) {
			case 'equivalent rules':
				var original = extra.rules.shift();
				var message = util.format("%d equivalents of this rule were found: %s.",
						error.rules.length, extra.rules.map(makeRuleReference).join(', '));

				problem = assembleProblemObject(type, "warning", original.line, original.column, message, extra);
				break;
			case 'undeclared identifier':
				var message = util.format("Identifier '%s' is not defined.", extra.identifier.name);
				problem = assembleProblemObject(type, "error", extra.identifier.line, extra.identifier.column, message, extra);
				break;
			case 'unused identifier':
				var message = util.format("Rule '%s' is never used.", extra.rule.identifier.name);
				problem = assembleProblemObject(type, "warning", extra.rule.line, extra.rule.column, message, extra);
				break;
			case 'duplicate rule identifier':
				var message = util.format("A rule with the name '%s' is already defined on line %d.", extra.duplicate.identifier.name, extra.original.identifier.line);
				problem = assembleProblemObject(type, "error", extra.duplicate.line, extra.duplicate.column, message, extra);
				break;
			default:
				throw new Error("Unknown error type '"+error.type+"'");
		}
		problem.message = util.format("%d:%d: %s: %s", problem.line, problem.column, problem.level, problem.rawmessage);
		return problem;
	}

	var sortProblems = function(problems) {
		var compareLevels = function(a, b) {
			switch(a) {
				case "error":
					switch(b) {
						case "error":
							return 0;
						case "warning":
							return 1;
					}
				case "warning":
					switch(b) {
						case "error":
							return -1;
						case "warning":
							return 0;
					}
			}
		}
		var compareProblems = function(a, b) {
			if(a.line == b.line) {
				if(a.column == b.column) {
					return compareLevels(a.level, b.level);
				}
				return a.column - b.column;
			}
			return a.line - b.line;
		}
		return problems.sort(compareProblems);
		
	}

	this.check = function() {
		var problems = [];
		problems = problems.concat(findEquivalentRules());
		problems = problems.concat(findUnusedAndUndeclaredIdentifiers());
		return sortProblems(problems);
	}
};



module.exports = SanityChecker;
