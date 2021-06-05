import {expectType, expectError} from 'tsd';

import * as fl from '../../index.js';

const fsn: fl.Uncertain<string, number> = fl.resolve (42);
const fns: fl.Uncertain<number, string> = fl.resolve ('a');

// Standard usage on Future instances.
expectType<fl.Never> (fl.and (fl.never) (fl.never));
expectType<fl.Never> (fl.and (fl.never) (fl.resolve ('a')));
expectType<fl.Never> (fl.and (fl.reject ('a')) (fl.never));
expectType<fl.Never> (fl.and (fl.resolve ('a')) (fl.never));
expectType<fl.Rejected<string>> (fl.and (fl.reject ('a')) (fl.resolve (42)));
expectType<fl.Resolved<number>> (fl.and (fl.resolve (42)) (fl.resolve (42)));
expectType<fl.Rejected<number>> (fl.and (fl.reject (42)) (fl.reject (42)));
expectType<fl.Uncertain<string, number>> (fl.and (fsn) (fsn));
expectType<fl.Rejected<string>> (fl.and (fl.never) (fl.reject ('a')));
expectType<fl.Rejected<string>> (fl.and (fl.resolve (42)) (fl.reject ('a')));
expectType<fl.Rejected<number>> (fl.and (fl.reject ('a')) (fl.reject (42)));
expectError (fl.and (fsn) (fns));

// Usage with pipe on Future instances (https://git.io/JLx3F).
expectType<fl.Never> ((fl.never) .pipe (fl.and (fl.never)));
const workaround = (fl.resolve ('a')) .pipe (fl.and (fl.never)); expectType<fl.Never> (workaround);
expectType<fl.Never> ((fl.never) .pipe (fl.and (fl.reject ('a'))));
expectType<fl.Never> ((fl.never) .pipe (fl.and (fl.resolve ('a'))));
expectType<fl.Rejected<string>> ((fl.resolve (42)) .pipe (fl.and (fl.reject ('a'))));
expectType<fl.Resolved<number>> ((fl.resolve (42)) .pipe (fl.and (fl.resolve (42))));
expectType<fl.Rejected<number>> ((fl.reject (42)) .pipe (fl.and (fl.reject (42))));
expectType<fl.Uncertain<string, number>> ((fsn) .pipe (fl.and (fsn)));
expectType<fl.Rejected<string>> ((fl.reject ('a')) .pipe (fl.and (fl.never)));
expectType<fl.Rejected<string>> ((fl.reject ('a')) .pipe (fl.and (fl.resolve (42))));
expectType<fl.Rejected<number>> ((fl.reject (42)) .pipe (fl.and (fl.reject ('a'))));
expectError ((fns) .pipe (fl.and (fsn)));
