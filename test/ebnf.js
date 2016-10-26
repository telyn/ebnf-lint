var should = require('should');
var fs = require('fs');

var parser = require('../lib/parser'),
   generator = require('../lib/ebnf-generator'),
   SanityChecker = require('../lib/sanitychecker.js');

describe('Parser', function() {
	it('should correctly parse simple grammars');
	it('should correctly parse complex grammars');
});

describe('Sanity checker', function() {
	it('should find unused identifiers', function() {
		var ebnf = "test = 'hi';";
		var ast = parser.parse(ebnf);
		var problems = new SanityChecker(ast).check();
		
		problems.length.should.equal(1);
		problems[0].type.should.equal("unused identifier");
		problems[0].line.should.equal(1);
		problems[0].column.should.equal(1);
		problems[0].data.rule.identifier.name.should.equal("test");
	});
	it('should find undeclared identifiers', function() {
		var ebnf = "test = undeclared;";
		var ast = parser.parse(ebnf);
		var problems = new SanityChecker(ast).check();
		
		problems.length.should.equal(2);
		problems[0].type.should.equal("unused identifier");
		problems[1].type.should.equal("undeclared identifier");
		problems[1].line.should.equal(1);
		problems[1].column.should.equal(8);
		problems[1].data.identifier.name.should.equal("undeclared");
	});
	it('should find duplicate rule names');

});

describe('EBNF code generator', function() {
	it('should output valid EBNF');
});
