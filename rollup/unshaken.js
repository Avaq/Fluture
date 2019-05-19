(function (type, show, concurrify) {
  'use strict';

  type = type && type.hasOwnProperty('default') ? type['default'] : type;
  show = show && show.hasOwnProperty('default') ? show['default'] : show;
  concurrify = concurrify && concurrify.hasOwnProperty('default') ? concurrify['default'] : concurrify;

  var FL = {
    alt: 'fantasy-land/alt',
    ap: 'fantasy-land/ap',
    bimap: 'fantasy-land/bimap',
    chain: 'fantasy-land/chain',
    chainRec: 'fantasy-land/chainRec',
    map: 'fantasy-land/map',
    of: 'fantasy-land/of',
    zero: 'fantasy-land/zero'
  };

  var ordinal = ['first', 'second', 'third', 'fourth', 'fifth'];

  var namespace = 'fluture';
  var name = 'Future';
  var version = 5;

  var $$type = namespace + '/' + name + '@' + version;

  var nil = {head: null};
  nil.tail = nil;

  function isNil(list){
    return list.tail === list;
  }

  // cons :: (a, List a) -> List a
  //      -- O(1) append operation
  function cons(head, tail){
    return {head: head, tail: tail};
  }

  // reverse :: List a -> List a
  //         -- O(n) list reversal
  function reverse(xs){
    var ys = nil, tail = xs;
    while(!isNil(tail)){
      ys = cons(tail.head, ys);
      tail = tail.tail;
    }
    return ys;
  }

  // cat :: (List a, List a) -> List a
  //     -- O(n) list concatenation
  function cat(xs, ys){
    var zs = ys, tail = reverse(xs);
    while(!isNil(tail)){
      zs = cons(tail.head, zs);
      tail = tail.tail;
    }
    return zs;
  }

  /* istanbul ignore next: non v8 compatibility */
  var captureStackTrace = Error.captureStackTrace || captureStackTraceFallback;
  var _debug = debugHandleNone;

  function debugMode(debug){
    _debug = debug ? debugHandleAll : debugHandleNone;
  }

  function debugHandleNone(x){
    return x;
  }

  function debugHandleAll(x, fn, a, b, c){
    return fn(a, b, c);
  }

  function debug(x, fn, a, b, c){
    return _debug(x, fn, a, b, c);
  }

  function captureContext(previous, tag, fn){
    return debug(previous, debugCaptureContext, previous, tag, fn);
  }

  function debugCaptureContext(previous, tag, fn){
    var context = {tag: tag, name: ' from ' + tag + ':'};
    captureStackTrace(context, fn);
    return cons(context, previous);
  }

  function captureApplicationContext(context, n, f){
    return debug(context, debugCaptureApplicationContext, context, n, f);
  }

  function debugCaptureApplicationContext(context, n, f){
    return debugCaptureContext(context, ordinal[n - 1] + ' application of ' + f.name, f);
  }

  function captureStackTraceFallback(x){
    var e = new Error;
    /* istanbul ignore else: non v8 compatibility */
    if(typeof e.stack === 'string'){
      x.stack = x.name + '\n' + e.stack.split('\n').slice(1).join('\n');
    }else{
      x.stack = x.name;
    }
  }

  /* istanbul ignore next: non v8 compatibility */
  var setImmediate = typeof setImmediate === 'undefined' ? setImmediateFallback : setImmediate;

  function noop(){}
  function moop(){ return this }
  function call(f, x){ return f(x) }

  function setImmediateFallback(f, x){
    return setTimeout(f, 0, x);
  }

  function raise(x){
    setImmediate(function rethrowErrorDelayedToEscapePromiseCatch(){
      throw x;
    });
  }

  function showArg(x){
    return show(x) + ' :: ' + type.parse(type(x)).name;
  }

  function error(message){
    return new Error(message);
  }

  function typeError(message){
    return new TypeError(message);
  }

  function invalidArgument(it, at, expected, actual){
    return typeError(
      it + '() expects its ' + ordinal[at] + ' argument to ' + expected + '.' +
      '\n  Actual: ' + showArg(actual)
    );
  }

  function invalidArgumentOf(expected){
    return function(it, at, actual){
      return invalidArgument(it, at, expected, actual);
    };
  }

  function invalidContext(it, actual){
    return typeError(
      it + '() was invoked outside the context of a Future. You might want to use'
    + ' a dispatcher instead\n  Called on: ' + show(actual)
    );
  }

  function invalidArity(f, args){
    return new TypeError(
      f.name + '() expects to be called with a single argument per invocation\n' +
      '  Saw: ' + args.length + ' arguments' +
      Array.prototype.slice.call(args).map(function(arg, i){
        return '\n  ' + (
          ordinal[i] ?
          ordinal[i].charAt(0).toUpperCase() + ordinal[i].slice(1) :
          'Argument ' + String(i + 1)
        ) + ': ' + showArg(arg);
      }).join('')
    );
  }

  function invalidNamespace(m, x){
    return (
      'The Future was not created by ' + namespace + '. '
    + 'Make sure you transform other Futures to ' + namespace + ' Futures. '
    + 'Got ' + (x ? ('a Future from ' + x) : 'an unscoped Future') + '.'
    + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
    );
  }

  function invalidVersion(m, x){
    return (
      'The Future was created by ' + (x < version ? 'an older' : 'a newer')
    + ' version of ' + namespace + '. '
    + 'This means that one of the sources which creates Futures is outdated. '
    + 'Update this source, or transform its created Futures to be compatible.'
    + '\n  See: https://github.com/fluture-js/Fluture#casting-futures'
    );
  }

  function invalidFuture(desc, m, s){
    var id = type.parse(type(m));
    var info = id.name === name ? '\n' + (
      id.namespace !== namespace ? invalidNamespace(m, id.namespace)
    : id.version !== version ? invalidVersion(m, id.version)
    : 'Nothing seems wrong. Contact the Fluture maintainers.') : '';
    return typeError(
      desc + ' to be a valid Future.' + info + '\n' +
      '  Actual: ' + show(m) + ' :: ' + id.name + (s || '')
    );
  }

  function invalidFutureArgument(it, at, m, s){
    return invalidFuture(it + '() expects its ' + ordinal[at] + ' argument', m, s);
  }

  function ensureError(value, fn){
    var message;
    try{
      if(value instanceof Error) return value;
      message = 'A Non-Error was thrown from a Future: ' + show(value);
    }catch (_){
      message = 'Something was thrown from a Future, but it could not be converted to String';
    }
    var e = error(message);
    captureStackTrace(e, fn);
    return e;
  }

  function assignUnenumerable(o, prop, value){
    Object.defineProperty(o, prop, {value: value, writable: true, configurable: true});
  }

  function wrapException(caught, callingFuture){
    var origin = ensureError(caught, wrapException);
    var context = cat(origin.context || nil, callingFuture.context);
    var e = error(origin.message);
    assignUnenumerable(e, 'future', origin.future || callingFuture);
    assignUnenumerable(e, 'reason', origin.reason || origin);
    assignUnenumerable(e, 'stack', e.reason.stack);
    return withExtraContext(e, context);
  }

  function withExtraContext(e, context){
    assignUnenumerable(e, 'context', context);
    assignUnenumerable(e, 'stack', e.stack + contextToStackTrace(context));
    return e;
  }

  function contextToStackTrace(context){
    var stack = '', tail = context;
    while(tail !== nil){
      stack = stack + '\n' + tail.head.stack;
      tail = tail.tail;
    }
    return stack;
  }

  function isFunction(f){
    return typeof f === 'function';
  }

  function isThenable(m){
    return m instanceof Promise || m != null && isFunction(m.then);
  }

  function isBoolean(f){
    return typeof f === 'boolean';
  }

  function isNumber(f){
    return typeof f === 'number';
  }

  function isUnsigned(n){
    return (n === Infinity || isNumber(n) && n > 0 && n % 1 === 0);
  }

  function isObject(o){
    return o !== null && typeof o === 'object';
  }

  function isIterator(i){
    return isObject(i) && isFunction(i.next);
  }

  function isArray(x){
    return Array.isArray(x);
  }

  function hasMethod(method, x){
    return x != null && isFunction(x[method]);
  }

  function isFunctor(x){
    return hasMethod(FL.map, x);
  }

  function isAlt(x){
    return isFunctor(x) && hasMethod(FL.alt, x);
  }

  function isApply(x){
    return isFunctor(x) && hasMethod(FL.ap, x);
  }

  function isBifunctor(x){
    return isFunctor(x) && hasMethod(FL.bimap, x);
  }

  function isChain(x){
    return isApply(x) && hasMethod(FL.chain, x);
  }

  function Next(x){
    return {done: false, value: x};
  }

  function Done(x){
    return {done: true, value: x};
  }

  function isIteration(x){
    return isObject(x) && isBoolean(x.done);
  }

  /*eslint no-cond-assign:0, no-constant-condition:0 */

  function alwaysTrue(){
    return true;
  }

  function isFutureArray(xs){
    if(!isArray(xs)) return false;
    for(var i = 0; i < xs.length; i++){
      if(!isFuture(xs[i])) return false;
    }
    return true;
  }

  var any = {pred: alwaysTrue, error: invalidArgumentOf('be anything')};
  var func = {pred: isFunction, error: invalidArgumentOf('be a Function')};
  var future = {pred: isFuture, error: invalidFutureArgument};
  var positiveInteger = {pred: isUnsigned, error: invalidArgumentOf('be a positive Integer')};

  var futureArray = {
    pred: isFutureArray,
    error: invalidArgumentOf('be an Array of valid Futures')
  };

  function application(n, f, type, args, prev){
    if(args.length < 2 && type.pred(args[0])) return captureApplicationContext(prev, n, f);
    var e = args.length > 1 ? invalidArity(f, args) : type.error(f.name, n - 1, args[0]);
    captureStackTrace(e, f);
    throw withExtraContext(e, prev);
  }

  function application1(f, type, args){
    return application(1, f, type, args, nil);
  }

  function Future(computation){
    if(arguments.length > 1) throw invalidArity(Future, arguments);
    if(!isFunction(computation)) throw invalidArgument('Future', 0, 'be a Function', computation);
    return new Computation(captureContext(nil, 'first application of Future', Future), computation);
  }

  function isFuture(x){
    return x instanceof Future || type(x) === $$type;
  }

  Future['@@type'] = $$type;
  Future[FL.of] = resolve;
  Future[FL.chainRec] = chainRec;

  Future.prototype['@@show'] = function Future$show(){
    return this.toString();
  };

  Future.prototype.pipe = function Future$pipe(f){
    if(!isFunction(f)) throw invalidArgument('Future#pipe', 0, 'be a Function', f);
    return f(this);
  };

  Future.prototype[FL.ap] = function Future$FL$ap(other){
    var context = captureContext(nil, 'a Fantasy Land dispatch to ap', Future$FL$ap);
    return other._transform(new ApTransformation(context, this));
  };

  Future.prototype[FL.map] = function Future$FL$map(mapper){
    var context = captureContext(nil, 'a Fantasy Land dispatch to map', Future$FL$map);
    return this._transform(new MapTransformation(context, mapper));
  };

  Future.prototype[FL.bimap] = function Future$FL$bimap(lmapper, rmapper){
    var context = captureContext(nil, 'a Fantasy Land dispatch to bimap', Future$FL$bimap);
    return this._transform(new BimapTransformation(context, lmapper, rmapper));
  };

  Future.prototype[FL.chain] = function Future$FL$chain(mapper){
    var context = captureContext(nil, 'a Fantasy Land dispatch to chain', Future$FL$chain);
    return this._transform(new ChainTransformation(context, mapper));
  };

  Future.prototype[FL.alt] = function Future$FL$alt(other){
    var context = captureContext(nil, 'a Fantasy Land dispatch to alt', Future$FL$alt);
    return this._transform(new AltTransformation(context, other));
  };

  Future.prototype.extractLeft = function Future$extractLeft(){
    return [];
  };

  Future.prototype.extractRight = function Future$extractRight(){
    return [];
  };

  Future.prototype._transform = function Future$transform(transformation){
    return new Transformer(transformation.context, this, cons(transformation, nil));
  };

  Future.prototype.isTransformer = false;
  Future.prototype.context = nil;
  Future.prototype.arity = 0;
  Future.prototype.name = 'future';

  Future.prototype.toString = function(){
    var str = this.name;
    for(var i = 1; i <= this.arity; i++){
      str += ' (' + show(this['$' + String(i)]) + ')';
    }
    return str;
  };

  function createInterpreter(arity, name, interpret){
    var Interpreter = function(context, $1, $2, $3){
      this.context = context;
      this.$1 = $1;
      this.$2 = $2;
      this.$3 = $3;
    };

    Interpreter.prototype = Object.create(Future.prototype);
    Interpreter.prototype.arity = arity;
    Interpreter.prototype.name = name;
    Interpreter.prototype._interpret = interpret;

    return Interpreter;
  }

  var Computation =
  createInterpreter(1, 'Future', function Computation$interpret(rec, rej, res){
    var computation = this.$1, open = false, cancel = noop, cont = function(){ open = true; };
    try{
      cancel = computation(function Computation$rej(x){
        cont = function Computation$rej$cont(){
          open = false;
          rej(x);
        };
        if(open){
          cont();
        }
      }, function Computation$res(x){
        cont = function Computation$res$cont(){
          open = false;
          res(x);
        };
        if(open){
          cont();
        }
      }) || noop;
    }catch(e){
      rec(wrapException(e, this));
      return noop;
    }
    if(!(isFunction(cancel) && cancel.length === 0)){
      rec(wrapException(typeError(
        'The computation was expected to return a nullary function or void\n' +
        '  Actual: ' + show(cancel)
      ), this));
      return noop;
    }
    cont();
    return function Computation$cancel(){
      if(open){
        open = false;
        cancel && cancel();
      }
    };
  });

  var Never = createInterpreter(0, 'never', function Never$interpret(){
    return noop;
  });

  Never.prototype._isNever = true;

  var never = new Never(nil);

  function isNever(x){
    return isFuture(x) && x._isNever === true;
  }

  var Crash = createInterpreter(1, 'crash', function Crash$interpret(rec){
    rec(this.$1);
    return noop;
  });

  function crash(x){
    return new Crash(application1(crash, any, arguments), x);
  }

  var Reject = createInterpreter(1, 'reject', function Reject$interpret(rec, rej){
    rej(this.$1);
    return noop;
  });

  Reject.prototype.extractLeft = function Reject$extractLeft(){
    return [this.$1];
  };

  function reject(x){
    return new Reject(application1(reject, any, arguments), x);
  }

  var Resolve = createInterpreter(1, 'resolve', function Resolve$interpret(rec, rej, res){
    res(this.$1);
    return noop;
  });

  Resolve.prototype.extractRight = function Resolve$extractRight(){
    return [this.$1];
  };

  function resolve(x){
    return new Resolve(application1(resolve, any, arguments), x);
  }

  //Note: This function is not curried because it's only used to satisfy the
  //      Fantasy Land ChainRec specification.
  function chainRec(step, init){
    return resolve(Next(init))._transform(new ChainTransformation(nil, function chainRec$recur(o){
      return o.done ?
             resolve(o.value) :
             step(Next, Done, o.value)._transform(new ChainTransformation(nil, chainRec$recur));
    }));
  }

  var Transformer = createInterpreter(2, '', function Transformer$interpret(rec, rej, res){

    //These are the cold, and hot, transformation stacks. The cold actions are those that
    //have yet to run parallel computations, and hot are those that have.
    var cold = nil, hot = nil;

    //These combined variables define our current state.
    // future         = the future we are currently forking
    // transformation = the transformation to be informed when the future settles
    // cancel         = the cancel function of the current future
    // settled        = a boolean indicating whether a new tick should start
    // async          = a boolean indicating whether we are awaiting a result asynchronously
    var future, transformation, cancel = noop, settled, async = true, it;

    //Takes an transformation from the top of the hot stack and returns it.
    function nextHot(){
      var x = hot.head;
      hot = hot.tail;
      return x;
    }

    //Takes an transformation from the top of the cold stack and returns it.
    function nextCold(){
      var x = cold.head;
      cold = cold.tail;
      return x;
    }

    //This function is called with a future to use in the next tick.
    //Here we "flatten" the actions of another Sequence into our own actions,
    //this is the magic that allows for infinitely stack safe recursion because
    //actions like ChainAction will return a new Sequence.
    //If we settled asynchronously, we call drain() directly to run the next tick.
    function settle(m){
      settled = true;
      future = m;
      if(future.isTransformer){
        var tail = future.$2;
        while(!isNil(tail)){
          cold = cons(tail.head, cold);
          tail = tail.tail;
        }
        future = future.$1;
      }
      if(async) drain();
    }

    //This function serves as a rejection handler for our current future.
    //It will tell the current transformation that the future rejected, and it will
    //settle the current tick with the transformation's answer to that.
    function rejected(x){
      settle(transformation.rejected(x));
    }

    //This function serves as a resolution handler for our current future.
    //It will tell the current transformation that the future resolved, and it will
    //settle the current tick with the transformation's answer to that.
    function resolved(x){
      settle(transformation.resolved(x));
    }

    //This function is passed into actions when they are "warmed up".
    //If the transformation decides that it has its result, without the need to await
    //anything else, then it can call this function to force "early termination".
    //When early termination occurs, all actions which were stacked prior to the
    //terminator will be skipped. If they were already hot, they will also be
    //sent a cancel signal so they can cancel their own concurrent computations,
    //as their results are no longer needed.
    function early(m, terminator){
      cancel();
      cold = nil;
      if(async && transformation !== terminator){
        transformation.cancel();
        while((it = nextHot()) && it !== terminator) it.cancel();
      }
      settle(m);
    }

    //This will cancel the current Future, the current transformation, and all stacked hot actions.
    function Sequence$cancel(){
      cancel();
      transformation && transformation.cancel();
      while(it = nextHot()) it.cancel();
    }

    //This function is called when an exception is caught.
    function exception(e){
      Sequence$cancel();
      settled = true;
      cold = hot = nil;
      var error = wrapException(e, future);
      future = never;
      rec(error);
    }

    //This function serves to kickstart concurrent computations.
    //Takes all actions from the cold stack in reverse order, and calls run() on
    //each of them, passing them the "early" function. If any of them settles (by
    //calling early()), we abort. After warming up all actions in the cold queue,
    //we warm up the current transformation as well.
    function warmupActions(){
      cold = reverse(cold);
      while(cold !== nil){
        it = cold.head.run(early);
        if(settled) return;
        hot = cons(it, hot);
        cold = cold.tail;
      }
      transformation = transformation.run(early);
    }

    //This function represents our main execution loop. By "tick", we've been
    //referring to the execution of one iteration in the while-loop below.
    function drain(){
      async = false;
      while(true){
        settled = false;
        if(transformation = nextCold()){
          cancel = future._interpret(exception, rejected, resolved);
          if(!settled) warmupActions();
        }else if(transformation = nextHot()){
          cancel = future._interpret(exception, rejected, resolved);
        }else break;
        if(settled) continue;
        async = true;
        return;
      }
      cancel = future._interpret(exception, rej, res);
    }

    //Start the execution loop.
    settle(this);

    //Return the cancellation function.
    return Sequence$cancel;

  });

  Transformer.prototype.isTransformer = true;

  Transformer.prototype._transform = function Transformer$_transform(transformation){
    return new Transformer(transformation.context, this.$1, cons(transformation, this.$2));
  };

  Transformer.prototype.toString = function Transformer$toString(){
    var i, str = this.$1.toString(), str2, tail = this.$2;

    while(!isNil(tail)){
      str2 = tail.head.name;
      for(i = 1; i <= tail.head.arity; i++){
        str2 += ' (' + show(tail.head['$' + String(i)]) + ')';
      }
      str = str2 + ' (' + str + ')';
      tail = tail.tail;
    }

    return str;
  };

  function BaseTransformation$rejected(x){
    this.cancel();
    return new Reject(this.context, x);
  }

  function BaseTransformation$resolved(x){
    this.cancel();
    return new Resolve(this.context, x);
  }

  var BaseTransformation = {
    rejected: BaseTransformation$rejected,
    resolved: BaseTransformation$resolved,
    run: moop,
    cancel: noop,
    context: nil,
    arity: 0,
    name: 'transform'
  };

  function wrapHandler(handler){
    return function transformationHandler(x){
      var m;
      try{
        m = handler.call(this, x);
      }catch(e){
        return new Crash(this.context, e);
      }
      if(isFuture(m)){
        return m;
      }
      return new Crash(this.context, invalidFuture(
        this.name + ' expects the return value from the function it\'s given', m,
        '\n  When called with: ' + show(x)
      ));
    };
  }

  function createTransformation(arity, name, prototype){
    var Transformation = function(context, $1, $2){
      this.context = context;
      this.$1 = $1;
      this.$2 = $2;
    };

    Transformation.prototype = Object.create(BaseTransformation);
    Transformation.prototype.arity = arity;
    Transformation.prototype.name = name;

    if(typeof prototype.rejected === 'function'){
      Transformation.prototype.rejected = wrapHandler(prototype.rejected);
    }

    if(typeof prototype.resolved === 'function'){
      Transformation.prototype.resolved = wrapHandler(prototype.resolved);
    }

    if(typeof prototype.run === 'function'){
      Transformation.prototype.run = prototype.run;
    }

    return Transformation;
  }

  var ApTransformation = createTransformation(1, 'ap', {
    resolved: function ApTransformation$resolved(f){
      if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
      throw typeError(
        'ap expects the second Future to resolve to a Function\n' +
        '  Actual: ' + show(f)
      );
    }
  });

  var AltTransformation = createTransformation(1, 'alt', {
    rejected: function AltTransformation$rejected(){ return this.$1 }
  });

  var MapTransformation = createTransformation(1, 'map', {
    resolved: function MapTransformation$resolved(x){
      return new Resolve(this.context, call(this.$1, x));
    }
  });

  var BimapTransformation = createTransformation(2, 'bimap', {
    rejected: function BimapTransformation$rejected(x){
      return new Reject(this.context, call(this.$1, x));
    },
    resolved: function BimapTransformation$resolved(x){
      return new Resolve(this.context, call(this.$2, x));
    }
  });

  var ChainTransformation = createTransformation(1, 'chain', {
    resolved: function ChainTransformation$resolved(x){ return call(this.$1, x) }
  });

  var After = createInterpreter(2, 'after', function After$interpret(rec, rej, res){
    var id = setTimeout(res, this.$1, this.$2);
    return function After$cancel(){ clearTimeout(id); };
  });

  After.prototype.extractRight = function After$extractRight(){
    return [this.$2];
  };

  function alwaysNever(_){
    return never;
  }

  function after(time){
    var context1 = application1(after, positiveInteger, arguments);
    return time === Infinity ? alwaysNever : (function after(value){
      var context2 = application(2, after, any, arguments, context1);
      return new After(context2, time, value);
    });
  }

  var alternative = {pred: isAlt, error: invalidArgumentOf('have Alt implemented')};

  function alt(left){
    if(isFuture(left)){
      var context1 = application1(alt, future, arguments);
      return function alt(right){
        var context2 = application(2, alt, future, arguments, context1);
        return right._transform(new AltTransformation(context2, left));
      };
    }

    var context = application1(alt, alternative, arguments);
    return function alt(right){
      application(2, alt, alternative, arguments, context);
      return left[FL.alt](right);
    };
  }

  var AndTransformation = createTransformation(1, 'and', {
    resolved: function AndTransformation$resolved(){ return this.$1 }
  });

  function and(left){
    var context1 = application1(and, future, arguments);
    return function and(right){
      var context2 = application(2, and, future, arguments, context1);
      return right._transform(new AndTransformation(context2, left));
    };
  }

  var apply = {pred: isApply, error: invalidArgumentOf('have Apply implemented')};

  function ap(mx){
    if(isFuture(mx)){
      var context1 = application1(ap, future, arguments);
      return function ap(mf){
        var context2 = application(2, ap, future, arguments, context1);
        return mf._transform(new ApTransformation(context2, mx));
      };
    }

    var context = application1(ap, apply, arguments);
    return function ap(mf){
      application(2, ap, apply, arguments, context);
      return mx[FL.ap](mf);
    };
  }

  function invalidPromise(p, f, a){
    return typeError(
      'encaseP() expects the function it\'s given to return a Promise/Thenable'
      + '\n  Actual: ' + show(p) + '\n  From calling: ' + show(f)
      + '\n  With: ' + show(a)
    );
  }

  var EncaseP = createInterpreter(2, 'encaseP', function EncaseP$interpret(rec, rej, res){
    var open = true, fn = this.$1, arg = this.$2, p;
    try{
      p = fn(arg);
    }catch(e){
      rec(wrapException(e, this));
      return noop;
    }
    if(!isThenable(p)){
      rec(wrapException(invalidPromise(p, fn, arg), this));
      return noop;
    }
    p.then(function EncaseP$res(x){
      if(open){
        open = false;
        res(x);
      }
    }, function EncaseP$rej(x){
      if(open){
        open = false;
        rej(x);
      }
    });
    return function EncaseP$cancel(){ open = false; };
  });

  function encaseP(f){
    var context1 = application1(encaseP, func, arguments);
    return function encaseP(x){
      var context2 = application(2, encaseP, any, arguments, context1);
      return new EncaseP(context2, f, x);
    };
  }

  function attemptP(_){
    return encaseP.apply(this, arguments)(undefined);
  }

  var Encase = createInterpreter(2, 'encase', function Encase$interpret(rec, rej, res){
    var fn = this.$1, r;
    try{ r = fn(this.$2); }catch(e){ rej(e); return noop }
    res(r);
    return noop;
  });

  function encase(f){
    var context1 = application1(encase, func, arguments);
    return function encase(x){
      var context2 = application(2, encase, any, arguments, context1);
      return new Encase(context2, f, x);
    };
  }

  function attempt(_){
    return encase.apply(this, arguments)(undefined);
  }

  var bifunctor = {pred: isBifunctor, error: invalidArgumentOf('have Bifunctor implemented')};

  function bimap(f){
    var context1 = application1(bimap, func, arguments);
    return function bimap(g){
      var context2 = application(2, bimap, func, arguments, context1);
      return function bimap(m){
        var context3 = application(3, bimap, bifunctor, arguments, context2);
        return isFuture(m) ?
               m._transform(new BimapTransformation(context3, f, g)) :
               m[FL.bimap](f, g);
      };
    };
  }

  function Eager(future){
    var _this = this;
    _this.rec = noop;
    _this.rej = noop;
    _this.res = noop;
    _this.crashed = false;
    _this.rejected = false;
    _this.resolved = false;
    _this.value = null;
    _this.cancel = future._interpret(function Eager$crash(x){
      _this.value = x;
      _this.crashed = true;
      _this.cancel = noop;
      _this.rec(x);
    }, function Eager$reject(x){
      _this.value = x;
      _this.rejected = true;
      _this.cancel = noop;
      _this.rej(x);
    }, function Eager$resolve(x){
      _this.value = x;
      _this.resolved = true;
      _this.cancel = noop;
      _this.res(x);
    });
  }

  Eager.prototype = Object.create(Future.prototype);

  Eager.prototype._interpret = function Eager$interpret(rec, rej, res){
    if(this.crashed) rec(this.value);
    else if(this.rejected) rej(this.value);
    else if(this.resolved) res(this.value);
    else{
      this.rec = rec;
      this.rej = rej;
      this.res = res;
    }
    return this.cancel;
  };

  function earlyCrash(early, x){
    early(crash(x));
  }

  function earlyReject(early, x){
    early(reject(x));
  }

  function earlyResolve(early, x){
    early(resolve(x));
  }

  function createParallelTransformation(name, rec, rej, res, prototype){
    var ParallelTransformation = createTransformation(1, name, Object.assign({
      run: function Parallel$run(early){
        var eager = new Eager(this.$1);
        var transformation = new ParallelTransformation(this.context, eager);
        function Parallel$early(m){ early(m, transformation); }
        transformation.cancel = eager._interpret(
          function Parallel$rec(x){ rec(Parallel$early, x); },
          function Parallel$rej(x){ rej(Parallel$early, x); },
          function Parallel$res(x){ res(Parallel$early, x); }
        );
        return transformation;
      }
    }, prototype));
    return ParallelTransformation;
  }

  var PairTransformation = createTransformation(1, 'pair', {
    resolved: function PairTransformation$resolved(x){
      return new Resolve(this.context, [x, this.$1]);
    }
  });

  var BothTransformation =
  createParallelTransformation('both', earlyCrash, earlyReject, noop, {
    resolved: function BothTransformation$resolved(x){
      return this.$1._transform(new PairTransformation(this.context, x));
    }
  });

  function both(left){
    var context1 = application1(both, future, arguments);
    return function both(right){
      var context2 = application(2, both, future, arguments, context1);
      return right._transform(new BothTransformation(context2, left));
    };
  }

  var Cold = 0;
  var Pending = 1;
  var Crashed = 2;
  var Rejected = 3;
  var Resolved = 4;

  function Queued(rec, rej, res){
    this[Crashed] = rec;
    this[Rejected] = rej;
    this[Resolved] = res;
  }

  var Cache = createInterpreter(1, 'cache', function Cache$interpret(rec, rej, res){
    var cancel = noop;

    switch(this._state){
      case Pending: cancel = this._addToQueue(rec, rej, res); break;
      case Crashed: rec(this._value); break;
      case Rejected: rej(this._value); break;
      case Resolved: res(this._value); break;
      default: cancel = this._addToQueue(rec, rej, res); this.run();
    }

    return cancel;
  });

  Cache.prototype._cancel = noop;
  Cache.prototype._queue = [];
  Cache.prototype._queued = 0;
  Cache.prototype._value = undefined;
  Cache.prototype._state = Cold;

  Cache.prototype.extractLeft = function Cache$extractLeft(){
    return this._state === Rejected ? [this._value] : [];
  };

  Cache.prototype.extractRight = function Cache$extractRight(){
    return this._state === Resolved ? [this._value] : [];
  };

  Cache.prototype._addToQueue = function Cache$addToQueue(rec, rej, res){
    var _this = this;
    if(_this._state > Pending) return noop;
    var i = _this._queue.push(new Queued(rec, rej, res)) - 1;
    _this._queued = _this._queued + 1;

    return function Cache$removeFromQueue(){
      if(_this._state > Pending) return;
      _this._queue[i] = undefined;
      _this._queued = _this._queued - 1;
      if(_this._queued === 0) _this.reset();
    };
  };

  Cache.prototype._drainQueue = function Cache$drainQueue(){
    if(this._state <= Pending) return;
    if(this._queued === 0) return;
    var queue = this._queue;
    var length = queue.length;
    var state = this._state;
    var value = this._value;

    for(var i = 0; i < length; i++){
      queue[i] && queue[i][state](value);
      queue[i] = undefined;
    }

    this._queue = undefined;
    this._queued = 0;
  };

  Cache.prototype.crash = function Cache$crash(error){
    if(this._state > Pending) return;
    this._value = error;
    this._state = Crashed;
    this._drainQueue();
  };

  Cache.prototype.reject = function Cache$reject(reason){
    if(this._state > Pending) return;
    this._value = reason;
    this._state = Rejected;
    this._drainQueue();
  };

  Cache.prototype.resolve = function Cache$resolve(value){
    if(this._state > Pending) return;
    this._value = value;
    this._state = Resolved;
    this._drainQueue();
  };

  Cache.prototype.run = function Cache$run(){
    var _this = this;
    if(_this._state > Cold) return;
    _this._state = Pending;
    _this._cancel = _this.$1._interpret(
      function Cache$fork$rec(x){ _this.crash(x); },
      function Cache$fork$rej(x){ _this.reject(x); },
      function Cache$fork$res(x){ _this.resolve(x); }
    );
  };

  Cache.prototype.reset = function Cache$reset(){
    if(this._state === Cold) return;
    if(this._state === Pending) this._cancel();
    this._cancel = noop;
    this._queue = [];
    this._queued = 0;
    this._value = undefined;
    this._state = Cold;
  };

  function cache(m){
    return new Cache(application1(cache, future, arguments), m);
  }

  var ChainRejTransformation = createTransformation(1, 'chainRej', {
    rejected: function ChainRejTransformation$rejected(x){ return call(this.$1, x) }
  });

  function chainRej(f){
    var context1 = application1(chainRej, func, arguments);
    return function chainRej(m){
      var context2 = application(2, chainRej, future, arguments, context1);
      return m._transform(new ChainRejTransformation(context2, f));
    };
  }

  var monad = {pred: isChain, error: invalidArgumentOf('have Chain implemented')};

  function chain(f){
    var context1 = application1(chain, func, arguments);
    return function chain(m){
      var context2 = application(2, chain, monad, arguments, context1);
      return isFuture(m) ?
             m._transform(new ChainTransformation(context2, f)) :
             m[FL.chain](f);
    };
  }

  function done(callback){
    var context1 = application1(done, func, arguments);
    function done$res(x){
      callback(null, x);
    }
    return function done(m){
      application(2, done, future, arguments, context1);
      return m._interpret(raise, callback, done$res);
    };
  }

  function extractLeft(m){
    application1(extractLeft, future, arguments);
    return m.extractLeft();
  }

  function extractRight(m){
    application1(extractRight, future, arguments);
    return m.extractRight();
  }

  var FoldTransformation = createTransformation(2, 'fold', {
    rejected: function FoldTransformation$rejected(x){
      return new Resolve(this.context, call(this.$1, x));
    },
    resolved: function FoldTransformation$resolved(x){
      return new Resolve(this.context, call(this.$2, x));
    }
  });

  function fold(f){
    var context1 = application1(fold, func, arguments);
    return function fold(g){
      var context2 = application(2, fold, func, arguments, context1);
      return function fold(m){
        var context3 = application(3, fold, future, arguments, context2);
        return m._transform(new FoldTransformation(context3, f, g));
      };
    };
  }

  function forkCatch(f){
    var context1 = application1(forkCatch, func, arguments);
    return function forkCatch(g){
      var context2 = application(2, forkCatch, func, arguments, context1);
      return function forkCatch(h){
        var context3 = application(3, forkCatch, func, arguments, context2);
        return function forkCatch(m){
          application(4, forkCatch, future, arguments, context3);
          return m._interpret(f, g, h);
        };
      };
    };
  }

  function fork(f){
    var context1 = application1(fork, func, arguments);
    return function fork(g){
      var context2 = application(2, fork, func, arguments, context1);
      return function fork(m){
        application(3, fork, future, arguments, context2);
        return m._interpret(raise, f, g);
      };
    };
  }

  var Undetermined = 0;
  var Synchronous = 1;
  var Asynchronous = 2;

  /*eslint consistent-return: 0 */

  function invalidIteration(o){
    return typeError(
      'The iterator did not return a valid iteration from iterator.next()\n' +
      '  Actual: ' + show(o)
    );
  }

  function invalidState(x){
    return invalidFuture(
      'go() expects the value produced by the iterator', x,
      '\n  Tip: If you\'re using a generator, make sure you always yield a Future'
    );
  }

  var Go = createInterpreter(1, 'go', function Go$interpret(rec, rej, res){

    var _this = this, timing = Undetermined, cancel = noop, state, value, iterator;

    function crash(e){
      rec(wrapException(e, _this));
    }

    try{
      iterator = _this.$1();
    }catch(e){
      crash(e);
      return noop;
    }

    if(!isIterator(iterator)){
      crash(invalidArgument('go', 0, 'return an iterator, maybe you forgot the "*"', iterator));
      return noop;
    }

    function resolved(x){
      value = x;
      if(timing === Asynchronous) return drain();
      timing = Synchronous;
    }

    function drain(){
      //eslint-disable-next-line no-constant-condition
      while(true){
        try{
          state = iterator.next(value);
        }catch(e){
          return crash(e);
        }
        if(!isIteration(state)) return crash(invalidIteration(state));
        if(state.done) break;
        if(!isFuture(state.value)){
          return crash(invalidState(state.value));
        }
        timing = Undetermined;
        cancel = state.value._interpret(crash, rej, resolved);
        if(timing === Undetermined) return timing = Asynchronous;
      }
      res(state.value);
    }

    drain();

    return function Go$cancel(){ cancel(); };

  });

  function go(generator){
    return new Go(application1(go, func, arguments), generator);
  }

  function invalidDisposal(m, f, x){
    return invalidFuture(
      'hook() expects the return value from the first function it\'s given', m,
      '\n  From calling: ' + show(f) + '\n  With: ' + show(x)
    );
  }

  function invalidConsumption(m, f, x){
    return invalidFuture(
      'hook() expects the return value from the second function it\'s given', m,
      '\n  From calling: ' + show(f) + '\n  With: ' + show(x)
    );
  }

  var Hook = createInterpreter(3, 'hook', function Hook$interpret(rec, rej, res){

    var _this = this, _acquire = this.$1, _dispose = this.$2, _consume = this.$3;
    var cancel, cancelConsume = noop, resource, value, cont = noop;

    function Hook$done(){
      cont(value);
    }

    function Hook$rec(x){
      rec(wrapException(x, _this));
    }

    function Hook$dispose(){
      var disposal;
      try{
        disposal = _dispose(resource);
      }catch(e){
        return Hook$rec(e);
      }
      if(!isFuture(disposal)){
        return Hook$rec(invalidDisposal(disposal, _dispose, resource));
      }
      disposal._interpret(Hook$rec, Hook$disposalRejected, Hook$done);
      cancel = Hook$cancelDisposal;
    }

    function Hook$cancelConsumption(){
      cancelConsume();
      Hook$dispose();
      Hook$cancelDisposal();
    }

    function Hook$cancelDisposal(){
      cont = noop;
    }

    function Hook$disposalRejected(x){
      Hook$rec(new Error('The disposal Future rejected with ' + show(x)));
    }

    function Hook$consumptionException(x){
      cont = Hook$rec;
      value = x;
      Hook$dispose();
    }

    function Hook$consumptionRejected(x){
      cont = rej;
      value = x;
      Hook$dispose();
    }

    function Hook$consumptionResolved(x){
      cont = res;
      value = x;
      Hook$dispose();
    }

    function Hook$consume(x){
      resource = x;
      var consumption;
      try{
        consumption = _consume(resource);
      }catch(e){
        return Hook$consumptionException(e);
      }
      if(!isFuture(consumption)){
        return Hook$consumptionException(invalidConsumption(consumption, _consume, resource));
      }
      cancel = Hook$cancelConsumption;
      cancelConsume = consumption._interpret(
        Hook$consumptionException,
        Hook$consumptionRejected,
        Hook$consumptionResolved
      );
    }

    var cancelAcquire = _acquire._interpret(Hook$rec, rej, Hook$consume);
    cancel = cancel || cancelAcquire;

    return function Hook$fork$cancel(){
      rec = raise;
      cancel();
    };

  });

  function hook(acquire){
    var context1 = application1(hook, future, arguments);
    return function hook(dispose){
      var context2 = application(2, hook, func, arguments, context1);
      return function hook(consume){
        var context3 = application(3, hook, func, arguments, context2);
        return new Hook(context3, acquire, dispose, consume);
      };
    };
  }

  var LastlyTransformation = createTransformation(1, 'lastly', {
    rejected: function LastlyAction$rejected(x){
      return this.$1._transform(new AndTransformation(this.context, new Reject(this.context, x)));
    },
    resolved: function LastlyAction$resolved(x){
      return this.$1._transform(new AndTransformation(this.context, new Resolve(this.context, x)));
    }
  });

  function lastly(cleanup){
    var context1 = application1(lastly, future, arguments);
    return function lastly(program){
      var context2 = application(2, lastly, future, arguments, context1);
      return program._transform(new LastlyTransformation(context2, cleanup));
    };
  }

  var MapRejTransformation = createTransformation(1, 'mapRej', {
    rejected: function MapRejTransformation$rejected(x){
      return new Reject(this.context, call(this.$1, x));
    }
  });

  function mapRej(f){
    var context1 = application1(mapRej, func, arguments);
    return function mapRej(m){
      var context2 = application(2, mapRej, future, arguments, context1);
      return m._transform(new MapRejTransformation(context2, f));
    };
  }

  var functor = {pred: isFunctor, error: invalidArgumentOf('have Functor implemented')};

  function map(f){
    var context1 = application1(map, func, arguments);
    return function map(m){
      var context2 = application(2, map, functor, arguments, context1);
      return isFuture(m) ?
             m._transform(new MapTransformation(context2, f)) :
             m[FL.map](f);
    };
  }

  var Node = createInterpreter(1, 'node', function Node$interpret(rec, rej, res){
    function Node$done(err, val){
      cont = err ? function EncaseN3$rej(){
        open = false;
        rej(err);
      } : function EncaseN3$res(){
        open = false;
        res(val);
      };
      if(open){
        cont();
      }
    }
    var open = false, cont = function(){ open = true; };
    try{
      call(this.$1, Node$done);
    }catch(e){
      rec(wrapException(e, this));
      open = false;
      return noop;
    }
    cont();
    return function Node$cancel(){ open = false; };
  });

  function node(f){
    return new Node(application1(node, func, arguments), f);
  }

  var ParallelApTransformation =
  createParallelTransformation('parallelAp', earlyCrash, earlyReject, noop, {
    resolved: function ParallelApTransformation$resolved(f){
      if(isFunction(f)) return this.$1._transform(new MapTransformation(this.context, f));
      throw typeError(
        'parallelAp expects the second Future to resolve to a Function\n' +
        '  Actual: ' + show(f)
      );
    }
  });

  function parallelAp(mx){
    var context1 = application1(parallelAp, future, arguments);
    return function parallelAp(mf){
      var context2 = application(2, parallelAp, future, arguments, context1);
      return mf._transform(new ParallelApTransformation(context2, mx));
    };
  }

  var Parallel = createInterpreter(2, 'parallel', function Parallel$interpret(rec, rej, res){

    var _this = this, futures = this.$2, length = futures.length;
    var max = Math.min(this.$1, length), cancels = new Array(length), out = new Array(length);
    var cursor = 0, running = 0, blocked = false;

    function Parallel$cancel(){
      cursor = length;
      for(var n = 0; n < length; n++) cancels[n] && cancels[n]();
    }

    function Parallel$run(idx){
      running++;
      cancels[idx] = futures[idx]._interpret(function Parallel$rec(e){
        cancels[idx] = noop;
        Parallel$cancel();
        rec(wrapException(e, _this));
      }, function Parallel$rej(reason){
        cancels[idx] = noop;
        Parallel$cancel();
        rej(reason);
      }, function Parallel$res(value){
        cancels[idx] = noop;
        out[idx] = value;
        running--;
        if(cursor === length && running === 0) res(out);
        else if(blocked) Parallel$drain();
      });
    }

    function Parallel$drain(){
      blocked = false;
      while(cursor < length && running < max) Parallel$run(cursor++);
      blocked = true;
    }

    Parallel$drain();

    return Parallel$cancel;

  });

  var emptyArray = resolve([]);

  function parallel(max){
    var context1 = application1(parallel, positiveInteger, arguments);
    return function parallel(ms){
      var context2 = application(2, parallel, futureArray, arguments, context1);
      return ms.length === 0 ? emptyArray : new Parallel(context2, max, ms);
    };
  }

  var RaceTransformation =
  createParallelTransformation('race', earlyCrash, earlyReject, earlyResolve, {});

  function race(left){
    var context1 = application1(race, future, arguments);
    return function race(right){
      var context2 = application(2, race, future, arguments, context1);
      return right._transform(new RaceTransformation(context2, left));
    };
  }

  function uncurry(f){
    return function(a, b){
      return f(a)(b);
    };
  }

  var Par = concurrify(Future, never, uncurry(race), uncurry(parallelAp));

  function isParallel(x){
    return x instanceof Par || type(x) === Par['@@type'];
  }

  function promise(m){
    application1(promise, future, arguments);
    return new Promise(function promise$computation(res, rej){
      m._interpret(rej, rej, res);
    });
  }

  var RejectAfter =
  createInterpreter(2, 'rejectAfter', function RejectAfter$interpret(rec, rej){
    var id = setTimeout(rej, this.$1, this.$2);
    return function RejectAfter$cancel(){ clearTimeout(id); };
  });

  RejectAfter.prototype.extractLeft = function RejectAfter$extractLeft(){
    return [this.$2];
  };

  function alwaysNever$1(_){
    return never;
  }

  function rejectAfter(time){
    var context1 = application1(rejectAfter, positiveInteger, arguments);
    return time === Infinity ? alwaysNever$1 : (function rejectAfter(value){
      var context2 = application(2, rejectAfter, any, arguments, context1);
      return new RejectAfter(context2, time, value);
    });
  }

  function seq(par){
    if(arguments.length > 1) throw invalidArity(seq, arguments);
    if(!isParallel(par)) throw invalidArgument('seq', 0, 'be a ConcurrentFuture', par);
    return par.sequential;
  }

  var SwapTransformation = createTransformation(0, 'swap', {
    resolved: function SwapTransformation$resolved(x){
      return new Reject(this.context, x);
    },
    rejected: function SwapTransformation$rejected(x){
      return new Resolve(this.context, x);
    }
  });

  function swap(m){
    var context = application1(swap, future, arguments);
    return m._transform(new SwapTransformation(context));
  }

  function value(res){
    var context1 = application1(value, func, arguments);
    return function value(m){
      application(2, value, future, arguments, context1);
      function value$rej(x){
        raise(error(
          'Future#value was called on a rejected Future\n' +
          '  Rejection: ' + show(x) + '\n' +
          '  Future: ' + show(m)
        ));
      }
      return m._interpret(raise, value$rej, res);
    };
  }

  value (console.log) (node (done => done (null, 42)));

}(sanctuaryTypeIdentifiers, sanctuaryShow, concurrify));
