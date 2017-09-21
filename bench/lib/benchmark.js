// @flow

'use strict';

export type BenchmarkOptions = {
    label: string,
    options: any
};

class Benchmark {
    label: string;
    options: any;

    /**
     * The `getArguments` static method may be overridden by subclasses. A
     * separate instance of the benchmark will be created and run for each of
     * the returned `BenchmarkOptions` objects.  Options may be accessed by
     * the benchmark via `this.options`.
     */
    static getArguments(): Array<BenchmarkOptions> {
        return [{ label: '', options: {} }];
    }

    constructor(opts: BenchmarkOptions) {
        this.label = opts.label;
        this.options = opts.options;
    }

    /**
     * The `setup` method is intended to be overridden by subclasses. It will be called once, prior to
     * running any benchmark iterations, and may set state on `this` which the benchmark later accesses.
     * If the setup involves an asynchronous step, `setup` may return a promise.
     */
    setup(): Promise<void> | void {}

    /**
     * The `bench` method is intended to be overridden by subclasses. It should contain the code to be
     * benchmarked. It may access state on `this` set by the `setup` function (but should not modify this
     * state). It will be called multiple times, the total number to be determined by the harness. If
     * the benchmark involves an asynchronous step, `bench` may return a promise.
     */
    bench(): Promise<void> | void {}

    /**
     * The `teardown` method is intended to be overridden by subclasses. It will be called once, after
     * running all benchmark iterations, and may perform any necessary cleanup. If cleaning up involves
     * an asynchronous step, `teardown` may return a promise.
     */
    teardown(): Promise<void> | void {}

    /**
     * Run the benchmark by executing `setup` once, sampling the execution time of `bench` some number of
     * times, and then executing `teardown`. Yields an array of execution times.
     */
    run(): Promise<Array<number>> {
        let elapsed = 0;
        const samples = [];

        const next = () => {
            // 210 samples => 20 observations for regression
            if (elapsed >= 300 && samples.length > 210) {
                return Promise.resolve(this.teardown()).then(() => samples);
            }

            const start = performance.now();
            return Promise.resolve(this.bench()).then(() => {
                const sample = performance.now() - start;
                elapsed += sample;
                samples.push(sample);
                return next();
            });
        };

        return Promise.resolve(this.setup()).then(next);
    }
}

module.exports = Benchmark;
