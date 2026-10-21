import hashlib, importlib.util, json, pathlib, subprocess, sys
project = pathlib.Path.cwd()
p = project / "docs/12"
runtime = pathlib.Path("/Users/drew.schillinger/shuttlebay/doctorews-laboratory/nightshift-community/.nightshift/tuesday-recovery/scripts")
module = importlib.util.spec_from_file_location("proof", runtime / "nightshift-behavior-proof.py")
proof = importlib.util.module_from_spec(module)
module.loader.exec_module(proof)
checks=[]
def record(command, code, detail=None):
    checks.append(dict(command=command, exit_code=code, detail=detail))
result=subprocess.run(["python3",str(runtime/"nightshift-behavior-proof.py"),"validate","--project",str(project),"--task","12","--scenarios",str(p/"behavior-scenarios.json")],capture_output=True,text=True)
record("behavior scenario validation",result.returncode,result.stdout+result.stderr)
result=subprocess.run(["bash",str(runtime/"nightshift-spec-guardrail.sh")],input=json.dumps({"tool_name":"Write","tool_input":{"file_path":str(p/"SPEC.md"),"content":(p/"SPEC.md").read_text()}}),capture_output=True,text=True)
guard=json.loads(result.stdout)
record("spec guardrail",0 if result.returncode==0 and guard["decision"]=="approve" else 1,guard)
doc=json.loads((p/"behavior-scenarios.json").read_text())
review=json.loads((p/"classification-review-11.out.json").read_text())
r=review["results"]
approved=(review["status"]=="SUCCESS" and r["decision"]=="approve" and not r["findings"] and r["reviewed_input_sha256"]==proof.semantics(doc) and set(r["scenario_ids"])=={c["id"] for c in doc["cases"]} and review["artifacts"]["provider"]!=doc["author"]["provider"])
record("independent classification approval with current semantic digest and complete public coverage",0 if approved else 1,r)
try:
    proof.reviewed(doc)
    record("classification attestation binding",0)
except Exception as e:
    record("classification attestation binding",1,str(e))
extract=json.loads((p/"product-extractor-2.out.json").read_text())
record("retained successful identifier extraction",0 if extract["status"]=="SUCCESS" and extract["results"]["claims"] else 1)
result=subprocess.run(["git","diff","--check"],capture_output=True,text=True)
record("git diff --check",result.returncode,result.stdout+result.stderr)
out=dict(task="12",checks=checks,outcome="pass" if all(c["exit_code"]==0 for c in checks) else "fail")
with (p/"product-check-11.out.json").open("x") as f: json.dump(out,f,indent=2)
print(json.dumps(out,indent=2))
sys.exit(0 if out["outcome"]=="pass" else 1)
