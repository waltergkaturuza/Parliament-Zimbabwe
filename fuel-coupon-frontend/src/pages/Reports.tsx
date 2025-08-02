// src/pages/Reports.tsx
import ParliamentLogo from '@/components/ParliamentLogo';
import { ExportButtons, QuickExportButton, PrintButton } from '../components/ui/export-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Users, Book, TrendingUp, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useState } from 'react';

export default function Reports() {
    const [selectedDateRange, setSelectedDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        to: new Date()
    });

    const reportSections = [
        {
            title: "Fuel Coupons Reports",
            description: "Export and view coupon-related data",
            entityType: "coupons" as const,
            icon: <Book className="h-8 w-8" />,
            filters: {
                date_from: selectedDateRange.from.toISOString().split('T')[0],
                date_to: selectedDateRange.to.toISOString().split('T')[0]
            }
        },
        {
            title: "Transaction Reports",
            description: "Fuel transaction history and analytics",
            entityType: "transactions" as const,
            icon: <TrendingUp className="h-8 w-8" />,
            filters: {
                date_from: selectedDateRange.from.toISOString().split('T')[0],
                date_to: selectedDateRange.to.toISOString().split('T')[0]
            }
        },
        {
            title: "User Management Reports",
            description: "System users and access reports",
            entityType: "users" as const,
            icon: <Users className="h-8 w-8" />,
            filters: {}
        },
        {
            title: "Beneficiary Reports",
            description: "Parliament members and beneficiary data",
            entityType: "beneficiaries" as const,
            icon: <Users className="h-8 w-8" />,
            filters: {}
        },
        {
            title: "Book Management Reports",
            description: "Coupon book tracking and status",
            entityType: "books" as const,
            icon: <Book className="h-8 w-8" />,
            filters: {}
        },
        {
            title: "Dashboard Summary",
            description: "Complete system overview and metrics",
            entityType: "dashboard" as const,
            icon: <Calendar className="h-8 w-8" />,
            filters: {}
        }
    ];

    return (
        <div className="p-4">
            {/* Header with Parliament Logo */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <ParliamentLogo size="xs" showText={true} />
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
                </div>
                <div className="flex gap-2">
                    <PrintButton entityType="page">
                        Print This Page
                    </PrintButton>
                </div>
            </div>

            {/* Date Range Selector */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Report Date Range
                    </CardTitle>
                    <CardDescription>
                        Select date range for time-based reports (applies to Coupons and Transactions)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={selectedDateRange.from.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDateRange(prev => ({
                                    ...prev,
                                    from: new Date(e.target.value)
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={selectedDateRange.to.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDateRange(prev => ({
                                    ...prev,
                                    to: new Date(e.target.value)
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => setSelectedDateRange({
                                from: new Date(new Date().setDate(new Date().getDate() - 30)),
                                to: new Date()
                            })}
                        >
                            Last 30 Days
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reportSections.map((section, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    {section.icon}
                                </div>
                                {section.title}
                            </CardTitle>
                            <CardDescription>{section.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Quick Export Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <QuickExportButton
                                        entityType={section.entityType}
                                        format="csv"
                                        filters={section.filters}
                                        className="flex-1 min-w-0"
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        CSV
                                    </QuickExportButton>
                                    <QuickExportButton
                                        entityType={section.entityType}
                                        format="excel"
                                        filters={section.filters}
                                        className="flex-1 min-w-0"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                                        Excel
                                    </QuickExportButton>
                                    <QuickExportButton
                                        entityType={section.entityType}
                                        format="pdf"
                                        filters={section.filters}
                                        className="flex-1 min-w-0"
                                    >
                                        <Printer className="h-4 w-4 mr-1" />
                                        PDF
                                    </QuickExportButton>
                                </div>
                                
                                {/* Full Export Options */}
                                <ExportButtons
                                    entityType={section.entityType}
                                    filters={section.filters}
                                    showPrint={true}
                                    showView={false}
                                    showTemplate={section.entityType === 'coupons' || section.entityType === 'users' || section.entityType === 'beneficiaries'}
                                    className="w-full"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions Section */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                        Common reporting and export tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                            <Download className="h-6 w-6" />
                            <span>Download All Templates</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                            <FileSpreadsheet className="h-6 w-6" />
                            <span>Monthly Summary</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                            <Users className="h-6 w-6" />
                            <span>User Activity Report</span>
                        </Button>
                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                            <TrendingUp className="h-6 w-6" />
                            <span>Analytics Dashboard</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Export Help</CardTitle>
                    <CardDescription>
                        Information about report formats and usage
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h4 className="font-semibold mb-2">CSV Format</h4>
                            <p className="text-gray-600">
                                Best for data analysis and importing into other systems. 
                                Compatible with Excel, Google Sheets, and databases.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Excel Format</h4>
                            <p className="text-gray-600">
                                Formatted spreadsheets with styling and formulas. 
                                Perfect for reports and presentations.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">PDF Format</h4>
                            <p className="text-gray-600">
                                Print-ready documents with professional formatting. 
                                Ideal for official reports and archiving.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
