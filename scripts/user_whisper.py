#!/usr/bin/env python3
"""
Simple CLI whisper tool for the user to send messages to Antigravity without interrupting main prompt.
Usage:
  python3 scripts/user_whisper.py "Your message here"
Or simply run it interactively:
  python3 scripts/user_whisper.py
"""
import sys
import datetime
import os

INBOX_FILE = os.path.expanduser("/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/user_relay_inbox.md")

def append_message(msg):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"\n### [{now}] USER NOTE:\n{msg.strip()}\n---\n"
    with open(INBOX_FILE, "a", encoding="utf-8") as f:
        f.write(entry)
    print(f"✅ Delivered to Mother Agent inbox ({now})")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        msg = " ".join(sys.argv[1:])
        append_message(msg)
    else:
        print("Type your message to Antigravity (Ctrl+D or empty line to send):")
        lines = []
        try:
            while True:
                line = input()
                if not line and lines:
                    break
                lines.append(line)
        except EOFError:
            pass
        if lines:
            append_message("\n".join(lines))
        else:
            print("No message sent.")
