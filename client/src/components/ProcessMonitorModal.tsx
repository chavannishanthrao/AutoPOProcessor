import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  X, 
  Mail, 
  Eye, 
  CheckCircle, 
  Database,
  Clock,
  AlertTriangle 
} from "lucide-react";

interface ProcessMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProcessMonitorModal({ isOpen, onClose }: ProcessMonitorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Real-Time Process Monitor
            </DialogTitle>
            <p className="text-sm text-gray-500">Live tracking of PO processing stages</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Last update: 00:18:33</span>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Mail className="text-green-600" />
              </div>
              <h4 className="font-medium text-green-900">Email Agent</h4>
              <p className="text-sm text-green-600">Monitoring 3 inboxes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Eye className="text-blue-600" />
              </div>
              <h4 className="font-medium text-blue-900">OCR Service</h4>
              <p className="text-sm text-blue-600">98.5% accuracy</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="text-yellow-600" />
              </div>
              <h4 className="font-medium text-yellow-900">Validation Engine</h4>
              <p className="text-sm text-yellow-600">2 items in queue</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Database className="text-purple-600" />
              </div>
              <h4 className="font-medium text-purple-900">ERP Connections</h4>
              <p className="text-sm text-purple-600">2/2 systems online</p>
            </div>
          </div>

          {/* Active Processes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Processes (2)</h3>
            
            {/* Process 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">PO-2024-005</h4>
                  <p className="text-sm text-gray-500">Tech Supplies Inc</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">2 minutes ago</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto mt-1 animate-pulse"></div>
                </div>
              </div>
              
              {/* Process Pipeline */}
              <div className="flex items-center space-x-4">
                {/* Email Detection - Completed */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">Email Detection</span>
                  <span className="text-xs text-gray-400">✓ 2.1s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-green-300"></div>
                
                {/* OCR Processing - Completed */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">OCR Processing</span>
                  <span className="text-xs text-gray-400">✓ 1.8s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-blue-300 relative">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                
                {/* Data Validation - In Progress */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <RefreshCw className="text-blue-600 animate-spin" />
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Data Validation</span>
                  <span className="text-xs text-gray-400">Validating vendor information...</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-gray-200"></div>
                
                {/* ERP Formatting - Pending */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <RefreshCw className="text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">ERP Formatting</span>
                  <span className="text-xs text-gray-400">Pending</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-gray-200"></div>
                
                {/* ERP Integration - Pending */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Database className="text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">ERP Integration</span>
                  <span className="text-xs text-gray-400">Pending</span>
                </div>
              </div>
            </div>

            {/* Process 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">PO-2024-006</h4>
                  <p className="text-sm text-gray-500">Office World Ltd</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">5 minutes ago</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-auto mt-1"></div>
                </div>
              </div>
              
              {/* Process Pipeline - All Completed */}
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">Email Detection</span>
                  <span className="text-xs text-gray-400">✓ 1.9s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-green-300"></div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">OCR Processing</span>
                  <span className="text-xs text-gray-400">✓ 2.4s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-green-300"></div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">Data Validation</span>
                  <span className="text-xs text-gray-400">✓ 0.8s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-green-300"></div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">ERP Formatting</span>
                  <span className="text-xs text-gray-400">✓ 0.3s</span>
                </div>
                
                <div className="flex-1 h-0.5 bg-green-300"></div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">ERP Integration</span>
                  <span className="text-xs text-gray-400">✓ Reprocessed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Failed Processes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Failed Processes - Human Review Required</h3>
            
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
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700" size="sm">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
