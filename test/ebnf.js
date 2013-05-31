var should = require('should');
var fs = require('fs');

var parser = require('../lib/parser')
   ,generator = require('../lib/ebnf-generator');

var ebnf = '';
beforeEach(function(done) {
	fs.readFile('ebnf.ebnf', {encoding: 'utf8'}, function(err, data) {
		if(err) throw err;
		ebnf = data.toString();
		done();
	});
});

describe('EBNF syntax check', function() {
	it('should correctly parse the EBNF grammar');
});

describe('EBNF sanity check', function() {
	it('should check for unused identifiers');
	it('should check for duplicate productions');

});

describe('EBNF code generator', function() {
	it('should output valid EBNF', function() {
		var ast = parser.parse(ebnf);
		ast.length.should.equal(10);
		var newbnf = generator.generate(ast);
		ast = parser.parse(ebnf);
		ast.length.should.equal(10);
	});
});