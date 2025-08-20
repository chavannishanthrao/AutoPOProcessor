import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" data-testid="main-layout">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4" data-testid="top-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900" data-testid="page-title">
                Dashboard
              </h2>
              <p className="text-sm text-gray-500">
                Overview of your AI automation platform performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span data-testid="system-status">All Systems Online</span>
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
                <Bell className="h-5 w-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  2
                </Badge>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3" data-testid="user-menu">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="profile-menu-item">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="logout-menu-item"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
