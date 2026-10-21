import hashlib, importlib.util, json, pathlib, subprocess, sys
project = pathlib.Path.cwd()
p = project / "docs/12"
runtime = pathlib.Path("/Users/drew.schillinger/shuttlebay/doctorews-laboratory/nightshift-community/.nightshift/release-0.4.0/scripts")
spec = importlib.util.spec_from_file_location("proof", runtime / "nightshift-behavior-proof.py")
proof = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proof)
checks = []
result = subprocess.run(["python3", str(runtime / "nightshift-behavior-proof.py"), "validate", "--project", str(project), "--task", "12", "--scenarios", str(p / "behavior-scenarios.json")], capture_output=True, text=True)
checks.append({"command": "behavior scenario validation", "exit_code": result.returncode, "output": result.stdout})
scope, tests = proof.scope_table(project, "12")
checks.append({"command": "deterministic Files to Change parsing without scope activation", "exit_code": 0, "scope": scope, "tests": sorted(tests)})
result = subprocess.run(["bash", str(runtime / "nightshift-spec-guardrail.sh")], input=json.dumps({"tool_name": "Write", "tool_input": {"file_path": str(p / "SPEC.md"), "content": (p / "SPEC.md").read_text()}}), capture_output=True, text=True)
guard = json.loads(result.stdout)
checks.append({"command": "spec guardrail", "exit_code": 0 if guard["decision"] == "approve" else 1, "output": guard})
repair = json.loads((p / "repair-check.receipt.json").read_text())
assert repair["status"] == "passed"
assert hashlib.sha256((p / "repair-checks.json").read_bytes()).hexdigest() == repair["manifest_sha256"]
for finding in repair["findings"]:
    assert finding["passed"] and finding["original_failed"] and finding["current_passed"]
    assert hashlib.sha256((project / finding["artifact"]).read_bytes()).hexdigest() == finding["artifact_sha256"]
    assert hashlib.sha256((project / finding["prior_artifact"]).read_bytes()).hexdigest() == finding["prior_sha256"]
checks.append({"command": "verify retained hash-bound repair-check.receipt.json without overwriting it", "exit_code": 0})
spec_text = (p / "SPEC.md").read_text()
cur = json.loads((p / "source-citations.current.json").read_text())
pre = json.loads((p / "source-citations.before.json").read_text())
assert cur["source_sha256"] == hashlib.sha256((p / "SPEC.md").read_bytes()).hexdigest()
assert cur["sources"] == spec_text.split("\n## Sources\n", 1)[1]
assert pre["source_sha256"] == hashlib.sha256((p / "SPEC.pre-adversarial-1.md").read_bytes()).hexdigest()
assert pre["sources"] != cur["sources"]
assert any(f["id"] == "SOURCE-CITATION-WORDING-REPAIR" for f in repair["findings"])
checks.append({"command": "source-citation projections match current SPEC.md and predecessor; SOURCE-CITATION-WORDING-REPAIR registered in receipt", "exit_code": 0})
review = json.loads((p / "classification-review-4.out.json").read_text())
scenarios = json.loads((p / "behavior-scenarios.json").read_text())
assert review["artifacts"]["provider"] != scenarios["author"]["provider"]
assert review["results"]["reviewed_input_sha256"] == proof.semantics(scenarios)
assert set(review["results"]["scenario_ids"]) == {c["id"] for c in scenarios["cases"]}
approved = review["status"] == "SUCCESS" and review["results"]["decision"] == "approve" and not review["results"]["findings"]
checks.append({"command": "independent classification approval, digest and complete case coverage", "exit_code": 0 if approved else 1, "findings": review["results"]["findings"]})
result = subprocess.run(["git", "diff", "--check"], capture_output=True, text=True)
checks.append({"command": "git diff --check", "exit_code": result.returncode, "output": result.stdout})
output = {"task": "12", "checks": checks, "outcome": "pass" if all(c["exit_code"] == 0 for c in checks) else "fail"}
(p / "product-check-6.out.json").write_text(json.dumps(output, indent=2) + "\n")
print(json.dumps(output, indent=2))
sys.exit(0 if output["outcome"] == "pass" else 1)
