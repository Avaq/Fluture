import {expectType, expectError} from 'tsd';

import * as fl from '../../index.js';

const fsn: fl.FutureInstance<string, number> = fl.resolve (42);
const fns: fl.FutureInstance<number, string> = fl.resolve ('a');

// Standard usage on Future instances.
expectType<fl.Never> (fl.alt (fl.never) (fl.never));
expectType<fl.Never> (fl.alt (fl.reject ('a')) (fl.never));
expectType<fl.Never> (fl.alt (fl.resolve ('a')) (fl.never));
expectType<fl.Never> (fl.alt (fl.never) (fl.reject ('a')));
expectType<fl.Resolved<string>> (fl.alt (fl.never) (fl.resolve ('a')));
expectType<fl.Resolved<number>> (fl.alt (fl.reject ('a')) (fl.resolve (42)));
expectType<fl.Resolved<number>> (fl.alt (fl.resolve (42)) (fl.reject ('a')));
expectType<fl.Resolved<number>> (fl.alt (fl.resolve (42)) (fl.resolve (42)));
expectType<fl.Rejected<number>> (fl.alt (fl.reject (42)) (fl.reject (42)));
expectType<fl.Rejected<string>> (fl.alt (fl.reject ('a')) (fl.reject (42)));
expectType<fl.Uncertain<string, number>> (fl.alt (fsn) (fsn));
expectType<fl.Resolved<number>> (fl.alt (fl.resolve ('a')) (fl.resolve (42)));
expectError (fl.alt (fsn) (fns));

// Usage with pipe on Future instances (https://git.io/JLx3F).
expectType<fl.Never> ((fl.never) .pipe (fl.alt (fl.never)));
expectType<fl.Never> ((fl.never) .pipe (fl.alt (fl.reject ('a'))));
expectType<fl.Never> ((fl.never) .pipe (fl.alt (fl.resolve ('a'))));
expectType<fl.Never> ((fl.reject ('a')) .pipe (fl.alt (fl.never)));
expectType<fl.Resolved<string>> ((fl.resolve ('a')) .pipe (fl.alt (fl.never)));
expectType<fl.Resolved<number>> ((fl.resolve (42)) .pipe (fl.alt (fl.reject ('a'))));
expectType<fl.Resolved<number>> ((fl.reject ('a')) .pipe (fl.alt (fl.resolve (42))));
expectType<fl.Resolved<number>> ((fl.resolve (42)) .pipe (fl.alt (fl.resolve (42))));
expectType<fl.Rejected<number>> ((fl.reject (42)) .pipe (fl.alt (fl.reject (42))));
expectType<fl.Rejected<string>> ((fl.reject (42)) .pipe (fl.alt (fl.reject ('a'))));
expectType<fl.Uncertain<string, number>> ((fsn) .pipe (fl.alt (fsn)));
expectType<fl.Resolved<number>> ((fl.resolve (42)) .pipe (fl.alt (fl.resolve ('a'))));
expectError ((fns) .pipe (fl.alt (fsn)));

const csn: fl.ConcurrentFutureInstance<string, number> = fl.Par (fl.resolve (42));
const cns: fl.ConcurrentFutureInstance<number, string> = fl.Par (fl.resolve ('a'));

// Standard usage on ConcurrentFuture instances.
expectType<fl.ConcurrentNever> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.never)));
expectType<fl.ConcurrentRejected<string>> (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.never)));
expectType<fl.ConcurrentResolved<string>> (fl.alt (fl.Par (fl.resolve ('a'))) (fl.Par (fl.never)));
expectType<fl.ConcurrentRejected<string>> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.reject ('a'))));
expectType<fl.ConcurrentResolved<string>> (fl.alt (fl.Par (fl.never)) (fl.Par (fl.resolve ('a'))));
expectType<fl.ConcurrentFutureInstance<string, number>> (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.resolve (42))));
expectType<fl.ConcurrentFutureInstance<string, number>> (fl.alt (fl.Par (fl.resolve (42))) (fl.Par (fl.reject ('a'))));
expectType<fl.ConcurrentResolved<number>> (fl.alt (fl.Par (fl.resolve (42))) (fl.Par (fl.resolve (42))));
expectType<fl.ConcurrentRejected<number>> (fl.alt (fl.Par (fl.reject (42))) (fl.Par (fl.reject (42))));
expectType<fl.ConcurrentUncertain<string, number>> (fl.alt (csn) (csn));
expectError (fl.alt (fl.Par (fl.resolve ('a'))) (fl.Par (fl.resolve (42))));
expectError (fl.alt (fl.Par (fl.reject ('a'))) (fl.Par (fl.reject (42))));
expectError (fl.alt (csn) (cns));
