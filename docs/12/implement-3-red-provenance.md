RED observations, before application changes.

Retained command: npm --prefix frontend test -- --reporter=verbose
Retained component log: implement-2-component-red-3.log; 10 failed missing-control assertions, 4 passed including both C05 recorder calibrations. Component test and application bytes remain unchanged since that run.
New command: npm --prefix frontend run test:e2e
New browser log: implement-3-browser-red-2.log; one missing All 6 control assertion; exit 1.
Baseline capture passed before this browser RED.
Manual acceptance: pending.
