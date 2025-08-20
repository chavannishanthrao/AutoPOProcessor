import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  Database,
  Plus,
  TestTube,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
} from "lucide-react";

export default function ERPIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newErpSystem, setNewErpSystem] = useState({
    name: '',
    type: '',
    endpoint: '',
    credentials: {
      token: '',
      accountId: '',
      basicAuth: '',
      username: '',
      password: '',
    },
  });

  const { data: erpSystems, isLoading } = useQuery({
    queryKey: ['/api/erp-systems'],
    retry: false,
  });

  const addErpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/erp-systems', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp-systems'] });
      setShowAddDialog(false);
      setNewErpSystem({
        name: '',
        type: '',
        endpoint: '',
        credentials: {
          token: '',
          accountId: '',
          basicAuth: '',
          username: '',
          password: '',
        },
      });
      toast({
        title: "Success",
        description: "ERP system added successfully",
      });
    },
    onError: (error: Error) => {
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
      toast({
        title: "Error",
        description: "Failed to add ERP system",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/erp-systems/${id}/test`),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Success" : "Test Failed",
        description: data.success ? "Connection test successful" : data.error,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
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
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addErpMutation.mutate(newErpSystem);
  };

  const getStatusBadge = (isActive: boolean, lastSync?: string) => {
    if (isActive && lastSync) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    } else if (isActive) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Configured
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const getSystemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'netsuite':
        return <Database className="text-blue-600" />;
      case 'sap':
        return <Server className="text-green-600" />;
      case 'oracle':
        return <Database className="text-red-600" />;
      default:
        return <Database className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="erp-integration-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Integration</h1>
          <p className="text-gray-600">Manage ERP system connections and settings</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-erp-system-button">
              <Plus className="mr-2 h-4 w-4" />
              Add ERP System
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New ERP System</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">System Name</Label>
                  <Input
                    id="name"
                    value={newErpSystem.name}
                    onChange={(e) => setNewErpSystem({...newErpSystem, name: e.target.value})}
                    placeholder="NetSuite Production"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">System Type</Label>
                  <Select value={newErpSystem.type} onValueChange={(value) => setNewErpSystem({...newErpSystem, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ERP type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="netsuite">NetSuite</SelectItem>
                      <SelectItem value="sap">SAP</SelectItem>
                      <SelectItem value="oracle">Oracle Fusion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  value={newErpSystem.endpoint}
                  onChange={(e) => setNewErpSystem({...newErpSystem, endpoint: e.target.value})}
                  placeholder="https://api.netsuite.com/services/rest"
                  required
                />
              </div>

              {newErpSystem.type === 'netsuite' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="token">Access Token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={newErpSystem.credentials.token}
                      onChange={(e) => setNewErpSystem({
                        ...newErpSystem, 
                        credentials: {...newErpSystem.credentials, token: e.target.value}
                      })}
                      placeholder="Access token"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountId">Account ID</Label>
                    <Input
                      id="accountId"
                      value={newErpSystem.credentials.accountId}
                      onChange={(e) => setNewErpSystem({
                        ...newErpSystem, 
                        credentials: {...newErpSystem.credentials, accountId: e.target.value}
                      })}
                      placeholder="Account ID"
                    />
                  </div>
                </div>
              )}

              {newErpSystem.type === 'sap' && (
                <div>
                  <Label htmlFor="basicAuth">Basic Auth Token</Label>
                  <Input
                    id="basicAuth"
                    type="password"
                    value={newErpSystem.credentials.basicAuth}
                    onChange={(e) => setNewErpSystem({
                      ...newErpSystem, 
                      credentials: {...newErpSystem.credentials, basicAuth: e.target.value}
                    })}
                    placeholder="Basic authentication token"
                  />
                </div>
              )}

              {newErpSystem.type === 'oracle' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newErpSystem.credentials.username}
                      onChange={(e) => setNewErpSystem({
                        ...newErpSystem, 
                        credentials: {...newErpSystem.credentials, username: e.target.value}
                      })}
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newErpSystem.credentials.password}
                      onChange={(e) => setNewErpSystem({
                        ...newErpSystem, 
                        credentials: {...newErpSystem.credentials, password: e.target.value}
                      })}
                      placeholder="Password"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addErpMutation.isPending}
                  data-testid="add-erp-submit"
                >
                  {addErpMutation.isPending ? 'Adding...' : 'Add System'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected ERP Systems */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connected ERP Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {erpSystems?.map((system: any) => (
            <div 
              key={system.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              data-testid={`erp-system-${system.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  system.type === 'netsuite' ? 'bg-blue-100' :
                  system.type === 'sap' ? 'bg-green-100' :
                  system.type === 'oracle' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {getSystemIcon(system.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{system.name}</p>
                  <p className="text-sm text-gray-500">Type: {system.type}</p>
                  {system.lastSync && (
                    <p className="text-xs text-gray-400">
                      Last sync: {new Date(system.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(system.isActive, system.lastSync)}
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(system.id)}
                    disabled={testConnectionMutation.isPending}
                    data-testid={`test-connection-${system.id}`}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Connection
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid={`configure-erp-${system.id}`}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid={`delete-erp-${system.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No ERP systems configured</p>
              <p className="text-sm">Add your first ERP system to enable automated PO processing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Database className="text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">NetSuite</h4>
              <p className="text-sm text-gray-600 mb-2">REST API Integration</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Requires access token</li>
                <li>• Account ID needed</li>
                <li>• Auto vendor mapping</li>
              </ul>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Server className="text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">SAP</h4>
              <p className="text-sm text-gray-600 mb-2">OData API Integration</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Basic authentication</li>
                <li>• CSRF token handling</li>
                <li>• Material code mapping</li>
              </ul>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Database className="text-red-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Oracle Fusion</h4>
              <p className="text-sm text-gray-600 mb-2">REST API Integration</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• OAuth 2.0 support</li>
                <li>• Supplier validation</li>
                <li>• Currency handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
