import {expect} from 'chai';
import {Future, fromPromise, fromPromise2, fromPromise3} from '../index.es.js';
import * as U from './util';
import type from 'sanctuary-type-identifiers';

const unaryNoop = a => Promise.resolve(a);
const binaryNoop = (a, b) => Promise.resolve(b);
const ternaryNoop = (a, b, c) => Promise.resolve(c);

describe('fromPromise()', () => {

  it('is a curried binary function', () => {
    expect(fromPromise).to.be.a('function');
    expect(fromPromise.length).to.equal(2);
    expect(fromPromise(U.noop)).to.be.a('function');
  });

  it('throws TypeError when not given a function', () => {
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    const fs = xs.map(x => () => fromPromise(x));
    fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
  });

  it('returns an instance of Future', () => {
    expect(fromPromise(unaryNoop, null)).to.be.an.instanceof(Future);
  });

});

describe('fromPromise2()', () => {

  it('is a curried ternary function', () => {
    expect(fromPromise2).to.be.a('function');
    expect(fromPromise2.length).to.equal(3);
    expect(fromPromise2((a, b) => b)).to.be.a('function');
    expect(fromPromise2((a, b) => b)(1)).to.be.a('function');
    expect(fromPromise2((a, b) => b, 1)).to.be.a('function');
  });

  it('throws TypeError when not given a function', () => {
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    const fs = xs.map(x => () => fromPromise2(x));
    fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
  });

  it('returns an instance of Future', () => {
    expect(fromPromise2(binaryNoop, null, null)).to.be.an.instanceof(Future);
  });

});

describe('fromPromise3()', () => {

  it('is a curried quaternary function', () => {
    expect(fromPromise3).to.be.a('function');
    expect(fromPromise3.length).to.equal(4);
    expect(fromPromise3((a, b, c) => c)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c)(1)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c, 1)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c)(1)(2)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c, 1)(2)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c)(1, 2)).to.be.a('function');
    expect(fromPromise3((a, b, c) => c, 1, 2)).to.be.a('function');
  });

  it('throws TypeError when not given a function', () => {
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null];
    const fs = xs.map(x => () => fromPromise3(x));
    fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
  });

  it('returns an instance of Future', () => {
    expect(fromPromise3(ternaryNoop, null, null, null))
    .to.be.an.instanceof(Future);
  });

});

describe('FromPromise', () => {

  it('extends Future', () => {
    expect(fromPromise(U.noop, 1)).to.be.an.instanceof(Future);
  });

  it('is considered a member of fluture/Fluture', () => {
    expect(type(fromPromise(U.noop, 1))).to.equal(Future['@@type']);
  });

  describe('#fork()', () => {

    describe('(unary)', () => {

      it('throws TypeError when the function does not return a Promise', () => {
        const f = () => fromPromise(U.noop, 1).fork(U.noop, U.noop);
        expect(f).to.throw(TypeError, /Future.*Promise/);
      });

      it('resolves with the resolution value of the returned Promise', () => {
        const actual = fromPromise(x => Promise.resolve(x + 1), 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', () => {
        const actual = fromPromise(_ => Promise.reject(U.error), 1);
        return U.assertRejected(actual, U.error);
      });

    });

    describe('(binary)', () => {

      it('throws TypeError when the function does not return a Promise', () => {
        const f = () => fromPromise2(U.noop, 1, 1).fork(U.noop, U.noop);
        expect(f).to.throw(TypeError, /Future.*Promise/);
      });

      it('resolves with the resolution value of the returned Promise', () => {
        const actual = fromPromise2((x, y) => Promise.resolve(y + 1), 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', () => {
        const actual = fromPromise2(_ => Promise.reject(U.error), 1, 1);
        return U.assertRejected(actual, U.error);
      });

    });

    describe('(ternary)', () => {

      it('throws TypeError when the function does not return a Promise', () => {
        const f = () => fromPromise3(U.noop, 1, 1, 1).fork(U.noop, U.noop);
        expect(f).to.throw(TypeError, /Future.*Promise/);
      });

      it('resolves with the resolution value of the returned Promise', () => {
        const actual = fromPromise3((x, y, z) => Promise.resolve(z + 1), 1, 1, 1);
        return U.assertResolved(actual, 2);
      });

      it('rejects with rejection reason of the returned Promise', () => {
        const actual = fromPromise3(_ => Promise.reject(U.error), 1, 1, 1);
        return U.assertRejected(actual, U.error);
      });

    });

  });

  describe('#toString()', () => {

    it('returns the code to create the FromPromise', () => {
      const m1 = fromPromise(unaryNoop, null);
      const m2 = fromPromise2(binaryNoop, null, null);
      const m3 = fromPromise3(ternaryNoop, null, null, null);
      expect(m1.toString()).to.equal(
        `Future.fromPromise(${unaryNoop.toString()}, null)`
      );
      expect(m2.toString()).to.equal(
        `Future.fromPromise2(${binaryNoop.toString()}, null, null)`
      );
      expect(m3.toString()).to.equal(
        `Future.fromPromise3(${ternaryNoop.toString()}, null, null, null)`
      );
    });

  });

});