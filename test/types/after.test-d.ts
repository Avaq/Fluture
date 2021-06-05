import {expectType} from 'tsd';

import * as fl from '../../index.js';

expectType<fl.Resolved<number>> (fl.after (1) (42));
expectType<fl.Resolved<string>> (fl.after (1) ('a'));

// https://github.com/microsoft/TypeScript/issues/32277
// expectType<fl.Never> (fl.after (Infinity) ('Finally!'));
