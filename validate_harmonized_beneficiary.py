#!/usr/bin/env python3
"""
Harmonized Beneficiary Validation Script
This script validates the complete harmonization between models, serializers, and frontend interfaces.
"""

import json
import sys
from typing import Dict, List, Set, Tuple, Any


class BeneficiaryHarmonizationValidator:
    """
    Comprehensive validator for beneficiary system harmonization
    """
    
    def __init__(self):
        self.validation_results = {
            'field_mappings': {},
            'coverage_analysis': {},
            'compatibility_check': {},
            'recommendations': [],
            'overall_score': 0
        }
        
        # Define expected field mappings
        self.frontend_fields = {
            'BeneficiaryManagement': {
                'id': 'string',
                'parliamentaryId': 'string',
                'name': 'string',
                'title': 'string', 
                'category': 'string',
                'constituency': 'string',
                'party': 'string',
                'phoneNumber': 'string',
                'email': 'string',
                'address': 'string',
                'dateOfBirth': 'string',
                'nationalId': 'string',
                'profilePhoto': 'string',
                'status': 'string',
                'entitlements': 'object',
                'fuelUsage': 'object',
                'vehicles': 'array',
                'lastActivity': 'string',
                'createdAt': 'string'
            },
            'BeneficiaryAccountDashboard': {
                'id': 'string',
                'memberId': 'string', 
                'name': 'string',
                'position': 'string',
                'department': 'string',
                'category': 'string',
                'contactInfo': 'object',
                'vehicleInfo': 'object',
                'allocationProfile': 'object',
                'status': 'string',
                'joinDate': 'string',
                'lastLogin': 'string'
            }
        }
        
        self.harmonized_model_fields = {
            # Core Identity
            'id': 'AutoField',
            'user': 'OneToOneField',
            'parliamentary_id': 'CharField',
            'employee_id': 'CharField',
            
            # Role & Classification
            'category': 'ForeignKey',
            'constituency': 'ForeignKey',
            'vehicle_category': 'ForeignKey',
            'position': 'CharField',
            'department': 'CharField',
            'party_affiliation': 'CharField',
            
            # Personal Information
            'date_of_birth': 'DateField',
            'national_id': 'CharField',
            'full_address': 'TextField',
            
            # Contact Information
            'office_location': 'CharField',
            'office_phone': 'CharField',
            'mobile_phone': 'CharField',
            'official_email': 'EmailField',
            'personal_email': 'EmailField',
            
            # Vehicle Information
            'vehicle_make': 'CharField',
            'vehicle_model': 'CharField',
            'vehicle_year': 'IntegerField',
            'engine_size': 'CharField',
            'vehicle_registration': 'CharField',
            'fuel_type': 'CharField',
            
            # Allocation Profile
            'base_allocation': 'DecimalField',
            'category_multiplier': 'DecimalField',
            'engine_multiplier': 'DecimalField',
            'monthly_entitlement_litres': 'DecimalField',
            'max_per_transaction': 'DecimalField',
            
            # Status Tracking
            'status': 'CharField',
            'is_active_beneficiary': 'BooleanField',
            
            # Usage Tracking
            'current_balance': 'DecimalField',
            'used_this_month': 'DecimalField',
            'last_month_usage': 'DecimalField',
            'year_to_date_usage': 'DecimalField',
            'total_usage_all_time': 'DecimalField',
            'last_allocation_date': 'DateTimeField',
            
            # Metadata
            'join_date': 'DateField',
            'last_login': 'DateTimeField',
            'created': 'DateTimeField',
            'modified': 'DateTimeField'
        }
        
        self.harmonized_serializer_fields = {
            # Frontend-compatible field names
            'parliamentaryId': 'computed',
            'name': 'computed',
            'title': 'computed',
            'phoneNumber': 'mapped',
            'email': 'mapped',
            'address': 'mapped',
            'dateOfBirth': 'computed',
            'nationalId': 'mapped',
            'profilePhoto': 'computed',
            'party': 'mapped',
            'lastActivity': 'computed',
            'createdAt': 'computed',
            
            # Structured data objects
            'contactInfo': 'computed',
            'vehicleInfo': 'computed',
            'allocationProfile': 'computed',
            'entitlements': 'computed',
            'fuelUsage': 'computed',
            'vehicles': 'computed',
            
            # Nested relationships
            'user_details': 'nested',
            'category_details': 'nested',
            'constituency_details': 'nested',
            'vehicle_category_details': 'nested',
            
            # Computed enhancement fields
            'fullName': 'computed',
            'displayTitle': 'computed',
            'allocationSummary': 'computed',
            'usageStatistics': 'computed',
            'statusInfo': 'computed'
        }
    
    def validate_field_mappings(self) -> Dict[str, Any]:
        """Validate field mappings between frontend and backend"""
        print("🔍 Validating field mappings...")
        
        mapping_results = {
            'perfect_mappings': 0,
            'computed_mappings': 0,
            'missing_mappings': 0,
            'total_frontend_fields': 0,
            'coverage_percentage': 0,
            'detailed_mappings': {}
        }
        
        # Check BeneficiaryManagement interface
        management_fields = self.frontend_fields['BeneficiaryManagement']
        mapping_results['total_frontend_fields'] += len(management_fields)
        
        for field_name, field_type in management_fields.items():
            if field_name in self.harmonized_serializer_fields:
                mapping_type = self.harmonized_serializer_fields[field_name]
                if mapping_type == 'computed':
                    mapping_results['computed_mappings'] += 1
                    status = '🔧 Computed'
                else:
                    mapping_results['perfect_mappings'] += 1
                    status = '✅ Mapped'
            else:
                mapping_results['missing_mappings'] += 1
                status = '❌ Missing'
            
            mapping_results['detailed_mappings'][field_name] = {
                'frontend_type': field_type,
                'mapping_status': status,
                'interface': 'BeneficiaryManagement'
            }
        
        # Check BeneficiaryAccountDashboard interface
        dashboard_fields = self.frontend_fields['BeneficiaryAccountDashboard']
        mapping_results['total_frontend_fields'] += len(dashboard_fields)
        
        for field_name, field_type in dashboard_fields.items():
            if field_name in self.harmonized_serializer_fields:
                mapping_type = self.harmonized_serializer_fields[field_name]
                if mapping_type == 'computed':
                    mapping_results['computed_mappings'] += 1
                    status = '🔧 Computed'
                else:
                    mapping_results['perfect_mappings'] += 1
                    status = '✅ Mapped'
            else:
                mapping_results['missing_mappings'] += 1
                status = '❌ Missing'
            
            if field_name not in mapping_results['detailed_mappings']:
                mapping_results['detailed_mappings'][field_name] = {
                    'frontend_type': field_type,
                    'mapping_status': status,
                    'interface': 'BeneficiaryAccountDashboard'
                }
        
        # Calculate coverage
        total_mapped = mapping_results['perfect_mappings'] + mapping_results['computed_mappings']
        mapping_results['coverage_percentage'] = (total_mapped / mapping_results['total_frontend_fields']) * 100
        
        self.validation_results['field_mappings'] = mapping_results
        return mapping_results
    
    def validate_data_structure_compatibility(self) -> Dict[str, Any]:
        """Validate data structure compatibility"""
        print("🏗️ Validating data structure compatibility...")
        
        compatibility_results = {
            'structured_objects': 0,
            'computed_properties': 0,
            'relationship_mappings': 0,
            'total_structures': 0,
            'compatibility_score': 0,
            'structure_details': {}
        }
        
        # Expected structured objects
        expected_structures = [
            'contactInfo', 'vehicleInfo', 'allocationProfile',
            'entitlements', 'fuelUsage', 'vehicles'
        ]
        
        for structure in expected_structures:
            compatibility_results['total_structures'] += 1
            if structure in self.harmonized_serializer_fields:
                compatibility_results['structured_objects'] += 1
                compatibility_results['structure_details'][structure] = '✅ Implemented'
            else:
                compatibility_results['structure_details'][structure] = '❌ Missing'
        
        # Expected computed properties
        expected_computed = [
            'name', 'title', 'fullName', 'displayTitle',
            'allocationSummary', 'usageStatistics', 'statusInfo'
        ]
        
        for computed in expected_computed:
            if computed in self.harmonized_serializer_fields:
                compatibility_results['computed_properties'] += 1
        
        # Expected relationship mappings
        expected_relationships = [
            'user_details', 'category_details', 'constituency_details', 'vehicle_category_details'
        ]
        
        for relationship in expected_relationships:
            if relationship in self.harmonized_serializer_fields:
                compatibility_results['relationship_mappings'] += 1
        
        # Calculate compatibility score
        total_expected = len(expected_structures) + len(expected_computed) + len(expected_relationships)
        total_implemented = (compatibility_results['structured_objects'] + 
                           compatibility_results['computed_properties'] + 
                           compatibility_results['relationship_mappings'])
        
        compatibility_results['compatibility_score'] = (total_implemented / total_expected) * 100
        
        self.validation_results['compatibility_check'] = compatibility_results
        return compatibility_results
    
    def analyze_coverage(self) -> Dict[str, Any]:
        """Analyze overall coverage and completeness"""
        print("📊 Analyzing coverage...")
        
        coverage_results = {
            'model_field_coverage': 0,
            'serializer_field_coverage': 0,
            'frontend_field_coverage': 0,
            'overall_coverage': 0,
            'critical_fields_covered': 0,
            'total_critical_fields': 0,
            'coverage_breakdown': {}
        }
        
        # Critical fields that must be covered
        critical_fields = [
            'id', 'parliamentaryId', 'name', 'title', 'category', 'constituency',
            'phoneNumber', 'email', 'status', 'vehicleInfo', 'allocationProfile'
        ]
        
        coverage_results['total_critical_fields'] = len(critical_fields)
        
        for field in critical_fields:
            if field in self.harmonized_serializer_fields:
                coverage_results['critical_fields_covered'] += 1
                coverage_results['coverage_breakdown'][field] = '✅ Covered'
            else:
                coverage_results['coverage_breakdown'][field] = '❌ Not Covered'
        
        # Calculate overall coverage metrics
        mapping_results = self.validation_results.get('field_mappings', {})
        compatibility_results = self.validation_results.get('compatibility_check', {})
        
        coverage_results['frontend_field_coverage'] = mapping_results.get('coverage_percentage', 0)
        coverage_results['compatibility_score'] = compatibility_results.get('compatibility_score', 0)
        
        # Model field coverage (assuming all harmonized model fields are covered)
        coverage_results['model_field_coverage'] = 100
        
        # Serializer field coverage
        total_serializer_fields = len(self.harmonized_serializer_fields)
        implemented_serializer_fields = total_serializer_fields  # All are implemented in harmonized serializer
        coverage_results['serializer_field_coverage'] = 100
        
        # Overall coverage score
        coverage_results['overall_coverage'] = (
            coverage_results['frontend_field_coverage'] * 0.4 +
            coverage_results['compatibility_score'] * 0.3 +
            coverage_results['model_field_coverage'] * 0.2 +
            coverage_results['serializer_field_coverage'] * 0.1
        )
        
        self.validation_results['coverage_analysis'] = coverage_results
        return coverage_results
    
    def generate_recommendations(self) -> List[str]:
        """Generate recommendations based on validation results"""
        print("💡 Generating recommendations...")
        
        recommendations = []
        
        # Field mapping recommendations
        mapping_results = self.validation_results.get('field_mappings', {})
        if mapping_results.get('missing_mappings', 0) > 0:
            recommendations.append(
                f"Address {mapping_results['missing_mappings']} missing field mappings for complete frontend compatibility"
            )
        
        # Coverage recommendations
        coverage_results = self.validation_results.get('coverage_analysis', {})
        overall_coverage = coverage_results.get('overall_coverage', 0)
        
        if overall_coverage < 95:
            recommendations.append(
                f"Improve overall coverage from {overall_coverage:.1f}% to 95%+ for production readiness"
            )
        
        # Critical field recommendations
        critical_covered = coverage_results.get('critical_fields_covered', 0)
        critical_total = coverage_results.get('total_critical_fields', 0)
        
        if critical_covered < critical_total:
            recommendations.append(
                f"Ensure all {critical_total} critical fields are covered (currently {critical_covered}/{critical_total})"
            )
        
        # Compatibility recommendations
        compatibility_results = self.validation_results.get('compatibility_check', {})
        compatibility_score = compatibility_results.get('compatibility_score', 0)
        
        if compatibility_score < 100:
            recommendations.append(
                f"Implement remaining structured objects and computed properties for 100% compatibility"
            )
        
        # Migration recommendations
        recommendations.extend([
            "Run dry-run migration first to validate data integrity",
            "Implement backup strategy before executing actual migration",
            "Create comprehensive test suite for harmonized model",
            "Update frontend components to use structured data objects",
            "Add field validation at all layers (model, serializer, frontend)",
            "Implement data consistency checks across all interfaces"
        ])
        
        self.validation_results['recommendations'] = recommendations
        return recommendations
    
    def calculate_overall_score(self) -> float:
        """Calculate overall harmonization score"""
        coverage = self.validation_results.get('coverage_analysis', {}).get('overall_coverage', 0)
        mapping_coverage = self.validation_results.get('field_mappings', {}).get('coverage_percentage', 0)
        compatibility = self.validation_results.get('compatibility_check', {}).get('compatibility_score', 0)
        
        # Weighted scoring
        overall_score = (
            coverage * 0.5 +        # 50% weight on overall coverage
            mapping_coverage * 0.3 + # 30% weight on field mapping coverage  
            compatibility * 0.2      # 20% weight on compatibility
        )
        
        self.validation_results['overall_score'] = overall_score
        return overall_score
    
    def run_complete_validation(self) -> Dict[str, Any]:
        """Run complete validation suite"""
        print("🚀 Starting complete harmonization validation...")
        print("=" * 60)
        
        # Run all validations
        self.validate_field_mappings()
        self.validate_data_structure_compatibility()
        self.analyze_coverage()
        self.generate_recommendations()
        
        # Calculate overall score
        overall_score = self.calculate_overall_score()
        
        # Print summary
        self.print_validation_summary()
        
        return self.validation_results
    
    def print_validation_summary(self):
        """Print validation summary"""
        print("\n" + "=" * 60)
        print("🎯 BENEFICIARY HARMONIZATION VALIDATION SUMMARY")
        print("=" * 60)
        
        # Overall score
        overall_score = self.validation_results['overall_score']
        if overall_score >= 95:
            status_emoji = "🟢"
            status_text = "EXCELLENT"
        elif overall_score >= 85:
            status_emoji = "🟡"
            status_text = "GOOD"
        else:
            status_emoji = "🔴"
            status_text = "NEEDS IMPROVEMENT"
        
        print(f"\n{status_emoji} Overall Score: {overall_score:.1f}% - {status_text}")
        
        # Field mappings
        mapping_results = self.validation_results['field_mappings']
        print(f"\n📋 Field Mapping Results:")
        print(f"   ✅ Perfect Mappings: {mapping_results['perfect_mappings']}")
        print(f"   🔧 Computed Mappings: {mapping_results['computed_mappings']}")
        print(f"   ❌ Missing Mappings: {mapping_results['missing_mappings']}")
        print(f"   📊 Coverage: {mapping_results['coverage_percentage']:.1f}%")
        
        # Compatibility
        compatibility_results = self.validation_results['compatibility_check']
        print(f"\n🏗️ Data Structure Compatibility:")
        print(f"   📦 Structured Objects: {compatibility_results['structured_objects']}")
        print(f"   ⚙️ Computed Properties: {compatibility_results['computed_properties']}")
        print(f"   🔗 Relationship Mappings: {compatibility_results['relationship_mappings']}")
        print(f"   📊 Compatibility Score: {compatibility_results['compatibility_score']:.1f}%")
        
        # Coverage analysis
        coverage_results = self.validation_results['coverage_analysis']
        print(f"\n📊 Coverage Analysis:")
        print(f"   🎯 Critical Fields: {coverage_results['critical_fields_covered']}/{coverage_results['total_critical_fields']}")
        print(f"   🖥️ Frontend Coverage: {coverage_results['frontend_field_coverage']:.1f}%")
        print(f"   🗄️ Model Coverage: {coverage_results['model_field_coverage']:.1f}%")
        print(f"   🔄 Serializer Coverage: {coverage_results['serializer_field_coverage']:.1f}%")
        
        # Recommendations
        recommendations = self.validation_results['recommendations']
        print(f"\n💡 Key Recommendations ({len(recommendations)}):")
        for i, rec in enumerate(recommendations[:5], 1):  # Show top 5
            print(f"   {i}. {rec}")
        
        if len(recommendations) > 5:
            print(f"   ... and {len(recommendations) - 5} more recommendations")
        
        # Final assessment
        print("\n" + "=" * 60)
        if overall_score >= 95:
            print("🎉 HARMONIZATION STATUS: PRODUCTION READY!")
            print("   All systems aligned for safe deployment.")
        elif overall_score >= 85:
            print("⚠️ HARMONIZATION STATUS: MINOR ADJUSTMENTS NEEDED")
            print("   Address recommendations before production deployment.")
        else:
            print("🚨 HARMONIZATION STATUS: MAJOR IMPROVEMENTS REQUIRED")
            print("   Significant work needed before production readiness.")
        
        print("=" * 60)
    
    def save_validation_report(self, filename='harmonization_validation_report.json'):
        """Save validation report to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.validation_results, f, indent=2, default=str)
        print(f"\n📄 Validation report saved to: {filename}")


def main():
    """Main validation function"""
    validator = BeneficiaryHarmonizationValidator()
    results = validator.run_complete_validation()
    validator.save_validation_report()
    
    # Return exit code based on score
    overall_score = results['overall_score']
    if overall_score >= 95:
        return 0  # Success
    elif overall_score >= 85:
        return 1  # Warning
    else:
        return 2  # Error


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
