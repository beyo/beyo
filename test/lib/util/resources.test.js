

describe('Test resources util', function () {

  var resources = require('../../../lib/util/resources');


  describe('with module name validation', function () {

    it('should validate', function () {
      [
        'a', 'abc', 'abc-def'
      ].forEach(function (validResourceName) {
        resources.isModuleNameValid(validResourceName).should.be.true;
      });
    });

    it('should not validate', function () {
      [
        undefined, true, false, null, void 0,
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc', '-a', 'a-'
      ].forEach(function (invalidResourceName) {
        resources.isModuleNameValid(invalidResourceName).should.be.false;
      });
    });

  });


  describe('with resource name validation', function () {

    it('should validate', function () {
      [
        'a', 'abc', 'abc_def', '__abc', 'abc__', 'abc__def'
      ].forEach(function (validResourceName) {
        resources.isNameValid(validResourceName).should.be.true;
      });
    });

    it('should not validate', function () {
      [
        undefined, true, false, null, void 0,
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc', '-a', 'a-'
      ].forEach(function (invalidResourceName) {
        resources.isNameValid(invalidResourceName).should.be.false;
      });
    });

  });


  describe('with constructor name from file', function () {

    it('should validate', function () {
      resources.getConstructorNameFromFile('./foo/bar/buz.js', 'my-module').should.equal('my-module/foo.bar.Buz');
      resources.getConstructorNameFromFile('./foo/bar/buz.js').should.equal('foo.bar.Buz');
    });

    it('should not validate', function () {
      [
        undefined, true, false, null, void 0,
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc'
      ].forEach(function (invalidName) {
        (function () { resources.getConstructorNameFromFile(invalidName); }).should.throw();
      });
    });

    it('should not validate wrong module name', function () {
      [
        /*undefined,*/ true, false, null, /*void 0,*/
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc', '-a', 'a-'
      ].forEach(function (invalidModuleName) {
        (function () { resources.getConstructorNameFromFile('a/b/c', invalidModuleName); }).should.throw();
      });
    });

  });


  describe('with name from file', function () {

    it('should validate', function () {
      resources.getNameFromFile('./foo/bar/buz.js', 'my-module').should.equal('my-module/foo.bar.buz');
      resources.getNameFromFile('./foo/bar/buz.js').should.equal('foo.bar.buz');
    });

    it('should not validate', function () {
      [
        undefined, true, false, null, void 0,
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc'
      ].forEach(function (invalidName) {
        (function () { resources.getNameFromFile(invalidName); }).should.throw();
      });
    });

    it('should not validate wrong module name', function () {
      [
        /*undefined,*/ true, false, null, /*void 0,*/
        /./, function () {}, {}, [],
        -1, 0, 1, '-1', '0', '1',
        '', '123abc', '-a', 'a-'
      ].forEach(function (invalidModuleName) {
        (function () { resources.getNameFromFile('a/b/c', invalidModuleName); }).should.throw();
      });
    });

  });

});