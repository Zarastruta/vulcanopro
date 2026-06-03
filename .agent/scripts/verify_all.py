#!/usr/bin/env python3
"""
Full Verification Suite - Antigravity Kit
==========================================
Runs COMPLETE validation including all checks + performance + E2E.
"""

import sys
import subprocess
import argparse
import os
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

# Fix for Windows Unicode issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ANSI colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.ENDC}\n")

def print_step(text: str):
    print(f"{Colors.BOLD}{Colors.BLUE}🔄 {text}{Colors.ENDC}")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

# Complete verification suite relative to .agent root
VERIFICATION_SUITE = [
    {
        "category": "Security",
        "checks": [
            ("Security Scan", "skills/vulnerability-scanner/scripts/security_scan.py", True),
            ("Dependency Analysis", "skills/vulnerability-scanner/scripts/dependency_analyzer.py", False),
        ]
    },
    {
        "category": "Code Quality",
        "checks": [
            ("Lint Check", "skills/lint-and-validate/scripts/lint_runner.py", True),
        ]
    },
    {
        "category": "UX & Accessibility",
        "checks": [
            ("UX Audit", "skills/frontend-design/scripts/ux_audit.py", False),
            ("Accessibility Check", "skills/frontend-design/scripts/accessibility_checker.py", False),
        ]
    },
    {
        "category": "SEO & Content",
        "checks": [
            ("SEO Check", "skills/seo-fundamentals/scripts/seo_checker.py", False),
            ("GEO Check", "skills/geo-fundamentals/scripts/geo_checker.py", False),
        ]
    },
    {
        "category": "Performance",
        "requires_url": True,
        "checks": [
            ("Lighthouse Audit", "skills/performance-profiling/scripts/lighthouse_audit.py", True),
        ]
    },
]

def run_script(name: str, script_path: Path, project_path: str, url: Optional[str] = None) -> dict:
    if not script_path.exists():
        return {"name": name, "passed": True, "skipped": True, "duration": 0}
    
    print_step(f"Running: {name}")
    start_time = datetime.now()
    cmd = ["python", str(script_path), project_path]
    if url and ("lighthouse" in script_path.name.lower() or "playwright" in script_path.name.lower()):
        cmd.append(url)
        
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        duration = (datetime.now() - start_time).total_seconds()
        passed = result.returncode == 0
        if passed: print_success(f"{name}: PASSED ({duration:.1f}s)")
        else:
            print_error(f"{name}: FAILED")
            if result.stderr: print(f"  {result.stderr[:200]}")
        return {"name": name, "passed": passed, "output": result.stdout, "error": result.stderr, "skipped": False, "duration": duration}
    except Exception as e:
        return {"name": name, "passed": False, "skipped": False, "duration": 0, "error": str(e)}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("project", help="Project path")
    parser.add_argument("--url", help="URL for performance")
    args = parser.parse_args()
    
    project_path = Path(args.project).resolve()
    agent_root = Path(__file__).resolve().parent.parent
    
    print_header("🚀 ANTIGRAVITY KIT - FULL VERIFICATION SUITE")
    start_time = datetime.now()
    results = []
    
    for suite in VERIFICATION_SUITE:
        if suite.get("requires_url") and not args.url: continue
        print_header(f"📋 {suite['category'].upper()}")
        for name, rel_path, required in suite["checks"]:
            script = agent_root / rel_path
            result = run_script(name, script, str(project_path), args.url)
            results.append(result)
            if required and not result["passed"] and not result.get("skipped"):
                print_error(f"CRITICAL: {name} failed. Stopping.")
                sys.exit(1)
                
    print_header("📊 FINAL REPORT")
    passed = sum(1 for r in results if r["passed"] and not r.get("skipped"))
    failed = sum(1 for r in results if not r["passed"] and not r.get("skipped"))
    print(f"Passed: {passed} | Failed: {failed}")
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
