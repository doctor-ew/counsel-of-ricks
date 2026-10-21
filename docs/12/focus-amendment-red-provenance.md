Observed missing-feature RED on original SessionPage at commit 10b798f; restored the candidate afterward.

npm --prefix frontend test -- --reporter=verbose

Component: amended-request-component-red.log; 10 failed missing-control assertions and 4 passing tests including both recorder calibrations.
Browser: amended-complete-browser-red.log; missing accessible-filter assertion, exit1.
The browser test bytes are unchanged since that RED; component bytes match the fresh bot lock. No historical output is relabeled.
