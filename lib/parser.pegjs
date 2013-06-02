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
	 return { type: "identifier", line: line, column: column, name: trim(first + rest.join('')) };
}

terminal 	= "'" value:[^']+ "'" {
				return { type: "terminal", line: line, column: column, value: value.join('') };
			}
			/ '"' value:[^"]+ '"' {
				return { type: "terminal", line: line, column: column, value: value.join('') }; 
			}


simpleproduction 	= t:terminal { return t; }
					/ i:identifier { return i; }
					/ "(" whitespace production:production whitespace ")" {
						return { type: "group", line: line, column: column, value: production };
					}
					/ "{" whitespace production:production whitespace "}" {
						return { type: "many", line: line, column: column, value: production };
					}
					/ "[" whitespace production:production whitespace "]" {
						return { type: "optional", line: line, column: column, value: production };
					}
					/ "?" text:[^?]+ "?" {
						return { type: "special", line: line, column: column, value: text.join('')};
					}

exceptionproduction = left:simpleproduction whitespace "-" whitespace right:simpleproduction { 
				// Left assoc because it's easier har har
				return { type: "exception", line: line, column: column, from: left, exception: right };
			} / p:simpleproduction { return p; }

sequenceproduction = left:exceptionproduction whitespace "," whitespace right:sequenceproduction {
				left = makeSequenceArray(left);
				right = makeSequenceArray(right);
				return { type: "sequence", line: line, column: column, list: left.list.concat(right.list) };
			} / p:exceptionproduction { return p; }

choiceproduction = left:sequenceproduction whitespace "|" whitespace right:choiceproduction {
				left = makeChoiceArray(left);
				right = makeChoiceArray(right);
				return { type: "choice", line: line, column: column, options: left.options.concat(right.options) };
			} / p:sequenceproduction {return p;}

production	= p:choiceproduction { return p; }

rule = identifier:identifier whitespace "=" whitespace production:production whitespace ";" whitespace {
		return { type: "rule", line: line, column: column, identifier: identifier, production: production };
	}
