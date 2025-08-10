#!/usr/bin/env python3
"""
Script to fix JWT authentication issues across frontend pages
"""

import os
import re
import glob

def fix_authentication_patterns():
    """Fix common authentication anti-patterns in frontend files"""
    
    frontend_dir = "fuel-coupon-frontend/src"
    
    # Find all .tsx and .ts files
    tsx_files = []
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not file.endswith('.d.ts'):
                tsx_files.append(os.path.join(root, file))
    
    fixes_applied = 0
    
    for file_path in tsx_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern 1: Direct fetch with manual Authorization headers
            # Before: fetch('/api/endpoint', { headers: { 'Authorization': `Bearer ${token}` } })
            # After: apiClient.get('/endpoint')
            
            # Look for fetch calls with Authorization headers
            fetch_pattern = re.compile(
                r'await\s+fetch\s*\(\s*[\'"`]([^\'"`]+)[\'"`]\s*,\s*\{[^}]*headers\s*:\s*\{[^}]*[\'"`]Authorization[\'"`]\s*:[^}]*\}\s*\}[^)]*\)',
                re.MULTILINE | re.DOTALL
            )
            
            if fetch_pattern.search(content):
                print(f"⚠️  Found manual fetch with Authorization in: {file_path}")
                # This would need manual review - too complex to auto-fix
            
            # Pattern 2: Missing apiClient import where localStorage.getItem('access_token') is used
            if "localStorage.getItem('access_token')" in content and "import apiClient" not in content:
                if "import" in content and ("@/api" not in content):
                    # Add import after last import
                    import_pattern = re.compile(r'(import[^;]+;)')
                    imports = import_pattern.findall(content)
                    if imports:
                        last_import = imports[-1]
                        content = content.replace(
                            last_import,
                            last_import + "\nimport apiClient from '@/api';"
                        )
                        print(f"✅ Added apiClient import to: {file_path}")
                        fixes_applied += 1
            
            # Pattern 3: Inconsistent baseURL construction
            # Replace API_BASE_URL construction patterns
            if "import.meta.env.VITE_API_BASE_URL" in content and "${API_BASE_URL}" in content:
                print(f"⚠️  Found manual API_BASE_URL construction in: {file_path}")
            
            # Pattern 4: Direct Authorization header construction
            if "'Authorization': `Bearer ${" in content:
                print(f"⚠️  Found manual Authorization header in: {file_path}")
            
            # Only write back if content changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\n📊 Summary: {fixes_applied} automatic fixes applied")
    print("\n⚠️  Manual Review Required:")
    print("1. Files with direct fetch() calls need conversion to apiClient")
    print("2. Files with manual Authorization headers should use apiClient interceptors")
    print("3. Files with API_BASE_URL construction should use apiClient")

def check_common_auth_issues():
    """Check for common authentication issues"""
    
    print("\n🔍 CHECKING FOR COMMON JWT ISSUES")
    print("=" * 50)
    
    frontend_dir = "fuel-coupon-frontend/src"
    issues_found = []
    
    # Check for pages that might not handle authentication properly
    critical_patterns = {
        "Direct fetch without apiClient": r'fetch\s*\([\'"`][^\'"`]*[\'"`]',
        "Manual Authorization headers": r'[\'"`]Authorization[\'"`]\s*:\s*[\'"`]Bearer',
        "localStorage access outside AuthContext": r'localStorage\.getItem\([\'"`]access_token[\'"`]\)',
        "Missing error boundary for auth": r'useAuth\(\)',
        "API calls in useEffect without deps": r'useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*fetch'
    }
    
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    for issue_name, pattern in critical_patterns.items():
                        if re.search(pattern, content, re.MULTILINE | re.DOTALL):
                            issues_found.append({
                                'file': file_path,
                                'issue': issue_name,
                                'component': os.path.basename(file)
                            })
                            
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    # Group by issue type
    issue_groups = {}
    for issue in issues_found:
        issue_type = issue['issue']
        if issue_type not in issue_groups:
            issue_groups[issue_type] = []
        issue_groups[issue_type].append(issue)
    
    for issue_type, files in issue_groups.items():
        print(f"\n🚨 {issue_type}:")
        for issue in files[:5]:  # Show first 5
            print(f"   - {issue['component']}")
        if len(files) > 5:
            print(f"   ... and {len(files) - 5} more files")
    
    return issues_found

def generate_fix_recommendations():
    """Generate specific fix recommendations"""
    
    print("\n💡 FIX RECOMMENDATIONS")
    print("=" * 50)
    
    recommendations = [
        {
            "priority": "HIGH",
            "issue": "Direct fetch calls",
            "fix": "Replace all fetch() calls with apiClient.get/post/put/delete",
            "example": "fetch('/api/users/') → apiClient.get('/users/')"
        },
        {
            "priority": "HIGH", 
            "issue": "Manual Authorization headers",
            "fix": "Remove manual headers - apiClient handles JWT automatically",
            "example": "Remove: headers: { 'Authorization': `Bearer ${token}` }"
        },
        {
            "priority": "MEDIUM",
            "issue": "API_BASE_URL construction",
            "fix": "Use apiClient instead of building URLs manually",
            "example": "${API_BASE_URL}/users/ → apiClient.get('/users/')"
        },
        {
            "priority": "MEDIUM",
            "issue": "Missing error handling",
            "fix": "Add try/catch blocks for API calls with proper error messages",
            "example": "Show user-friendly errors instead of console.error"
        },
        {
            "priority": "LOW",
            "issue": "useAuth consistency",
            "fix": "Use useAuth hook instead of direct localStorage access",
            "example": "const { accessToken } = useAuth() instead of localStorage.getItem"
        }
    ]
    
    for rec in recommendations:
        print(f"\n{rec['priority']} PRIORITY: {rec['issue']}")
        print(f"Fix: {rec['fix']}")
        print(f"Example: {rec['example']}")

if __name__ == "__main__":
    print("🔧 JWT AUTHENTICATION FIXER")
    print("=" * 50)
    
    # Check current directory
    if not os.path.exists("fuel-coupon-frontend"):
        print("❌ Error: fuel-coupon-frontend directory not found")
        print("Please run this script from the project root directory")
        exit(1)
    
    # Run fixes
    fix_authentication_patterns()
    
    # Check for issues  
    issues = check_common_auth_issues()
    
    # Generate recommendations
    generate_fix_recommendations()
    
    print(f"\n✅ Script completed. Found {len(issues)} potential authentication issues.")
    print("\nNext steps:")
    print("1. Review files with direct fetch() calls")
    print("2. Test authentication flows after fixes")
    print("3. Check browser console for JWT errors")
