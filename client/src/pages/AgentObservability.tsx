import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Brain,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

export default function AgentObservability() {
  const { user } = useAuth();

  const { data: processingLogs } = useQuery({
    queryKey: ['/api/processing-logs'],
  });

  const agentMetrics = {
    emailAgent: {
      status: 'healthy',
      lastCheck: '30 seconds ago',
      processedToday: 127,
      successRate: 98.5,
      avgResponseTime: '2.3s',
      errors: 2,
    },
    aiAgent: {
      status: 'warning',
      lastCheck: '1 minute ago',
      processedToday: 89,
      successRate: 94.2,
      avgResponseTime: '1.8s',
      errors: 5,
    },
    erpAgent: {
      status: 'healthy',
      lastCheck: '45 seconds ago',
      processedToday: 76,
      successRate: 97.8,
      avgResponseTime: '0.9s',
      errors: 1,
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6" data-testid="agent-observability-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Observability</h1>
          <p className="text-gray-600">Monitor and analyze agent performance across the platform</p>
        </div>
        <Button variant="outline" data-testid="refresh-agents-button">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Email Agent */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">Email Agent</CardTitle>
                  <p className="text-xs text-gray-500">Email monitoring & processing</p>
                </div>
              </div>
              <Badge className={getStatusColor(agentMetrics.emailAgent.status)}>
                {getStatusIcon(agentMetrics.emailAgent.status)}
                <span className="ml-1 capitalize">{agentMetrics.emailAgent.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Check</span>
              <span className="text-sm font-medium">{agentMetrics.emailAgent.lastCheck}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Processed Today</span>
              <span className="text-sm font-medium">{agentMetrics.emailAgent.processedToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">{agentMetrics.emailAgent.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response</span>
              <span className="text-sm font-medium">{agentMetrics.emailAgent.avgResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Errors</span>
              <span className="text-sm font-medium text-red-600">{agentMetrics.emailAgent.errors}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Agent */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">AI Processing Agent</CardTitle>
                  <p className="text-xs text-gray-500">OCR & data extraction</p>
                </div>
              </div>
              <Badge className={getStatusColor(agentMetrics.aiAgent.status)}>
                {getStatusIcon(agentMetrics.aiAgent.status)}
                <span className="ml-1 capitalize">{agentMetrics.aiAgent.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Check</span>
              <span className="text-sm font-medium">{agentMetrics.aiAgent.lastCheck}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Processed Today</span>
              <span className="text-sm font-medium">{agentMetrics.aiAgent.processedToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-yellow-600">{agentMetrics.aiAgent.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response</span>
              <span className="text-sm font-medium">{agentMetrics.aiAgent.avgResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Errors</span>
              <span className="text-sm font-medium text-red-600">{agentMetrics.aiAgent.errors}</span>
            </div>
          </CardContent>
        </Card>

        {/* ERP Agent */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">ERP Integration Agent</CardTitle>
                  <p className="text-xs text-gray-500">System synchronization</p>
                </div>
              </div>
              <Badge className={getStatusColor(agentMetrics.erpAgent.status)}>
                {getStatusIcon(agentMetrics.erpAgent.status)}
                <span className="ml-1 capitalize">{agentMetrics.erpAgent.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Check</span>
              <span className="text-sm font-medium">{agentMetrics.erpAgent.lastCheck}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Processed Today</span>
              <span className="text-sm font-medium">{agentMetrics.erpAgent.processedToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">{agentMetrics.erpAgent.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response</span>
              <span className="text-sm font-medium">{agentMetrics.erpAgent.avgResponseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Errors</span>
              <span className="text-sm font-medium text-red-600">{agentMetrics.erpAgent.errors}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance" data-testid="performance-tab">Performance Metrics</TabsTrigger>
          <TabsTrigger value="logs" data-testid="logs-tab">Processing Logs</TabsTrigger>
          <TabsTrigger value="errors" data-testid="errors-tab">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Performance Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Throughput</h4>
                  <p className="text-2xl font-bold text-blue-600">292</p>
                  <p className="text-sm text-gray-500">documents/hour</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Accuracy</h4>
                  <p className="text-2xl font-bold text-green-600">96.8%</p>
                  <p className="text-sm text-gray-500">data extraction</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Latency</h4>
                  <p className="text-2xl font-bold text-yellow-600">1.7s</p>
                  <p className="text-sm text-gray-500">avg processing</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Error Rate</h4>
                  <p className="text-2xl font-bold text-red-600">2.1%</p>
                  <p className="text-sm text-gray-500">failed operations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Processing Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {processingLogs?.slice(0, 20).map((log: any) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`processing-log-${log.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        log.status === 'completed' ? 'bg-green-500' :
                        log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{log.stage}</p>
                        <p className="text-sm text-gray-500">
                          {log.purchaseOrderId && `PO: ${log.purchaseOrderId}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.status}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.duration && (
                        <p className="text-xs text-gray-500">{log.duration}ms</p>
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No processing logs available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Most Common Errors</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vendor not found</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>OCR confidence low</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ERP timeout</span>
                        <span className="font-medium">18%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Error Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This hour</span>
                        <span className="font-medium text-red-600">3 errors</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Today</span>
                        <span className="font-medium">8 errors</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>This week</span>
                        <span className="font-medium">42 errors</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Resolution Time</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Auto-resolved</span>
                        <span className="font-medium text-green-600">72%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Human review</span>
                        <span className="font-medium text-yellow-600">23%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Manual fix</span>
                        <span className="font-medium text-red-600">5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
