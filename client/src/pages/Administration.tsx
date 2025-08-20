import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Database, 
  Users, 
  Brain, 
  ChevronRight,
  Settings,
  CheckCircle,
  AlertTriangle 
} from "lucide-react";

export default function Administration() {
  const adminSections = [
    {
      title: "Email Configuration",
      description: "Configure email accounts for PO monitoring",
      href: "/email-config",
      icon: Mail,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      status: "configured",
      statusText: "3 accounts active",
    },
    {
      title: "ERP Integration",
      description: "Manage ERP system connections and settings",
      href: "/erp-config",
      icon: Database,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      status: "configured",
      statusText: "2 systems connected",
    },
    {
      title: "User Management",
      description: "Manage user accounts and access permissions",
      href: "/user-mgmt",
      icon: Users,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      status: "pending",
      statusText: "5 users, 2 pending",
    },
    {
      title: "AI Settings",
      description: "Configure AI processing parameters and thresholds",
      href: "/ai-settings",
      icon: Brain,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      status: "configured",
      statusText: "OpenAI GPT-4 active",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configured
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Attention Needed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6" data-testid="administration-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">System configuration and management</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Email Accounts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">2 active, 1 inactive</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-600" />
              <span>ERP Systems</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-500">Connected and syncing</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Synced</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card 
              className="border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
              data-testid={`admin-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${section.iconBg} rounded-lg flex items-center justify-center`}>
                      <section.icon className={`${section.iconColor} text-xl`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{section.statusText}</p>
                  {getStatusBadge(section.status)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* System Overview */}
      <div className="mt-8">
        <Card className="border border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>System Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">OCR Settings</h4>
                <p className="text-sm text-gray-600 mb-2">OCR Accuracy Threshold</p>
                <p className="text-lg font-bold text-green-600">85%</p>
                <p className="text-xs text-gray-500">Minimum confidence level for OCR results</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Validation Rules</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Strict Vendor Matching</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Auto-approve Known Vendors</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Processing Limits</h4>
                <p className="text-sm text-gray-600 mb-2">Maximum PO Amount (Auto-approve)</p>
                <p className="text-lg font-bold text-blue-600">$10,000</p>
                <p className="text-xs text-gray-500">Orders above this require manual review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
