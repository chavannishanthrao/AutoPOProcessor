import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function RecentOrdersList() {
  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['/api/purchase-orders'],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
    };
    
    const labels = {
      completed: 'Processed',
      processing: 'In Progress',
      failed: 'Requires Attention',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status as keyof typeof labels] || status}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardHeader className="p-6 border-b border-gray-100">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Purchase Orders</CardTitle>
            <p className="text-sm text-gray-500">Latest processed orders</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100" data-testid="recent-orders-list">
      <CardHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Purchase Orders</CardTitle>
            <p className="text-sm text-gray-500">Latest processed orders</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            data-testid="view-all-orders-button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="divide-y divide-gray-100">
        {purchaseOrders?.slice(0, 5).map((order: any) => (
          <div 
            key={order.id} 
            className="p-6 hover:bg-gray-50 transition-colors"
            data-testid={`order-item-${order.poNumber}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.status === 'completed' ? 'bg-green-100' :
                  order.status === 'processing' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900" data-testid={`order-po-number-${order.id}`}>
                    {order.poNumber}
                  </p>
                  <p className="text-sm text-gray-500" data-testid={`order-vendor-${order.id}`}>
                    {order.vendorName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900" data-testid={`order-amount-${order.id}`}>
                  ${parseFloat(order.totalAmount || '0').toLocaleString()}
                </p>
                <div className="mt-1">
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="p-6 text-center text-gray-500">
            <p>No purchase orders found</p>
          </div>
        )}
      </div>
    </Card>
  );
}
