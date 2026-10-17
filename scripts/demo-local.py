#!/usr/bin/env python3
"""Run the real local Session UI against a synthetic, read-only HTTP simulation."""
import argparse
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import time
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parents[1]
SESSION = '11111111-1111-4111-8111-111111111111'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=5173)
    parser.add_argument('--api-port', type=int, default=8001)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    if not all(1024 <= port <= 65535 for port in (args.port, args.api_port)) or args.port == args.api_port:
        parser.error('Choose distinct unprivileged local ports.')
    # Refuse occupied ports rather than accidentally displaying another server.
    for port in (args.port, args.api_port):
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(('127.0.0.1', port))
            except OSError as error:
                parser.error('Port ' + str(port) + ' is occupied: ' + str(error))
    output = ROOT / '.nightshift/demo-local' 
    output.mkdir(parents=True, exist_ok=True)
    children = []
    streams = []

    def start(command, stem, env=None):
        out = (output / (stem + '.log')).open('w')
        streams.append(out)
        child = subprocess.Popen(command, cwd=ROOT, env=env, stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
        children.append(child)
        return child

    def await_url(url, child, headers=None):
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if child.poll() is not None:
                raise RuntimeError('Demo process exited; inspect ' + str(output))
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=headers or {}), timeout=1) as response:
                    if response.status == 200:
                        return
            except OSError:
                time.sleep(0.2)
        raise RuntimeError('Local demo did not become ready; inspect ' + str(output))

    try:
        api = start(['postman', 'simulation', 'run', str(ROOT / 'postman/simulations/counsel-live-demo.sim.yaml'),
                     '--port', str(args.api_port), '--no-history', '--output', 'ndjson'], 'api')
        await_url('http://127.0.0.1:' + str(args.api_port) + '/api/v1/health', api, {'x-mock-slug': 'counsel'})
        env = dict(os.environ, COUNSEL_DEMO_API_PORT=str(args.api_port))
        ui = start(['npm', '--prefix', 'frontend', 'run', 'demo', '--', '--port', str(args.port)], 'frontend', env)
        url = 'http://127.0.0.1:' + str(args.port) + '/demo/index.html#/session/' + SESSION
        await_url(url.split('#')[0], ui)
        print(json.dumps({'status': 'ready', 'url': url, 'synthetic': True, 'read_only_api': True,
                          'application_model_calls': 0, 'logs': str(output)}), flush=True)
        if not args.no_open:
            webbrowser.open(url)
        while all(child.poll() is None for child in children):
            time.sleep(0.5)
        raise RuntimeError('Demo process stopped; inspect ' + str(output))
    except KeyboardInterrupt:
        pass
    finally:
        for child in reversed(children):
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGINT)
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait(timeout=5)
        for stream in streams:
            stream.close()


if __name__ == '__main__':
    main()
