import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProcessMonitorModal from "@/components/ProcessMonitorModal";
import {
  RefreshCw,
  Mail,
  Eye,
  CheckCircle,
  Database,
  Play,
  Check,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface ProcessingStage {
  name: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  duration?: string;
  icon: any;
}

interface ActiveProcess {
  id: string;
  poNumber: string;
  vendorName: string;
  startTime: string;
  currentStage: string;
  stages: ProcessingStage[];
}

export default function RealTimeMonitor() {
  const { user } = useAuth();
  const { isConnected, lastMessage } = useWebSocket(user?.tenantId);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [activeProcesses, setActiveProcesses] = useState<ActiveProcess[]>([]);

  const { data: processingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/processing-logs'],
  });

  useEffect(() => {
    if (lastMessage?.type === 'process_update') {
      // Handle real-time process updates
      setActiveProcesses(prev => {
        const updated = [...prev];
        const index = updated.findIndex(p => p.id === lastMessage.data.processId);
        if (index >= 0) {
          updated[index] = { ...updated[index], ...lastMessage.data };
        }
        return updated;
      });
    }
  }, [lastMessage]);

  // Mock active processes for demo
  useEffect(() => {
    setActiveProcesses([
      {
        id: '1',
        poNumber: 'PO-2024-005',
        vendorName: 'Tech Supplies Inc',
        startTime: '2 minutes ago',
        currentStage: 'data_validation',
        stages: [
          { name: 'Email Detection', status: 'completed', duration: '2.1s', icon: Mail },
          { name: 'OCR Processing', status: 'completed', duration: '1.8s', icon: Eye },
          { name: 'Data Validation', status: 'processing', icon: CheckCircle },
          { name: 'ERP Formatting', status: 'pending', icon: RefreshCw },
          { name: 'ERP Integration', status: 'pending', icon: Database },
        ]
      },
      {
        id: '2',
        poNumber: 'PO-2024-006',
        vendorName: 'Office World Ltd',
        startTime: '5 minutes ago',
        currentStage: 'completed',
        stages: [
          { name: 'Email Detection', status: 'completed', duration: '1.9s', icon: Mail },
          { name: 'OCR Processing', status: 'completed', duration: '2.4s', icon: Eye },
          { name: 'Data Validation', status: 'completed', duration: '0.8s', icon: CheckCircle },
          { name: 'ERP Formatting', status: 'completed', duration: '0.3s', icon: RefreshCw },
          { name: 'ERP Integration', status: 'completed', duration: 'Reprocessed', icon: Database },
        ]
      }
    ]);
  }, []);

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'processing':
        return 'bg-blue-100 text-blue-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-400';
    }
  };

  const getStageIcon = (stage: ProcessingStage) => {
    if (stage.status === 'completed') return <Check className="w-4 h-4" />;
    if (stage.status === 'processing') return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (stage.status === 'failed') return <AlertTriangle className="w-4 h-4" />;
    return <stage.icon className="w-4 h-4" />;
  };

  const getConnectionLineColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-300';
      case 'processing':
        return 'bg-blue-300';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="p-6" data-testid="real-time-monitor-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Process Monitor</h1>
          <p className="text-gray-600">Live tracking of PO processing stages</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Live connected' : 'Disconnected'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLogs()}
            data-testid="refresh-monitor-button"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowProcessModal(true)}
            data-testid="detailed-view-button"
          >
            Detailed View
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center p-4 bg-green-50 border-green-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Mail className="text-green-600" />
          </div>
          <h4 className="font-medium text-green-900">Email Agent</h4>
          <p className="text-sm text-green-600" data-testid="email-agent-status">
            Monitoring 3 inboxes
          </p>
        </Card>

        <Card className="text-center p-4 bg-blue-50 border-blue-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Eye className="text-blue-600" />
          </div>
          <h4 className="font-medium text-blue-900">OCR Service</h4>
          <p className="text-sm text-blue-600" data-testid="ocr-service-status">
            98.5% accuracy
          </p>
        </Card>

        <Card className="text-center p-4 bg-yellow-50 border-yellow-200">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="text-yellow-600" />
          </div>
          <h4 className="font-medium text-yellow-900">Validation Engine</h4>
          <p className="text-sm text-yellow-600" data-testid="validation-engine-status">
            2 items in queue
          </p>
        </Card>

        <Card className="text-center p-4 bg-purple-50 border-purple-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Database className="text-purple-600" />
          </div>
          <h4 className="font-medium text-purple-900">ERP Connections</h4>
          <p className="text-sm text-purple-600" data-testid="erp-connections-status">
            2/2 systems online
          </p>
        </Card>
      </div>

      {/* Active Processes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Processes ({activeProcesses.length})</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeProcesses.map((process) => (
            <div key={process.id} className="border rounded-lg p-6 bg-white" data-testid={`active-process-${process.poNumber}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{process.poNumber}</h4>
                  <p className="text-sm text-gray-500">{process.vendorName}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">{process.startTime}</span>
                  <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${
                    process.currentStage === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                  }`}></div>
                </div>
              </div>

              {/* Process Pipeline */}
              <div className="flex items-center space-x-4 overflow-x-auto">
                {process.stages.map((stage, index) => (
                  <div key={stage.name} className="flex items-center space-x-4 min-w-0">
                    <div className="flex flex-col items-center min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${getStageStatusColor(stage.status)}`}>
                        {getStageIcon(stage)}
                      </div>
                      <span className={`text-xs font-medium min-w-0 text-center ${
                        stage.status === 'completed' ? 'text-green-600' :
                        stage.status === 'processing' ? 'text-blue-600' :
                        stage.status === 'failed' ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {stage.name}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {stage.status === 'completed' ? `✓ ${stage.duration}` : 
                         stage.status === 'processing' ? 'In progress...' : 
                         stage.status === 'failed' ? '✗ Failed' : 'Pending'}
                      </span>
                    </div>
                    
                    {index < process.stages.length - 1 && (
                      <div className="flex-1 h-0.5 relative min-w-8">
                        <div className={`h-full ${getConnectionLineColor(stage.status)}`}></div>
                        {stage.status === 'processing' && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {activeProcesses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active processes at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Processes Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Failed Processes - Human Review Required</span>
            <Button variant="outline" size="sm" data-testid="view-all-failed-button">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-900">PO-2024-004</h4>
                  <p className="text-sm text-red-700">Unknown Vendor - Acme Supplies Co</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" data-testid="view-failure-details-button">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" size="sm" data-testid="edit-reprocess-button">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Edit & Reprocess
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h5 className="font-medium text-red-900 mb-2">Failure Reason:</h5>
              <p className="text-sm text-red-700 mb-3">
                Vendor "Acme Supplies Co" not found in master data. Address validation failed - no matching records in the system.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">Failed at: Data Validation stage</span>
                <span className="text-red-600">Notification sent to: admin@democorp.com</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Monitor Modal */}
      <ProcessMonitorModal 
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
      />
    </div>
  );
}
