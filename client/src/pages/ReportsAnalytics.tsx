import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Clock,
  Target,
  Users,
} from "lucide-react";

export default function ReportsAnalytics() {
  const { user } = useAuth();

  const { data: dashboardMetrics } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  const reportCards = [
    {
      title: "127",
      subtitle: "Reports Generated",
      description: "This month",
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "45.2K",
      subtitle: "Data Points",
      description: "Analyzed",
      icon: BarChart3,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "5",
      subtitle: "Export Formats",
      description: "Available",
      icon: Download,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "12",
      subtitle: "Scheduled Reports",
      description: "Active",
      icon: Calendar,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  const analyticsCards = [
    {
      title: "Executive Summary",
      period: "Monthly",
      description: "High-level overview of automation performance and ROI metrics",
      lastGenerated: "2 days ago",
      status: "ready",
    },
    {
      title: "Processing Analytics",
      period: "Weekly",
      description: "Detailed breakdown of PO processing volumes and efficiency",
      lastGenerated: "1 day ago",
      status: "ready",
    },
    {
      title: "Vendor Performance",
      period: "Monthly",
      description: "Analysis of vendor processing accuracy and compliance rates",
      lastGenerated: "5 days ago",
      status: "ready",
    },
    {
      title: "Compliance Audit",
      period: "Quarterly",
      description: "Regulatory compliance tracking and audit trail documentation",
      lastGenerated: "1 week ago",
      status: "generating",
    },
    {
      title: "Performance Trends",
      period: "Monthly",
      description: "Historical analysis and predictive insights for capacity planning",
      lastGenerated: "4 days ago",
      status: "ready",
    },
    {
      title: "Error Analysis",
      period: "Bi-weekly",
      description: "Comprehensive review of processing failures and resolution patterns",
      lastGenerated: "3 days ago",
      status: "ready",
    },
  ];

  const scheduledReports = [
    {
      name: "Weekly Processing Summary",
      schedule: "Every Monday at 9:00 AM",
      recipients: "3 recipients",
      status: "active",
    },
    {
      name: "Monthly Executive Dashboard", 
      schedule: "1st of every month",
      recipients: "5 recipients",
      status: "active",
    },
    {
      name: "Vendor Performance Review",
      schedule: "Every 2 weeks",
      recipients: "2 recipients",
      status: "paused",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6" data-testid="reports-analytics-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and export detailed analytics</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" data-testid="date-range-button">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" data-testid="filters-button">
            Filters
          </Button>
          <Button data-testid="export-all-button">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportCards.map((card, index) => (
          <Card key={index} className="border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`${card.iconColor} text-xl`} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500">{card.subtitle}</h3>
                  <p className="text-2xl font-bold text-gray-900">{card.title}</p>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600">{card.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics Reports</TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="scheduled-tab">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="exports" data-testid="exports-tab">Data Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyticsCards.map((card, index) => (
              <Card key={index} className="border border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{card.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {card.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Last generated: {card.lastGenerated}</p>
                      <div className="mt-2">{getStatusBadge(card.status)}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`generate-report-${index}`}
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                      {card.status === 'ready' && (
                        <Button 
                          size="sm"
                          data-testid={`download-report-${index}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Reports</CardTitle>
                <Button data-testid="add-scheduled-report-button">
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((report, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`scheduled-report-${index}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-500">{report.schedule}</p>
                        <p className="text-xs text-gray-400">{report.recipients}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(report.status)}
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Data Export Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Purchase Orders (CSV)</h4>
                      <p className="text-sm text-gray-500">All processed PO data</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="export-po-csv">
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Processing Logs (JSON)</h4>
                      <p className="text-sm text-gray-500">Detailed processing history</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="export-logs-json">
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">Vendor Data (Excel)</h4>
                      <p className="text-sm text-gray-500">Master vendor database</p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="export-vendors-excel">
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Custom Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        className="border rounded px-3 py-2 text-sm"
                        data-testid="custom-export-start-date"
                      />
                      <input 
                        type="date" 
                        className="border rounded px-3 py-2 text-sm"
                        data-testid="custom-export-end-date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select 
                      className="w-full border rounded px-3 py-2 text-sm"
                      data-testid="custom-export-format"
                    >
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>Excel</option>
                      <option>PDF Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Include Fields
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Purchase Order Details</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Processing Timestamps</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Error Logs</span>
                      </label>
                    </div>
                  </div>
                  <Button className="w-full" data-testid="generate-custom-export">
                    Generate Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
