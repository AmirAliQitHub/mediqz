#!/usr/bin/env python3
"""
Mediqz Remote Server Execution Helper
Usage: python3 scripts/remote_exec.py "<command>"
"""
import sys
import subprocess

SERVER_IP = "195.248.241.36"
SERVER_PASS = "Mediqz#2026!SecServer"

def run_remote(cmd: str, timeout: int = 300) -> int:
    escaped_cmd = cmd.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$')
    expect_script = f'''
set timeout {timeout}
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@{SERVER_IP} "{escaped_cmd}"
expect {{
    "password:" {{
        send "{SERVER_PASS}\\r"
        exp_continue
    }}
    eof
}}
'''
    res = subprocess.run(["expect", "-c", expect_script], capture_output=True, text=True)
    out = res.stdout
    lines = out.splitlines()
    filtered = []
    skip = True
    for l in lines:
        if "password:" in l:
            skip = False
            continue
        if not skip:
            filtered.append(l)
    print("\n".join(filtered) if filtered else out)
    return res.returncode

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/remote_exec.py <command>")
        sys.exit(1)
    cmd = " ".join(sys.argv[1:])
    sys.exit(run_remote(cmd))
