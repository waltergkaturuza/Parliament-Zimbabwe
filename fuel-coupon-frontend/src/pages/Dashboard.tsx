// src/pages/Dashboard.tsx
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart } from '../components/shared/Chart';
import { StatsCard } from '../components/shared/StatsCard';
import { CouponService } from '../api/coupons';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Dashboard.module.css'; // Import CSS module
import ParliamentLogo from '@/components/ParliamentLogo';
import type { Role } from '@/types/models';

interface StatsData {
    total_coupons: number;
    available_coupons: number;
    allocated_coupons: number;
    used_coupons: number;
    expired_coupons: number;
    damaged_coupons: number;
    total_users: number;
    beneficiary_count: number;
    sub_center_count: number;
    monthly_coupon_usage: { month: string; usage_count: number }[];
}

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { data: stats, isLoading, isError, error } = useQuery<StatsData>({
        queryKey: ['dashboard-stats'],
        queryFn: () => CouponService.getStatistics(),
        enabled: !!user,
    });

    const statusDistribution = {
        labels: ['Available', 'Allocated', 'Used', 'Expired', 'Damaged'],
        datasets: [
            {
                label: 'Coupons by Status',
                data: [
                    stats?.available_coupons || 0,
                    stats?.allocated_coupons || 0,
                    stats?.used_coupons || 0,
                    stats?.expired_coupons || 0,
                    stats?.damaged_coupons || 0
                ],
                backgroundColor: [
                    '#4ade80', '#60a5fa', '#fbbf24', '#94a3b8', '#f87171',
                ],
            },
        ],
    };

    const monthlyTrends = {
        labels: stats?.monthly_coupon_usage?.map(item => item.month) || [],
        datasets: [
            {
                label: 'Monthly Allocations',
                data: stats?.monthly_coupon_usage?.map(item => item.usage_count) || [],
                borderColor: '#3b82f6',
                backgroundColor: '#bfdbfe',
                fill: true,
            },
        ],
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading) {
        return <div>Loading dashboard data...</div>;
    }

    if (isError) {
        return <div className="text-red-500">Error loading dashboard data: {error?.message}</div>;
    }

    if (!stats) {
        return <div>No dashboard data available.</div>;
    }

    const isAdmin = user?.role === 'SUPERUSER' || user?.role === 'ADMIN';
    const isMainCenter = user?.role === 'MAIN_CENTER';
    const isSubCenter = user?.role === 'SUB_CENTER';
    const isAuditor = user?.role === 'AUDITOR';
    const isBeneficiary = user?.role === 'BENEFICIARY';

    return (
        <div className={styles.dashboardContainer}>
            <nav className={styles.sidebar}>
                <h2 className={styles.sidebarTitle}>Menu</h2>
                <ul className={styles.navList}>
                    {isAdmin && (
                        <>
                            <li className={styles.navItem}><Link to="/users" className={styles.navLink}>Manage Users</Link></li>
                            <li className={styles.navItem}><Link to="/sub-centers" className={styles.navLink}>Sub Centers</Link></li>
                            <li className={styles.navItem}><Link to="/programs" className={styles.navLink}>Programs</Link></li>
                            <li className={styles.navItem}><Link to="/coupons" className={styles.navLink}>Manage Coupons</Link></li>
                            <li className={styles.navItem}><Link to="/books" className={styles.navLink}>Books</Link></li>
                            <li className={styles.navItem}><Link to="/boxes" className={styles.navLink}>Boxes</Link></li>
                            <li className={styles.navItem}><Link to="/handovers" className={styles.navLink}>Handovers</Link></li>
                            <li className={styles.navItem}><Link to="/attendances" className={styles.navLink}>Attendances</Link></li>
                            <li className={styles.navItem}><Link to="/audit-logs" className={styles.navLink}>Audit Logs</Link></li> {/* Example for admin */}
                        </>
                    )}
                    {(isMainCenter || isAdmin) && (
                        <>
                            <li className={styles.navItem}><Link to="/programs" className={styles.navLink}>Programs</Link></li>
                            <li className={styles.navItem}><Link to="/coupons" className={styles.navLink}>Manage Coupons</Link></li>
                            <li className={styles.navItem}><Link to="/books" className={styles.navLink}>Books</Link></li>
                            <li className={styles.navItem}><Link to="/boxes" className={styles.navLink}>Boxes</Link></li>
                        </>
                    )}
                    {(isSubCenter || isAdmin) && (
                        <>
                            <li className={styles.navItem}><Link to="/coupons/allocate" className={styles.navLink}>Allocate Coupons</Link></li>
                            <li className={styles.navItem}><Link to="/attendances/record" className={styles.navLink}>Record Attendance</Link></li>
                            <li className={styles.navItem}><Link to="/handovers/create" className={styles.navLink}>Create Handover</Link></li>
                            <li className={styles.navItem}><Link to="/books" className={styles.navLink}>View Books</Link></li>
                            <li className={styles.navItem}><Link to="/boxes" className={styles.navLink}>View Boxes</Link></li>
                        </>
                    )}
                    {(isAuditor || isAdmin) && (
                        <li className={styles.navItem}><Link to="/audit" className={styles.navLink}>Audit Dashboard</Link></li>
                    )}
                    {(isBeneficiary || isAdmin) && (
                        <li className={styles.navItem}><Link to="/my-coupons" className={styles.navLink}>My Coupons</Link></li>
                    )}
                    <li className={styles.navItem}><button onClick={handleLogout} className={styles.navLink}>Logout</button></li>
                </ul>
            </nav>
            <div className={styles.mainContent}>
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                {user && <p className="text-gray-600 mb-4">Logged in as: {user.username} ({user.role})</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatsCard title="Total Coupons" value={stats?.total_coupons} trend="up" />
                    <StatsCard title="Allocated" value={stats?.allocated_coupons} />
                    <StatsCard title="Used" value={stats?.used_coupons} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Chart title="Coupon Status Distribution" type="pie" data={statusDistribution} />
                    <Chart title="Monthly Allocation Trend" type="line" data={monthlyTrends} />
                </div>

                {/* You can add role-specific widgets or information here if needed */}
            </div>
        </div>
    );
};

export default Dashboard;
