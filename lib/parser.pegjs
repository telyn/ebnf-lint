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

grammar =  rules:rule+ whitespace {
	return rules;
}

letter = letter:[a-zA-Z] { return letter; }
whitespace = [ \t\r\n]*

identifier = first:letter rest:([a-zA-Z0-9 ])+ {
	 return { type: "identifier", name: trim(first + rest.join('')) };
}

terminal 	= "'" value:[^']+ "'" {
				return { type: "terminal", value: value.join('') };
			}
			/ '"' value:[^"]+ '"' {
				return { type: "terminal", value: value.join('') }; 
			}


simpleproduction 	= t:terminal { return t; }
					/ i:identifier { return i; }
					/ "(" whitespace production:production whitespace ")" {
						return { type: "group", value: production };
					}
					/ "{" whitespace production:production whitespace "}" {
						return { type: "many", value: production };
					}
					/ "[" whitespace production:production whitespace "]" {
						return { type: "optional", value: production };
					}

production	= left:simpleproduction whitespace "," whitespace right:production {
				left = makeSequenceArray(left);
				right = makeSequenceArray(right);
				return { type: "sequence", list: left.list.concat(right.list) };
			}
			/ left:simpleproduction whitespace "|" whitespace right:production {
				left = makeChoiceArray(left);
				right = makeChoiceArray(right);
				return { type: "choice", options: left.options.concat(right.options) };
			}
			/ production:simpleproduction { return production; }


rule = whitespace identifier:identifier whitespace "=" whitespace production:production whitespace ";" {
		return { type: "rule", identifier: identifier, production: production };
	}

