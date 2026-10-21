# Product boundary repair

MISSING_REFERENCE_CARDINALITY_BOUNDARY: verified scenario defect, C01. Separate public in-memory data now requires multiple references to contribute one fact and one card. Reference-counting is the deliberately wrong behavior.

TRANSIENT_SESSION_FILTER_NOT_OBSERVED: verified scenario defect, C05. The first cached destination render with the page mounted must show All and every destination fact. An effect-only later reset is the deliberately wrong behavior.

All nine public cases were inspected; C01 and C05 are affected. The hash-bound repair checker compares each complete case against its retained pre-repair snapshot: original mismatch and current exact match. This checks scenario repair coverage only; UI counterexamples remain required future RED tests, not observed behavior.
