Controller-owned test setup repair: the original locked Chromium test tries to focus a disabled predecessor. Preserve d9f7057 and its failure. The correction selects an enabled visible tabbable predecessor and verifies it has focus; no filter, contrast, order or keyboard assertions are removed. The scenario clarifies the same setup, requiring new independent classification, new locks and fresh RED before acceptance. Existing application candidate is retained; no old pass is relabeled.

The fresh design review also found omitted style-preservation assertions: include
width, background, border, box-shadow and text color for sidebar and cards. This
adds required checks rather than weakening the test. The prior same-provider
review cannot approve this Codex-authored amendment; route a fresh independent
Claude review using explicit author provenance.
