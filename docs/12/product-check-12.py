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
review=json.loads((p/"classification-focus-repair-3.out.json").read_text())
r=review["results"]
approved=(review["status"]=="SUCCESS" and r["decision"]=="approve" and not r["findings"] and r["reviewed_input_sha256"]==proof.semantics(doc) and set(r["scenario_ids"])=={c["id"] for c in doc["cases"]} and review["artifacts"]["provider"]!=doc["author"]["provider"])
record("independent classification approval with current semantic digest and complete public coverage",0 if approved else 1,r)
try:
    proof.reviewed(doc)
    record("classification attestation binding",0)
except Exception as e:
    record("classification attestation binding",1,str(e))
evidence_hash=hashlib.sha256((project/'docs/12/classification-focus-repair-3.out.json').read_bytes()).hexdigest()
apps=[doc['applicability']]+[case['applicability'] for case in doc['cases']]
record('retained classification report bytes and attestation provenance',0 if all(app['review']['evidence_sha256']==evidence_hash and app['review']['reviewer_provider']==review['artifacts']['provider'] for app in apps) else 1)
record('author provider provenance',0 if (p/'spec-author-provider.txt').read_text().strip()==doc['author']['provider'] else 1)
current=doc['cases'][6]['then']
old=json.loads((p/'product-12/scenarios-reviewed-11.json').read_text())['cases'][6]['then']
sidebar="aside's computed width, background, border, box-shadow and text color"
card="every fixture card's computed width, background, border, box-shadow and text color"
record('C07 explicit complete baseline comparisons; retained incomplete counterexample rejected',0 if sidebar in current and card in current and not(sidebar in old and card in old) else 1)
repair=json.loads((p/'product-12/repair-check.receipt.json').read_text())
record('current hash-bound repair regression',0 if repair['status']=='passed' and repair['findings'][0]['artifact_sha256']==hashlib.sha256((p/'behavior-scenarios.json').read_bytes()).hexdigest() else 1)
extract=json.loads((p/"product-extractor-2.out.json").read_text())
record("retained successful identifier extraction",0 if extract["status"]=="SUCCESS" and extract["results"]["claims"] else 1)
result=subprocess.run(["git","diff","--check"],capture_output=True,text=True)
record("git diff --check",result.returncode,result.stdout+result.stderr)
out=dict(task="12",checks=checks,outcome="pass" if all(c["exit_code"]==0 for c in checks) else "fail")
with (p/"product-check-12.out.json").open("x") as f: json.dump(out,f,indent=2)
print(json.dumps(out,indent=2))
sys.exit(0 if out["outcome"]=="pass" else 1)
