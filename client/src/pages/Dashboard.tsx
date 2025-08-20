import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

import MetricCard from "@/components/MetricCard";
import ProcessingChart from "@/components/ProcessingChart";
import RecentOrdersList from "@/components/RecentOrdersList";
import SystemHealthPanel from "@/components/SystemHealthPanel";

import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket(user?.tenantId);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    retry: false,
  });

  useEffect(() => {
    if (lastMessage?.type === 'metrics_update') {
      // Handle real-time metrics updates
      console.log('Received metrics update:', lastMessage.data);
    }
  }, [lastMessage]);

  const handleUnauthorizedError = (error: Error) => {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  };

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="dashboard-page">
      {/* Real-time connection indicator */}
      {isConnected && (
        <div className="mb-4 flex items-center space-x-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow"></div>
          <span>Live updates connected</span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Purchase Orders"
          value={metrics?.totalPOs || 0}
          subtitle={`+${Math.floor((metrics?.totalPOs || 0) * 0.035)} processed today`}
          trend="↗ 16.5%"
          icon={FileText}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <MetricCard
          title="Success Rate"
          value={`${metrics?.successRate || 0}%`}
          subtitle="Above industry average"
          trend="↗ 2.1%"
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        
        <MetricCard
          title="Processing Time"
          value={`${metrics?.avgProcessingTime || 0} min`}
          subtitle="vs 15 min manual processing"
          trend="↓ 15%"
          icon={Clock}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        
        <MetricCard
          title="Cost Savings"
          value={`$${(metrics?.costSavings || 0).toLocaleString()}`}
          subtitle="Monthly automation savings"
          trend="↗ 8.3%"
          icon={DollarSign}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProcessingChart
          title="Weekly Processing Volume"
          subtitle="Purchase order processing trends"
          type="bar"
        />
        
        <ProcessingChart
          title="Status Distribution"
          subtitle="Current processing status"
          type="doughnut"
        />
      </div>

      {/* Recent Orders and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersList />
        <SystemHealthPanel />
      </div>
    </div>
  );
}
