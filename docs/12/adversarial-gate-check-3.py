import json
from pathlib import Path
s=json.loads(Path("docs/12/adversarial-sources-3.out.json").read_text())
c=json.loads(Path("docs/12/adversarial-claims-3.out.json").read_text())
assert s["status"]=="SUCCESS" and len(s["results"]["claims"])==23
assert all(x["status"]=="VERIFIED" for x in s["results"]["claims"])
assert c["status"]=="SUCCESS" and len(c["results"]["claims"])==45
rows=[json.loads(x) for x in Path(".nightshift/12-citations.jsonl").read_text().splitlines() if x]
blocked=[x for x in rows if x["status"] in ("NOT_FOUND","CONFLICT")]
print(json.dumps({"source_entries":23,"claims":45,"blocked_count":len(blocked),"manual_acceptance":"pending"}))
raise SystemExit(1 if blocked else 0)
