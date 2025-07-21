#!/usr/bin/env python
"""
Check who is managing parliament operations in the fuel coupon system
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, ParliamentSession, Program, SubCenter

def check_parliament_managers():
    print("🏛️ PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("=" * 60)
    print("PARLIAMENT OPERATIONS MANAGEMENT STRUCTURE")
    print("📋 SUB-CENTERS NOW MANAGE PARLIAMENT OPERATIONS")
    print("=" * 60)
    
    # Check administrative users
    print("\n👥 SYSTEM ADMINISTRATORS:")
    print("-" * 30)
    admins = User.objects.filter(role__in=['SUPERUSER', 'ADMIN']).order_by('role', 'username')
    for admin in admins:
        print(f"• {admin.role}: {admin.username} ({admin.get_full_name()})")
        if admin.email:
            print(f"  Email: {admin.email}")
    
    if not admins.exists():
        print("  No system administrators found")
    
    # Check sub-center managers (NOW PRIMARY PARLIAMENT OPERATIONS MANAGERS)
    print("\n� SUB-CENTER MANAGERS (Primary Parliament Operations Managers):")
    print("-" * 70)
    subcenter_managers = User.objects.filter(role='SUB_CENTER').order_by('username')
    for manager in subcenter_managers:
        print(f"• {manager.username} ({manager.get_full_name()})")
        if manager.sub_center:
            print(f"  Manages SubCenter: {manager.sub_center.name} (ID: {manager.sub_center.id})")
            print(f"  Location: {manager.sub_center.location}")
        if manager.email:
            print(f"  Email: {manager.email}")
        
        # Check parliament sessions they manage
        managed_sessions = manager.managed_parliament_sessions.count() if hasattr(manager, 'managed_parliament_sessions') else 0
        if managed_sessions > 0:
            print(f"  Parliament Sessions Managed: {managed_sessions}")
        
        # Check programs they organize
        program_count = manager.organized_programs.count()
        if program_count > 0:
            print(f"  Programs Organized: {program_count}")
        
        print("")  # Empty line for readability
    
    if not subcenter_managers.exists():
        print("  No sub-center managers found")
    
    # Check main center officers (now secondary/oversight role)
    print("\n� MAIN CENTER OFFICERS (Oversight & System Administration):")
    print("-" * 60)
    main_center_officers = User.objects.filter(role='MAIN_CENTER').order_by('username')
    for officer in main_center_officers:
        print(f"• {officer.username} ({officer.get_full_name()})")
        if officer.email:
            print(f"  Email: {officer.email}")
        # Check if they've organized any programs
        program_count = officer.organized_programs.count()
        if program_count > 0:
            print(f"  Programs Organized: {program_count}")
        
        # Check parliament sessions they manage
        managed_sessions = officer.managed_parliament_sessions.count() if hasattr(officer, 'managed_parliament_sessions') else 0
        if managed_sessions > 0:
            print(f"  Parliament Sessions Managed: {managed_sessions}")
    
    if not main_center_officers.exists():
        print("  No main center officers found")
    
    # Check program organizers specifically
    print("\n📋 ACTIVE PROGRAM ORGANIZERS:")
    print("-" * 30)
    organizers = User.objects.filter(organized_programs__isnull=False).distinct().order_by('role', 'username')
    for organizer in organizers:
        program_count = organizer.organized_programs.count()
        active_programs = organizer.organized_programs.filter(is_active=True).count()
        print(f"• {organizer.role}: {organizer.username}")
        print(f"  Total Programs: {program_count} (Active: {active_programs})")
        
        # Show recent programs
        recent_programs = organizer.organized_programs.order_by('-scheduled_date')[:3]
        for program in recent_programs:
            print(f"    - {program.title} ({program.get_program_type_display()}) - {program.scheduled_date.date()}")
    
    print("\n🏛️ PARLIAMENT SESSION MANAGEMENT:")
    print("-" * 35)
    session_count = ParliamentSession.objects.count()
    active_sessions = ParliamentSession.objects.filter(is_active=True).count()
    subcenter_managed_sessions = ParliamentSession.objects.filter(managing_subcenter__isnull=False).count()
    print(f"Total Parliament Sessions: {session_count}")
    print(f"Active Sessions: {active_sessions}")
    print(f"SubCenter Managed Sessions: {subcenter_managed_sessions}")
    
    if session_count > 0:
        print("\nRecent Parliament Sessions:")
        recent_sessions = ParliamentSession.objects.select_related('session_manager', 'managing_subcenter').order_by('-start_date')[:5]
        for session in recent_sessions:
            print(f"  • {session.title} ({session.get_session_type_display()})")
            print(f"    Date: {session.start_date.date()} | Venue: {session.venue}")
            print(f"    Fuel Entitlement: {session.fuel_entitlement_litres}L")
            if session.session_manager:
                print(f"    Manager: {session.session_manager.username} ({session.session_manager.role})")
            if session.managing_subcenter:
                print(f"    SubCenter: {session.managing_subcenter.name}")
            print()
    
    # System statistics
    print("\n📊 SYSTEM OVERVIEW:")
    print("-" * 20)
    total_users = User.objects.count()
    total_subcenters = SubCenter.objects.count()
    total_programs = Program.objects.count()
    active_programs = Program.objects.filter(is_active=True).count()
    
    print(f"Total Users: {total_users}")
    print(f"Total Sub-Centers: {total_subcenters}")
    print(f"Total Programs: {total_programs} (Active: {active_programs})")
    
    # Management hierarchy - UPDATED FOR SUBCENTER-LED OPERATIONS
    print("\n🔗 NEW MANAGEMENT HIERARCHY (SubCenter-Led Operations):")
    print("-" * 55)
    print("1. SUPERUSER/ADMIN - Overall system administration")
    print("2. SUB_CENTER Officers - PRIMARY Parliament Operations Management")
    print("   ├── Create and manage regional parliament sessions")
    print("   ├── Organize local events and distributions") 
    print("   ├── Track attendance and fuel entitlements")
    print("   ├── Assign session managers and regional coordinators")
    print("   └── Generate regional compliance reports")
    print("3. MAIN_CENTER Officers - Parliament System Oversight")
    print("   ├── Monitor subcenter parliament operations")
    print("   ├── Cross-regional coordination and reporting")
    print("   ├── System-wide analytics and compliance")
    print("   └── Policy and procedure oversight")
    print("4. BENEFICIARIES - Individual Account Management")
    print("   ├── View personal fuel allocations")
    print("   ├── Track individual transaction history")
    print("   └── Manage personal profile and preferences")
    
    print("\n🎯 SUBCENTER PARLIAMENT OPERATIONS RESPONSIBILITIES:")
    print("-" * 55)
    print("✓ Create and manage parliament sessions for their region")
    print("✓ Track MP and staff attendance at sessions")
    print("✓ Calculate and distribute fuel entitlements")
    print("✓ Organize local parliament-related events")
    print("✓ Manage coupon distribution for parliament activities")
    print("✓ Generate regional compliance reports")
    print("✓ Coordinate with main center for system-wide activities")
    
    print("\n" + "=" * 60)
    print("🏛️ PARLIAMENT OPERATIONS ARE NOW MANAGED BY SUB-CENTERS")
    print("For operational questions, contact your regional SUB-CENTER manager listed above.")

if __name__ == "__main__":
    try:
        check_parliament_managers()
    except Exception as e:
        print(f"Error checking parliament managers: {e}")
        print("Make sure Django is properly configured and the database is accessible.")
