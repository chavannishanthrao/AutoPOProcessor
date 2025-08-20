import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";

interface ProcessingChartProps {
  title: string;
  subtitle: string;
  type: "bar" | "doughnut";
  data?: any;
}

export default function ProcessingChart({ 
  title, 
  subtitle, 
  type,
  data 
}: ProcessingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Dynamic import to handle Chart.js on client side
    import('chart.js/auto').then((Chart) => {
      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      // Clear any existing chart
      Chart.Chart.getChart(ctx)?.destroy();

      const chartData = type === 'bar' ? {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Processing Volume',
          data: [65, 75, 50, 85, 45],
          backgroundColor: '#10b981',
          borderRadius: 8
        }]
      } : {
        labels: ['Completed', 'Processing', 'Failed'],
        datasets: [{
          data: [85, 12, 3],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }]
      };

      const chartOptions = type === 'bar' ? {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      } : {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '70%'
      };

      new Chart.Chart(ctx, {
        type,
        data: chartData,
        options: chartOptions
      });
    });
  }, [type]);

  return (
    <Card className="border border-gray-100" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          {type === 'bar' && (
            <Button 
              variant="outline" 
              size="sm"
              data-testid="refresh-chart-button"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <canvas ref={canvasRef} />
        </div>
        
        {type === 'doughnut' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900" data-testid="status-completed">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Processing</span>
              </div>
              <span className="text-sm font-medium text-gray-900" data-testid="status-processing">12%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium text-gray-900" data-testid="status-failed">3%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
