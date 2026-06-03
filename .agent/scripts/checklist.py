#!/usr/bin/env python3
"""
Master Checklist Runner - Antigravity Kit
==========================================
Orchestrates all validation scripts in priority order.
"""

import sys
import subprocess
import argparse
import os
from pathlib import Path
from typing import List, Tuple, Optional

# Fix for Windows Unicode issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ANSI colors for terminal output
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
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def print_step(text: str):
    print(f"{Colors.BOLD}{Colors.BLUE}🔄 {text}{Colors.ENDC}")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

# Define priority-ordered checks relative to .agent root
CORE_CHECKS = [
    ("Security Scan", "skills/vulnerability-scanner/scripts/security_scan.py", True),
    ("Lint Check", "skills/lint-and-validate/scripts/lint_runner.py", True),
    ("Schema Validation", "skills/database-design/scripts/schema_validator.py", False),
    ("Test Runner", "skills/testing-patterns/scripts/test_runner.py", False),
    ("UX Audit", "skills/frontend-design/scripts/ux_audit.py", False),
    ("SEO Check", "skills/seo-fundamentals/scripts/seo_checker.py", False),
]

PERFORMANCE_CHECKS = [
    ("Lighthouse Audit", "skills/performance-profiling/scripts/lighthouse_audit.py", True),
    ("Playwright E2E", "skills/webapp-testing/scripts/playwright_runner.py", False),
]

def run_script(name: str, script_path: Path, project_path: str, url: Optional[str] = None) -> dict:
    if not script_path.exists():
        print_warning(f"{name}: Script not found ({script_path}), skipping")
        return {"name": name, "passed": True, "output": "", "skipped": True}
    
    print_step(f"Running: {name}")
    
    cmd = ["python", str(script_path), project_path]
    if url and ("lighthouse" in script_path.name.lower() or "playwright" in script_path.name.lower()):
        cmd.append(url)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        passed = result.returncode == 0
        if passed:
            print_success(f"{name}: PASSED")
        else:
            print_error(f"{name}: FAILED")
            if result.stderr: print(f"  Error: {result.stderr[:200]}")
        return {"name": name, "passed": passed, "output": result.stdout, "error": result.stderr, "skipped": False}
    except Exception as e:
        print_error(f"{name}: ERROR - {str(e)}")
        return {"name": name, "passed": False, "output": "", "error": str(e), "skipped": False}

def print_summary(results: List[dict]):
    print_header("📊 CHECKLIST SUMMARY")
    passed = sum(1 for r in results if r["passed"] and not r.get("skipped"))
    failed = sum(1 for r in results if not r["passed"] and not r.get("skipped"))
    skipped = sum(1 for r in results if r.get("skipped"))
    
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    for r in results:
        status = "⏭️" if r.get("skipped") else ("✅" if r["passed"] else "❌")
        print(f"{status} {r['name']}")
    return failed == 0

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("project", help="Project path to validate")
    parser.add_argument("--url", help="URL for performance checks")
    args = parser.parse_args()
    
    project_path = Path(args.project).resolve()
    agent_root = Path(__file__).resolve().parent.parent
    
    print_header("🚀 ANTIGRAVITY KIT - MASTER CHECKLIST")
    results = []
    
    for name, rel_path, required in CORE_CHECKS:
        script = agent_root / rel_path
        result = run_script(name, script, str(project_path))
        results.append(result)
        if required and not result["passed"] and not result.get("skipped"):
            break
            
    if args.url:
        for name, rel_path, required in PERFORMANCE_CHECKS:
            script = agent_root / rel_path
            results.append(run_script(name, script, str(project_path), args.url))
            
    all_passed = print_summary(results)
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
