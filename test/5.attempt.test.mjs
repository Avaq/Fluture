import chai from 'chai';
import {attempt} from '../index.mjs';
import * as U from './util';
import {testFunction, functionArg} from './props';

var expect = chai.expect;

describe('attempt()', function (){

  testFunction('attempt', attempt, [functionArg], U.assertValidFuture);

  describe('#_interpret()', function (){

    it('resolves with the return value of the function', function (){
      var actual = attempt(function (){ return 1 });
      return U.assertResolved(actual, 1);
    });

    it('rejects with the exception thrown by the function', function (){
      var actual = attempt(function (){ throw U.error });
      return U.assertRejected(actual, U.error);
    });

    it('does not swallow errors from subsequent maps and such', function (){
      var m = attempt(function (x){ return x }).map(function (){ throw U.error });
      return U.assertCrashed(m, U.error);
    });

  });

  describe('#toString()', function (){

    it('returns the code to create the Future', function (){
      var f = function (){};
      var m = attempt(f);
      expect(m.toString()).to.equal('attempt(' + f.toString() + ')');
    });

  });

});
