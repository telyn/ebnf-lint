{
	var trim = function(string) {
		return string.replace(/^\s+|\s$/g,'');
	}
	var generateArrayMaker = function(typename,keyname) {
		return function(object) {
			var array = { type: typename };
			if(object.type == typename) {
				object = object[keyname];
			} else {
				object = [object];
			}
			array[keyname] = object;
			return array;
		};
	}
	var makeSequenceArray = generateArrayMaker("sequence","list");
	var makeChoiceArray = generateArrayMaker("choice","options");
}

grammar =  whitespace rules:rule+ {
	return {type:"grammar", line: rules[0].line, column: rules[0].column, rules: rules};
}

letter = letter:[a-zA-Z] { return letter; }
realwhitespace = [ \t\r\n]*

comment = "(*" [^*]* "*)"

whitespace = realwhitespace comment whitespace / realwhitespace

identifier = first:letter rest:([a-zA-Z0-9 ])+ {
	 return { type: "identifier", line: location().start.line, column: location().start.column, name: trim(first + rest.join('')) };
}

terminal 	= "'" value:[^']+ "'" {
				return { type: "terminal", line: location().start.line, column: location().start.column, value: value.join('') };
			}
			/ '"' value:[^"]+ '"' {
				return { type: "terminal", line: location().start.line, column: location().start.column, value: value.join('') }; 
			}


simpleproduction 	= t:terminal { return t; }
					/ i:identifier { return i; }
					/ "(" whitespace production:production whitespace ")" {
						return { type: "group", line: location().start.line, column: location().start.column, value: production };
					}
					/ "{" whitespace production:production whitespace "}" {
						return { type: "many", line: location().start.line, column: location().start.column, value: production };
					}
					/ "[" whitespace production:production whitespace "]" {
						return { type: "optional", line: location().start.line, column: location().start.column, value: production };
					}
					/ "?" text:[^?]+ "?" {
						return { type: "special", line: location().start.line, column: location().start.column, value: text.join('')};
					}

exceptionproduction = left:simpleproduction whitespace "-" whitespace right:simpleproduction { 
				// Left assoc because it's easier har har
				return { type: "exception", line: location().start.line, column: location().start.column, from: left, exception: right };
			} / p:simpleproduction { return p; }

sequenceproduction = left:exceptionproduction whitespace "," whitespace right:sequenceproduction {
				left = makeSequenceArray(left);
				right = makeSequenceArray(right);
				return { type: "sequence", line: location().start.line, column: location().start.column, list: left.list.concat(right.list) };
			} / p:exceptionproduction { return p; }

choiceproduction = left:sequenceproduction whitespace "|" whitespace right:choiceproduction {
				left = makeChoiceArray(left);
				right = makeChoiceArray(right);
				return { type: "choice", line: location().start.line, column: location().start.column, options: left.options.concat(right.options) };
			} / p:sequenceproduction {return p;}

production	= p:choiceproduction { return p; }

rule = identifier:identifier whitespace "=" whitespace production:production whitespace ";" whitespace {
		return { type: "rule", line: location().start.line, column: location().start.column, identifier: identifier, production: production };
	}
