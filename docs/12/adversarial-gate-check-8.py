import hashlib, json
from pathlib import Path
p=Path('docs/12')
load=lambda name:json.loads((p/name).read_text())
sha=lambda path:hashlib.sha256(Path(path).read_bytes()).hexdigest()
SPEC_SHA='55180bed26e9b4ff32f1950220aaab9db80d9af94b781fac4fb3283e31201f0a'
# Source and claim reports (retained from adversarial-3/5; SPEC.md bytes are unchanged since).
s=load('adversarial-sources-3.out.json'); old=load('adversarial-claims-3.out.json'); new=load('adversarial-claims-5.out.json')
assert s['status']=='SUCCESS' and len(s['results']['claims'])==23
assert all(c['status']=='VERIFIED' and c['inspected_files'] for c in s['results']['claims'])
assert old['status']=='SUCCESS' and len(old['results']['claims'])==45
assert all(c['status']=='VERIFIED' for i,c in enumerate(old['results']['claims'],1) if i not in (36,39) and i<40)
assert new['status']=='SUCCESS' and len(new['results']['claims'])==2
assert all(c['status']=='VERIFIED' and c['inspected_files'] for c in new['results']['claims'])
assert all(r['artifacts']['provider']=='codex' for r in [s,old,new])
# Provenance: SPEC.md was written under author provider "claude" (adversarial-7 retained hash of that
# file), so the codex claim reviews are cross-provider for SPEC.md. The provider file now records the
# later codex scenario-repair author; the scenario classification review is by claude.
assert sha('docs/12/SPEC.md')==SPEC_SHA
prev=load('.nightshift-adversarial-7.json')
prev_ev={e['path']:e['sha256'] for e in prev['evidence']}
assert prev_ev['docs/12/SPEC.md']==SPEC_SHA
assert prev_ev['docs/12/spec-author-provider.txt']==hashlib.sha256(b'claude').hexdigest()
scen=load('behavior-scenarios.json')
assert (p/'spec-author-provider.txt').read_text().strip()==scen['author']['provider']=='codex'
rows=[json.loads(x) for x in Path('.nightshift/12-citations.jsonl').read_text().splitlines() if x]
assert len(rows)==45 and all(c['status'] in ('VERIFIED','NET_NEW') for c in rows)
assert sum(c['status']=='NET_NEW' for c in rows)==6
# Scenario classification: current-digest approval attested by an independent provider.
review=load('classification-focus-repair-3.out.json')
cur=scen['applicability']['review']
assert review['status']=='SUCCESS' and review['results']['decision']=='approve' and not review['results']['findings']
assert review['artifacts']['provider']=='claude'!=scen['author']['provider']
assert review['results']['reviewed_input_sha256']=='8f0b7245c2ab421603ffec9fa77d11c03374fdf807a71cb997835a6f86f08d44'
assert cur['decision']=='approve' and cur['reviewer_provider']=='claude' and cur['reviewed_input_sha256']==review['results']['reviewed_input_sha256']
assert cur['evidence_sha256']==sha('docs/12/classification-focus-repair-3.out.json')
assert set(review['results']['scenario_ids'])=={c['id'] for c in scen['cases']}=={f'C{i:02}' for i in range(1,10)}
assert all(c['applicability']['review']['decision']=='approve' and c['applicability']['review']['reviewed_input_sha256']==cur['reviewed_input_sha256'] for c in scen['cases'])
for report in [s,old,new]:
 for c in report['results']['claims']:
  for file in c['inspected_files']: assert Path(file).is_file(), file
print(json.dumps({'sources':23,'verified':39,'net_new':6,'unresolved':0,'manual_acceptance':'pending','claim_reviewer_provider':'codex','spec_author_provider':'claude','scenario_review_provider':'claude'}))
