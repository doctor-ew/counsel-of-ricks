"""Check retained pre-implementation evidence without claiming GREEN or browser admission."""
import hashlib
import json
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[2]
log = (root / 'docs/12/implement-2-component-red-3.log').read_text()
assert 'Tests  10 failed | 4 passed (14)' in log
assert 'Unable to find an accessible element with the role "button"' in log
assert '✓ test/session-ledger-filters.test.tsx > C05 recorder calibration > discriminates effect reset' in log
assert '✓ test/session-ledger-filters.test.tsx > C05 recorder calibration > discriminates derived reset' in log
assert 'Total: 1 test in 1 file' in (root / 'docs/12/implement-2-browser-list-2.log').read_text()
assert 'already used' in (root / 'docs/12/implement-2-browser-baseline-2.log').read_text()
source = 'frontend/src/pages/SessionPage.tsx'
assert (root / source).read_bytes() == subprocess.check_output(['git','-C',str(root),'show','HEAD:'+source])
scenarios = json.loads((root / 'docs/12/behavior-scenarios.json').read_text())
assert scenarios['applicability']['review']['decision'] == 'approve'
assert json.loads((root/'docs/12/.nightshift-implement-1.json').read_text())['status'] == 'fail'
print('PASS: relevant component RED, passing recorder calibrations, browser test discovery, concrete browser blocker, unchanged application source; GREEN and manual acceptance remain pending.')
