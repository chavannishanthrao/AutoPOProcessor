import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Eye,
  Settings,
  FileText,
  Mail,
  Database,
  Users,
  Brain,
  LifeBuoy,
  Bot,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { 
    name: "Real-Time Monitor", 
    href: "/realtime", 
    icon: Eye,
    badge: { count: 2, variant: "default" as const }
  },
  { 
    name: "Agent Observability", 
    href: "/agent", 
    icon: Settings,
    badge: { count: 1, variant: "destructive" as const }
  },
  { name: "Reports & Analytics", href: "/reports", icon: FileText },
];

const adminNavigation = [
  { name: "Email Configuration", href: "/email-config", icon: Mail },
  { name: "ERP Integration", href: "/erp-config", icon: Database },
  { name: "User Management", href: "/user-mgmt", icon: Users },
  { name: "AI Settings", href: "/ai-settings", icon: Brain },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col" data-testid="sidebar">
      {/* Logo and Company Info */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900" data-testid="app-name">
              Sales Order AI
            </h1>
            <p className="text-xs text-gray-500">Enterprise Automation</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 pt-6" data-testid="main-navigation">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white hover:bg-primary-light hover:text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  data-testid={`nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badge.variant}
                      className="text-xs"
                    >
                      {item.badge.count}
                    </Badge>
                  )}
                </a>
              </Link>
            );
          })}

          {/* Administration Section */}
          <div className="pt-4">
            <div 
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
              data-testid="admin-section-header"
            >
              <Settings className="w-5 h-5" />
              <span className="flex-1">Administration</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            
            <div className="pl-6 space-y-1 mt-1">
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      )}
                      data-testid={`nav-subitem-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>

          <Link href="/support">
            <a
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              data-testid="nav-item-support"
            >
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </a>
          </Link>
        </div>
      </nav>

      {/* Company Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">DC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900" data-testid="tenant-name">
              Demo Corporation
            </p>
            <p className="text-xs text-gray-500">Enterprise Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
