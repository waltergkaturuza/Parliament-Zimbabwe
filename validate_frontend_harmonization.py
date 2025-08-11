#!/usr/bin/env python3
"""
Frontend Program Harmonization Validation Script

This script validates that the frontend Program interfaces and components
are properly harmonized with the backend Django model and DRF serializers.
"""

import os
import re
import json
from pathlib import Path

def read_file_content(file_path):
    """Read file content with proper encoding handling."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def extract_typescript_interface(content, interface_name):
    """Extract TypeScript interface definition from content."""
    pattern = rf'interface\s+{interface_name}\s*{{([^}}]+)}}'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def extract_program_types(content):
    """Extract program_type union from TypeScript content."""
    pattern = r"program_type:\s*([^;]+);"
    match = re.search(pattern, content, re.DOTALL)
    if match:
        types_str = match.group(1)
        # Extract all quoted strings
        types = re.findall(r"'([^']+)'", types_str)
        return types
    return []

def check_frontend_files():
    """Check frontend files for Program interface consistency."""
    
    frontend_dir = Path("fuel-coupon-frontend/src")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    results = {
        "types_models": {"exists": False, "program_types": [], "computed_fields": []},
        "api_programs": {"exists": False, "has_conflicting_interface": False},
        "program_list": {"exists": False, "uses_harmonized_import": False, "uses_computed_fields": False},
        "program_components": [],
        "harmonization_score": 0
    }
    
    # Check types/models.ts
    models_file = frontend_dir / "types" / "models.ts"
    if models_file.exists():
        content = read_file_content(models_file)
        results["types_models"]["exists"] = True
        
        # Extract Program interface
        program_interface = extract_typescript_interface(content, "Program")
        if program_interface:
            program_types = extract_program_types(program_interface)
            results["types_models"]["program_types"] = program_types
            
            # Check for computed fields
            computed_fields = []
            if "duration_days" in content:
                computed_fields.append("duration_days")
            if "is_upcoming" in content:
                computed_fields.append("is_upcoming")
            if "is_ongoing" in content:
                computed_fields.append("is_ongoing")
            if "is_completed" in content:
                computed_fields.append("is_completed")
            if "status_display" in content:
                computed_fields.append("status_display")
            if "attendees_count" in content:
                computed_fields.append("attendees_count")
            if "completion_percentage" in content:
                computed_fields.append("completion_percentage")
            if "organizer_name" in content:
                computed_fields.append("organizer_name")
            if "sub_center_name" in content:
                computed_fields.append("sub_center_name")
            
            results["types_models"]["computed_fields"] = computed_fields
    
    # Check api/programs.ts
    api_file = frontend_dir / "api" / "programs.ts"
    if api_file.exists():
        content = read_file_content(api_file)
        results["api_programs"]["exists"] = True
        
        # Check if it has its own Program interface (bad) - more precise regex
        has_conflicting = bool(re.search(r'\binterface\s+Program\s*{', content) or 
                              re.search(r'\bexport\s+interface\s+Program\s*{', content))
        results["api_programs"]["has_conflicting_interface"] = has_conflicting
    
    # Check ProgramList.tsx
    program_list_file = frontend_dir / "pages" / "programs" / "ProgramList.tsx"
    if program_list_file.exists():
        content = read_file_content(program_list_file)
        results["program_list"]["exists"] = True
        
        # Check if it imports from types/models
        uses_import = "from '../../types/models'" in content or "from '../types/models'" in content
        results["program_list"]["uses_harmonized_import"] = uses_import
        
        # Check if it uses computed fields
        uses_computed = (
            "is_upcoming" in content or 
            "is_ongoing" in content or 
            "completion_percentage" in content or
            "attendees_count" in content or
            "status_display" in content
        )
        results["program_list"]["uses_computed_fields"] = uses_computed
    
    # Find all Program-related components
    for tsx_file in frontend_dir.rglob("*Program*.tsx"):
        component_name = tsx_file.name
        content = read_file_content(tsx_file)
        
        component_info = {
            "name": component_name,
            "path": str(tsx_file.relative_to(frontend_dir)),
            "has_program_interface": bool(re.search(r'\binterface\s+Program\s*{', content) or 
                                         re.search(r'\bexport\s+interface\s+Program\s*{', content)),
            "imports_from_types": "from '../../types/models'" in content or "from '../types/models'" in content,
            "uses_computed_fields": any(field in content for field in [
                "is_upcoming", "is_ongoing", "is_completed", 
                "status_display", "attendees_count", "completion_percentage"
            ])
        }
        results["program_components"].append(component_info)
    
    return results

def calculate_harmonization_score(results):
    """Calculate overall harmonization score."""
    score = 0
    max_score = 0
    
    # Types/models.ts check (30 points)
    max_score += 30
    if results["types_models"]["exists"]:
        score += 10
        
        # Check for 16 program types
        program_types = results["types_models"]["program_types"]
        expected_types = [
            'SESSION', 'COMMITTEE', 'WORKSHOP', 'OUTREACH', 'CONFERENCE',
            'CEREMONY', 'INSPECTION', 'CAMPAIGN', 'NATIONAL_EVENT', 
            'CONSTITUENCY', 'DEBATE', 'BUDGET_SESSION', 'POLICY_MEETING',
            'PUBLIC_HEARING', 'DIPLOMATIC', 'OTHER'
        ]
        
        if len(program_types) >= 16:
            score += 10
        elif len(program_types) >= 10:
            score += 5
        
        # Check for computed fields
        computed_fields = results["types_models"]["computed_fields"]
        if len(computed_fields) >= 7:
            score += 10
        elif len(computed_fields) >= 4:
            score += 5
    
    # API consistency check (20 points)
    max_score += 20
    if results["api_programs"]["exists"]:
        score += 10
        if not results["api_programs"]["has_conflicting_interface"]:
            score += 10
    
    # Component harmonization check (30 points)
    max_score += 30
    if results["program_list"]["exists"]:
        score += 10
        if results["program_list"]["uses_harmonized_import"]:
            score += 10
        if results["program_list"]["uses_computed_fields"]:
            score += 10
    
    # Other components check (20 points)
    max_score += 20
    components = results["program_components"]
    if components:
        # Count components that don't have conflicting interfaces
        clean_components = sum(1 for c in components if not c["has_program_interface"])
        # Count components that use computed fields
        enhanced_components = sum(1 for c in components if c["uses_computed_fields"])
        
        if len(components) > 0:
            score += 10 * (clean_components / len(components))
            score += 10 * (enhanced_components / len(components))
    
    return (score / max_score) * 100 if max_score > 0 else 0

def print_validation_report(results):
    """Print detailed validation report."""
    
    print("🔍 FRONTEND PROGRAM HARMONIZATION VALIDATION REPORT")
    print("=" * 60)
    
    # Types/models.ts
    print("\n📁 TYPES/MODELS.TS")
    if results["types_models"]["exists"]:
        print("✅ File exists")
        
        program_types = results["types_models"]["program_types"]
        print(f"📊 Program types found: {len(program_types)}")
        if len(program_types) >= 16:
            print("✅ Complete parliamentary program types (16+)")
        elif len(program_types) >= 10:
            print("⚠️  Partial program types coverage")
        else:
            print("❌ Limited program types (< 10)")
        
        computed_fields = results["types_models"]["computed_fields"]
        print(f"⚡ Computed fields: {len(computed_fields)}")
        for field in computed_fields:
            print(f"   ✅ {field}")
        
        missing_computed = [
            "duration_days", "is_upcoming", "is_ongoing", "is_completed",
            "status_display", "attendees_count", "completion_percentage"
        ]
        missing = [f for f in missing_computed if f not in computed_fields]
        if missing:
            print("   Missing computed fields:")
            for field in missing:
                print(f"   ❌ {field}")
    else:
        print("❌ File not found")
    
    # API/programs.ts
    print("\n📁 API/PROGRAMS.TS")
    if results["api_programs"]["exists"]:
        print("✅ File exists")
        if results["api_programs"]["has_conflicting_interface"]:
            print("❌ Has conflicting Program interface (should import from types)")
        else:
            print("✅ No conflicting interface - imports from types")
    else:
        print("❌ File not found")
    
    # ProgramList.tsx
    print("\n📁 PROGRAMLIST.TSX")
    if results["program_list"]["exists"]:
        print("✅ File exists")
        
        if results["program_list"]["uses_harmonized_import"]:
            print("✅ Uses harmonized import from types/models")
        else:
            print("❌ Not using harmonized import")
        
        if results["program_list"]["uses_computed_fields"]:
            print("✅ Uses computed fields from serializer")
        else:
            print("❌ Not using computed fields")
    else:
        print("❌ File not found")
    
    # Other components
    print(f"\n📁 OTHER PROGRAM COMPONENTS ({len(results['program_components'])})")
    for component in results["program_components"]:
        print(f"\n   📄 {component['name']}")
        print(f"      Path: {component['path']}")
        
        if component["has_program_interface"]:
            print("      ❌ Has conflicting Program interface")
        else:
            print("      ✅ No conflicting interface")
        
        if component["imports_from_types"]:
            print("      ✅ Imports from types")
        else:
            print("      ⚠️  May not import from types")
        
        if component["uses_computed_fields"]:
            print("      ✅ Uses computed fields")
        else:
            print("      ⚠️  May not use computed fields")
    
    # Overall score
    score = calculate_harmonization_score(results)
    print(f"\n🎯 OVERALL HARMONIZATION SCORE: {score:.1f}%")
    
    if score >= 90:
        print("🟢 EXCELLENT - Frontend is well harmonized")
    elif score >= 75:
        print("🟡 GOOD - Minor improvements needed")
    elif score >= 50:
        print("🟠 NEEDS IMPROVEMENT - Several issues to address")
    else:
        print("🔴 CRITICAL - Major harmonization issues")
    
    # Recommendations
    print("\n📋 RECOMMENDATIONS:")
    
    if not results["types_models"]["exists"]:
        print("❗ Create types/models.ts with harmonized Program interface")
    elif len(results["types_models"]["program_types"]) < 16:
        print("❗ Update Program interface to include all 16 parliamentary types")
    
    if len(results["types_models"]["computed_fields"]) < 7:
        print("❗ Add missing computed fields to Program interface")
    
    if results["api_programs"]["has_conflicting_interface"]:
        print("❗ Remove conflicting Program interface from api/programs.ts")
    
    if not results["program_list"]["uses_computed_fields"]:
        print("❗ Update ProgramList.tsx to use computed fields")
    
    conflicting_components = [c for c in results["program_components"] if c["has_program_interface"]]
    if conflicting_components:
        print("❗ Remove conflicting Program interfaces from components:")
        for c in conflicting_components:
            print(f"   - {c['name']}")
    
    return score

def main():
    """Main validation function."""
    print("Starting Frontend Program Harmonization Validation...")
    
    # Change to the project directory
    os.chdir("c:/Users/Administrator/Documents/POZ/fuel_coupon_system")
    
    # Run validation
    results = check_frontend_files()
    
    if results:
        score = print_validation_report(results)
        
        # Save results to JSON
        with open("frontend_harmonization_validation.json", "w") as f:
            json.dump({
                "results": results,
                "score": score,
                "timestamp": "2025-08-11"
            }, f, indent=2)
        
        print(f"\n💾 Results saved to frontend_harmonization_validation.json")
        return score >= 75
    else:
        print("❌ Validation failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
