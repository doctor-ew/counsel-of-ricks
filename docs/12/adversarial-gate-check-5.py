import hashlib, json
from pathlib import Path
p=Path('docs/12')
load=lambda name:json.loads((p/name).read_text())
s=load('adversarial-sources-3.out.json'); old=load('adversarial-claims-3.out.json'); new=load('adversarial-claims-5.out.json')
assert s['status']=='SUCCESS' and len(s['results']['claims'])==23
assert all(c['status']=='VERIFIED' and c['inspected_files'] for c in s['results']['claims'])
assert old['status']=='SUCCESS' and len(old['results']['claims'])==45
assert all(c['status']=='VERIFIED' for i,c in enumerate(old['results']['claims'],1) if i not in (36,39) and i<40)
assert new['status']=='SUCCESS' and len(new['results']['claims'])==2
assert all(c['status']=='VERIFIED' and c['inspected_files'] for c in new['results']['claims'])
assert all(r['artifacts']['provider']=='codex' for r in [s,old,new])
assert (p/'spec-author-provider.txt').read_text().strip()=='claude'
rows=[json.loads(x) for x in Path('.nightshift/12-citations.jsonl').read_text().splitlines() if x]
assert len(rows)==45 and all(c['status'] in ('VERIFIED','NET_NEW') for c in rows)
assert sum(c['status']=='NET_NEW' for c in rows)==6
review=load('classification-review-4.out.json'); att=load('classification-review-3.json')
assert review['status']=='SUCCESS' and review['results']['decision']=='approve' and not review['results']['findings']
assert review['results']['reviewed_input_sha256']==att['reviewed_input_sha256']=='d1996262772f930e0153b31f0bf9f5afefeaa98093290d1726191a8537a5ded6'
assert set(review['results']['scenario_ids'])==set(att['case_ids'])=={f'C{i:02}' for i in range(1,10)}
assert hashlib.sha256((p/'SPEC.md').read_bytes()).hexdigest()=='55180bed26e9b4ff32f1950220aaab9db80d9af94b781fac4fb3283e31201f0a'
for report in [s,old,new]:
 for c in report['results']['claims']:
  for file in c['inspected_files']: assert Path(file).is_file(), file
print(json.dumps({'sources':23,'verified':39,'net_new':6,'unresolved':0,'manual_acceptance':'pending','independent_provider':'codex'}))
