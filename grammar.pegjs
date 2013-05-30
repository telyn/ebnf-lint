{
	var generateArrayMaker = function(typename,keyname) {
		return function(object) {
			if(object.type == typename) {
				object = object[keyname];
			} else {
				object = [object];
			}
		};
	}
	var makeSequenceArray = generateArrayMaker("sequence","list");
	var makeChoiceArray = generateArrayMaker("choice","options");
}

grammar =  rules:rule+ whitespace {
	return rules;
}

letter = letter:[a-zA-Z] { return letter; }
whitespace = [ \t\r\n]*

identifier = first:letter rest:([a-zA-Z0-9 ])+ { return first + rest.join(''); }

terminal 	= "'" value:[^']+ "'" {
				return value.join('');
			}
			/ '"' value:[^"]+ '"' {
				return value.join('');
			}


simpleproduction = t:terminal {
				 return { type: "terminal", value: t }; 
			}
			/ i:identifier {
				 return { type: "identifier", value: i }; 
			}
			/ "(" whitespace production:production whitespace ")" {
				return { type: "group", value: production };
			}
			/ "{" whitespace production:production whitespace "}" {
				return { type: "many", value: production };
			}
			/ "[" whitespace production:production whitespace "]" {
				return { type: "optional", value: production };
			}

production	= production:simpleproduction { return production; }
			/ left:simpleproduction whitespace "," whitespace right:production {
				left = makeSequenceArray(left);
				right = makeSequenceArray(right);
				return { type: "sequence", list: left.concat(right) };
			}
			/ left:simpleproduction whitespace "|" whitespace right:production {
				left = makeChoiceArray(left);
				right = makeChoiceArray(right);
				return { type: "choice", options: left.concat(right) };
			}


rule = whitespace identifier:identifier whitespace "=" whitespace production:production whitespace ";" {
		return { type: "rule", identifier: identifier, production: production };
	}

