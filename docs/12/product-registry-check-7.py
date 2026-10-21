"""Record the live registry lookup behind the pinned dev-only runner; never approves a gate."""
import datetime, json, pathlib, subprocess
out = pathlib.Path(__file__).resolve().parent / "package-registry-check-7.json"
cmd = ["npm", "view", "@playwright/test@1.64.1", "version", "bin", "--json"]
r = subprocess.run(cmd, capture_output=True, text=True)
record = {
    "command": " ".join(cmd),
    "executed_at_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "stage": "product-7",
    "exit_code": r.returncode,
    "response": json.loads(r.stdout) if r.returncode == 0 else None,
}
out.write_text(json.dumps(record, indent=2) + "\n")
print(json.dumps(record, indent=2))
raise SystemExit(r.returncode)
