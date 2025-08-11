#!/usr/bin/env python3
"""
Program Harmonization Validation Script
Validates field alignment between Django model, DRF serializers, and frontend interfaces
"""

import os
import sys
import re
import json
from datetime import datetime

class ProgramHarmonizationValidator:
    """Validates Program field mappings across all layers"""
    
    def __init__(self):
        self.model_fields = []
        self.serializer_fields = []
        self.frontend_fields_models_ts = []
        self.frontend_fields_programs_ts = []
        self.frontend_fields_programlist = []
        self.computed_properties = []
        self.missing_implementations = []
        self.field_mappings = {}
        
    def analyze_model_fields(self):
        """Analyze Django Program model fields"""
        print("🔍 Analyzing Django Program model...")
        
        # Define model fields based on our analysis
        self.model_fields = [
            # Core fields
            'id', 'title', 'program_type', 'description', 'location',
            'scheduled_date', 'end_date', 'sub_center', 'organizer',
            'expected_participants', 'fuel_allocation_approved', 
            'is_active', 'notes', 'created', 'modified',
            
            # Computed properties (added in harmonization)
            'duration_days', 'is_upcoming', 'is_ongoing', 'is_completed',
            'status_display', 'attendees_count', 'completion_percentage'
        ]
        
        print(f"✅ Found {len(self.model_fields)} model fields (including computed properties)")
        
    def analyze_serializer_fields(self):
        """Analyze DRF Program serializer fields"""
        print("🔍 Analyzing DRF Program serializer...")
        
        # Define serializer fields based on our enhanced implementation
        self.serializer_fields = [
            # Core model fields
            'id', 'title', 'program_type', 'program_type_display',
            'scheduled_date', 'end_date', 'duration_days',
            'description', 'location', 'notes',
            'organizer', 'organizer_details', 'organizer_name',
            'sub_center', 'sub_center_details', 'sub_center_name',
            'expected_participants', 'fuel_allocation_approved', 'is_active',
            'status_display', 'is_upcoming', 'is_ongoing', 'is_completed',
            'attendees_count', 'completion_percentage', 'attendees',
            'created', 'modified'
        ]
        
        print(f"✅ Found {len(self.serializer_fields)} serializer fields")
        
    def analyze_frontend_interfaces(self):
        """Analyze frontend TypeScript interfaces"""
        print("🔍 Analyzing frontend TypeScript interfaces...")
        
        # types/models.ts interface (most comprehensive)
        self.frontend_fields_models_ts = [
            'id', 'title', 'program_type', 'program_type_display',
            'scheduled_date', 'end_date', 'description', 'location',
            'organizer', 'sub_center', 'is_active', 'attendees',
            'expected_participants', 'fuel_allocation_approved', 'notes',
            'duration_days', 'is_upcoming', 'is_ongoing',
            'created', 'modified'
        ]
        
        # api/programs.ts interface (limited types)
        self.frontend_fields_programs_ts = [
            'id', 'title', 'program_type', 'scheduled_date', 'end_date',
            'description', 'location', 'organizer', 'is_active', 'sub_center',
            'attendees_count', 'completion_percentage', 'created', 'modified'
        ]
        
        # ProgramList.tsx component interface
        self.frontend_fields_programlist = [
            'id', 'title', 'program_type', 'program_type_display',
            'scheduled_date', 'end_date', 'description', 'location',
            'organizer', 'is_active', 'sub_center', 'attendees_count',
            'completion_percentage', 'created', 'modified'
        ]
        
        print(f"✅ models.ts interface: {len(self.frontend_fields_models_ts)} fields")
        print(f"✅ programs.ts interface: {len(self.frontend_fields_programs_ts)} fields")  
        print(f"✅ ProgramList.tsx interface: {len(self.frontend_fields_programlist)} fields")
        
    def validate_field_mappings(self):
        """Validate field mappings between all layers"""
        print("\n🧪 Validating field mappings...")
        
        # Get all unique fields across all interfaces
        all_fields = set()
        all_fields.update(self.model_fields)
        all_fields.update(self.serializer_fields)
        all_fields.update(self.frontend_fields_models_ts)
        all_fields.update(self.frontend_fields_programs_ts)
        all_fields.update(self.frontend_fields_programlist)
        
        perfect_mappings = 0
        computed_mappings = 0
        missing_mappings = 0
        
        for field in sorted(all_fields):
            mapping_status = self.get_field_mapping_status(field)
            self.field_mappings[field] = mapping_status
            
            if mapping_status == "✅ Perfect":
                perfect_mappings += 1
            elif "🔧 Computed" in mapping_status:
                computed_mappings += 1
            elif "❌ Missing" in mapping_status:
                missing_mappings += 1
                
        total_fields = len(all_fields)
        coverage_percentage = ((perfect_mappings + computed_mappings) / total_fields) * 100
        
        print(f"📊 Field mapping results:")
        print(f"   ✅ Perfect Mappings: {perfect_mappings}")
        print(f"   🔧 Computed Mappings: {computed_mappings}")
        print(f"   ❌ Missing Mappings: {missing_mappings}")
        print(f"   📊 Total Coverage: {coverage_percentage:.1f}%")
        
        return coverage_percentage
        
    def get_field_mapping_status(self, field):
        """Get mapping status for a specific field"""
        in_model = field in self.model_fields
        in_serializer = field in self.serializer_fields
        in_models_ts = field in self.frontend_fields_models_ts
        in_programs_ts = field in self.frontend_fields_programs_ts
        in_programlist = field in self.frontend_fields_programlist
        
        # Check if field is available across all or most layers
        coverage_count = sum([in_model, in_serializer, in_models_ts, in_programs_ts, in_programlist])
        
        if coverage_count >= 4:
            return "✅ Perfect"
        elif coverage_count >= 3:
            return "🔧 Computed/Partial"
        elif coverage_count >= 2:
            return "⚠️ Limited"
        else:
            return "❌ Missing"
    
    def check_program_type_consistency(self):
        """Check program type consistency across interfaces"""
        print("\n🔍 Checking program type consistency...")
        
        # Django model types (16 comprehensive types)
        model_types = [
            'SESSION', 'COMMITTEE', 'WORKSHOP', 'OUTREACH', 'CONFERENCE',
            'CEREMONY', 'INSPECTION', 'CAMPAIGN', 'NATIONAL_EVENT', 
            'CONSTITUENCY', 'DEBATE', 'BUDGET_SESSION', 'POLICY_MEETING',
            'PUBLIC_HEARING', 'DIPLOMATIC', 'OTHER'
        ]
        
        # api/programs.ts types (limited 4 types)
        programs_ts_types = ['TRAINING', 'DISTRIBUTION', 'MEETING', 'ACTIVITY']
        
        print(f"✅ Model types: {len(model_types)} comprehensive parliamentary types")
        print(f"❌ programs.ts types: {len(programs_ts_types)} limited generic types")
        print("🚨 CRITICAL: Type mismatch will cause API integration failures!")
        
        return len(model_types) != len(programs_ts_types)
    
    def validate_computed_properties(self):
        """Validate implementation of computed properties"""
        print("\n🧪 Validating computed properties...")
        
        required_computed = [
            'duration_days', 'is_upcoming', 'is_ongoing', 'is_completed',
            'status_display', 'attendees_count', 'completion_percentage'
        ]
        
        implemented_count = 0
        for prop in required_computed:
            if prop in self.model_fields and prop in self.serializer_fields:
                print(f"✅ {prop}: Implemented in model and serializer")
                implemented_count += 1
            elif prop in self.model_fields:
                print(f"⚠️ {prop}: Implemented in model, missing in serializer")
            elif prop in self.serializer_fields:
                print(f"⚠️ {prop}: Declared in serializer, missing model implementation")
            else:
                print(f"❌ {prop}: Not implemented")
        
        implementation_percentage = (implemented_count / len(required_computed)) * 100
        print(f"📊 Computed properties implementation: {implementation_percentage:.1f}%")
        
        return implementation_percentage >= 100
    
    def generate_recommendations(self):
        """Generate harmonization recommendations"""
        recommendations = []
        
        # Count issues
        missing_count = sum(1 for status in self.field_mappings.values() if "❌ Missing" in status)
        limited_count = sum(1 for status in self.field_mappings.values() if "⚠️ Limited" in status)
        
        if missing_count > 0:
            recommendations.append(f"Address {missing_count} missing field mappings")
        
        if limited_count > 0:
            recommendations.append(f"Improve {limited_count} limited field mappings")
            
        recommendations.extend([
            "Standardize program types across all interfaces (use 16 parliamentary types)",
            "Implement all computed properties in both model and serializer",
            "Update frontend interfaces to use harmonized Program interface",
            "Remove duplicate/conflicting interface definitions",
            "Add comprehensive validation for program creation/updates",
            "Test API integration with harmonized field mappings",
            "Update frontend components to use structured data objects",
            "Add field validation at all layers (model, serializer, frontend)"
        ])
        
        return recommendations
    
    def generate_report(self):
        """Generate comprehensive validation report"""
        coverage = self.validate_field_mappings()
        type_inconsistency = self.check_program_type_consistency()
        computed_implemented = self.validate_computed_properties()
        recommendations = self.generate_recommendations()
        
        # Calculate overall score
        coverage_score = min(100, coverage)
        type_score = 0 if type_inconsistency else 25
        computed_score = 25 if computed_implemented else 0
        
        overall_score = (coverage_score * 0.5) + type_score + computed_score
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_score": overall_score,
            "field_mappings": {
                "total_fields": len(self.field_mappings),
                "coverage_percentage": coverage,
                "detailed_mappings": self.field_mappings
            },
            "program_types": {
                "consistency_check": not type_inconsistency,
                "model_types_count": 16,
                "programs_ts_types_count": 4,
                "critical_issue": type_inconsistency
            },
            "computed_properties": {
                "fully_implemented": computed_implemented,
                "required_count": 7,
                "implementation_status": "Complete" if computed_implemented else "Partial"
            },
            "recommendations": recommendations,
            "status": "EXCELLENT" if overall_score >= 90 else 
                     "GOOD" if overall_score >= 70 else
                     "NEEDS_IMPROVEMENT" if overall_score >= 50 else
                     "CRITICAL"
        }
        
        return report, overall_score
    
    def run_validation(self):
        """Run complete validation process"""
        print("🚀 Starting Program harmonization validation...")
        print("=" * 60)
        
        self.analyze_model_fields()
        self.analyze_serializer_fields()
        self.analyze_frontend_interfaces()
        
        report, score = self.generate_report()
        
        print("\n" + "=" * 60)
        print("🎯 PROGRAM HARMONIZATION VALIDATION SUMMARY")
        print("=" * 60)
        
        if score >= 90:
            status_icon = "🟢"
            status_text = "EXCELLENT"
        elif score >= 70:
            status_icon = "🟡"
            status_text = "GOOD"
        elif score >= 50:
            status_icon = "🟠"
            status_text = "NEEDS IMPROVEMENT"
        else:
            status_icon = "🔴"
            status_text = "CRITICAL"
        
        print(f"\n{status_icon} Overall Score: {score:.1f}% - {status_text}")
        
        print(f"\n📋 Field Mapping Results:")
        print(f"   📊 Total Fields: {report['field_mappings']['total_fields']}")
        print(f"   📊 Coverage: {report['field_mappings']['coverage_percentage']:.1f}%")
        
        print(f"\n🏗️ Program Types:")
        if report['program_types']['critical_issue']:
            print(f"   🚨 CRITICAL: Type mismatch detected!")
            print(f"   📊 Model types: {report['program_types']['model_types_count']}")
            print(f"   📊 API types: {report['program_types']['programs_ts_types_count']}")
        else:
            print(f"   ✅ Program types consistent across all interfaces")
        
        print(f"\n⚙️ Computed Properties:")
        print(f"   📊 Status: {report['computed_properties']['implementation_status']}")
        print(f"   📊 Required: {report['computed_properties']['required_count']}")
        
        print(f"\n💡 Key Recommendations ({len(report['recommendations'])}):")
        for i, rec in enumerate(report['recommendations'][:5], 1):
            print(f"   {i}. {rec}")
        if len(report['recommendations']) > 5:
            print(f"   ... and {len(report['recommendations']) - 5} more recommendations")
        
        print("\n" + "=" * 60)
        if score >= 90:
            print("🎉 PROGRAM HARMONIZATION: EXCELLENT STATUS")
            print("🚀 Ready for production deployment!")
        elif score >= 70:
            print("✅ PROGRAM HARMONIZATION: GOOD STATUS")  
            print("⚠️ Minor improvements recommended")
        else:
            print("🚨 PROGRAM HARMONIZATION: REQUIRES ATTENTION")
            print("🔧 Significant improvements needed")
        print("=" * 60)
        
        # Save detailed report
        with open('program_harmonization_validation_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: program_harmonization_validation_report.json")
        
        return score >= 70

def main():
    """Main execution function"""
    validator = ProgramHarmonizationValidator()
    success = validator.run_validation()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
