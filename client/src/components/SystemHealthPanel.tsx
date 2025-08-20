import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Brain, Database } from "lucide-react";

export default function SystemHealthPanel() {
  const systemComponents = [
    {
      name: "Email Monitoring",
      status: "Online",
      statusText: "3 active inboxes",
      icon: Mail,
      statusColor: "bg-green-100 text-green-800",
      iconColor: "text-green-600",
    },
    {
      name: "AI Processing",
      status: "Active", 
      statusText: "2 items in queue",
      icon: Brain,
      statusColor: "bg-yellow-100 text-yellow-800",
      iconColor: "text-yellow-600",
    },
    {
      name: "ERP Integration",
      status: "Synced",
      statusText: "2/2 systems connected", 
      icon: Database,
      statusColor: "bg-green-100 text-green-800",
      iconColor: "text-green-600",
    },
  ];

  return (
    <Card className="border border-gray-100" data-testid="system-health-panel">
      <CardHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">System Health</CardTitle>
            <p className="text-sm text-gray-500">Real-time system monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium" data-testid="overall-status">
              Operational
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {systemComponents.map((component) => (
          <div 
            key={component.name} 
            className="flex items-center justify-between"
            data-testid={`system-component-${component.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${component.iconColor === 'text-green-600' ? 'bg-green-100' : component.iconColor === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                <component.icon className={`${component.iconColor} text-sm`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">{component.name}</p>
                <p className="text-xs text-gray-500" data-testid={`component-status-text-${component.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {component.statusText}
                </p>
              </div>
            </div>
            <Badge className={component.statusColor}>
              {component.status}
            </Badge>
          </div>
        ))}

        {/* Overall Performance */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">Overall Performance</span>
            <span 
              className="text-2xl font-bold text-green-600"
              data-testid="overall-performance-score"
            >
              98.5%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: '98.5%' }}
              data-testid="performance-bar"
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Excellent system efficiency score</p>
        </div>
      </CardContent>
    </Card>
  );
}
