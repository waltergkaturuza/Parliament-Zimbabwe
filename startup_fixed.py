#!/usr/bin/env python3
"""
Fallback Python startup script that calls the bash entrypoint
"""
import os
import subprocess
import sys

def main():
    # Find the azure_entrypoint.sh script
    script_path = os.path.join(os.path.dirname(__file__), 'azure_entrypoint.sh')
    
    if os.path.exists(script_path):
        print(f"[startup_fixed.py] Executing {script_path}")
        os.execv('/bin/bash', ['bash', script_path])
    else:
        print(f"[startup_fixed.py] ERROR: {script_path} not found")
        print(f"[startup_fixed.py] Current directory: {os.getcwd()}")
        print(f"[startup_fixed.py] Directory contents:")
        for item in os.listdir('.'):
            print(f"  {item}")
        sys.exit(1)

if __name__ == '__main__':
    main()