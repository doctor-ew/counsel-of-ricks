"""Project real source-citation text for JSON regression; never approves a gate."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
for source,target in [('SPEC.pre-adversarial-1.md','source-citations.before.json'),('SPEC.md','source-citations.current.json')]:
 p=root/source;text=p.read_text()
 if '\n## Sources\n' not in text:raise SystemExit('Missing Sources section')
 value={'source_artifact':source,'source_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sources':text.split('\n## Sources\n',1)[1]}
 (root/target).write_text(json.dumps(value,indent=2)+'\n')
current=json.loads((root/'source-citations.current.json').read_text());prior=root/'source-citations.before.json'
p=root/'repair-checks.json';value=json.loads(p.read_text());identity='SOURCE-CITATION-WORDING-REPAIR'
if not any(r['id']==identity for r in value['findings']):
 value['findings'].append({'id':identity,'artifact':'docs/12/source-citations.current.json','pointer':'/sources','expected':current['sources'],'prior_artifact':'docs/12/source-citations.before.json','prior_sha256':hashlib.sha256(prior.read_bytes()).hexdigest()})
 p.write_text(json.dumps(value,indent=2)+'\n')
print('Projected actual before/current Sources sections; gate_approval=false')
