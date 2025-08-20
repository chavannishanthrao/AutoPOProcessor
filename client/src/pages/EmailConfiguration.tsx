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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import {
  Mail,
  Plus,
  Trash2,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Server,
} from "lucide-react";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";

export default function EmailConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showImapDialog, setShowImapDialog] = useState(false);
  const [imapConfig, setImapConfig] = useState({
    email: '',
    host: '',
    port: 993,
    user: '',
    password: '',
    tls: true,
  });

  const { data: emailAccounts, isLoading } = useQuery({
    queryKey: ['/api/email-accounts'],
    retry: false,
  });

  const deleteEmailMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/email-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      toast({
        title: "Success",
        description: "Email account deleted successfully",
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
        description: "Failed to delete email account",
        variant: "destructive",
      });
    },
  });

  const imapSetupMutation = useMutation({
    mutationFn: (config: typeof imapConfig) => apiRequest('POST', '/api/email-accounts/imap', config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
      setShowImapDialog(false);
      setImapConfig({
        email: '',
        host: '',
        port: 993,
        user: '',
        password: '',
        tls: true,
      });
      toast({
        title: "Success",
        description: "IMAP account configured successfully",
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
        description: "Failed to configure IMAP account",
        variant: "destructive",
      });
    },
  });

  const handleGmailConnect = () => {
    // OAuth flow for Gmail
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/api/email-accounts/gmail/callback');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly');
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
    
    window.open(oauthUrl, 'gmail-auth', 'width=500,height=600');
  };

  const handleOutlookConnect = () => {
    // OAuth flow for Outlook
    const clientId = process.env.VITE_MICROSOFT_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/api/email-accounts/outlook/callback');
    const scope = encodeURIComponent('https://graph.microsoft.com/mail.read');
    
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query&prompt=consent`;
    
    window.open(oauthUrl, 'outlook-auth', 'width=500,height=600');
  };

  const handleImapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    imapSetupMutation.mutate(imapConfig);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="email-configuration-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Configuration</h1>
          <p className="text-gray-600">Configure email accounts for PO monitoring</p>
        </div>
        <Button data-testid="add-email-account-button">
          <Plus className="mr-2 h-4 w-4" />
          Add Email Account
        </Button>
      </div>

      {/* Connected Email Accounts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connected Email Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailAccounts?.map((account: any) => (
            <div 
              key={account.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              data-testid={`email-account-${account.email}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  account.provider === 'gmail' ? 'bg-red-100' :
                  account.provider === 'outlook' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {account.provider === 'gmail' && <FaGoogle className="text-red-600" />}
                  {account.provider === 'outlook' && <FaMicrosoft className="text-blue-600" />}
                  {account.provider === 'imap' && <Server className="text-green-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{account.email}</p>
                  <p className="text-sm text-gray-500">Provider: {account.provider}</p>
                  <Badge className={account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${account.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`test-connection-${account.id}`}
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Test
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid={`configure-email-${account.id}`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteEmailMutation.mutate(account.id)}
                  disabled={deleteEmailMutation.isPending}
                  data-testid={`delete-email-${account.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No email accounts configured</p>
              <p className="text-sm">Add your first email account to start monitoring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Email Account */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Email Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gmail OAuth */}
            <button 
              onClick={handleGmailConnect}
              className="email-provider-btn p-6 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group"
              data-testid="connect-gmail-button"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-red-200">
                  <FaGoogle className="text-red-600 text-xl" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Connect Gmail</h4>
                <p className="text-sm text-gray-500">One-click OAuth setup</p>
              </div>
            </button>

            {/* Outlook OAuth */}
            <button 
              onClick={handleOutlookConnect}
              className="email-provider-btn p-6 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              data-testid="connect-outlook-button"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                  <FaMicrosoft className="text-blue-600 text-xl" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Connect Outlook</h4>
                <p className="text-sm text-gray-500">Microsoft 365 integration</p>
              </div>
            </button>

            {/* IMAP Configuration */}
            <Dialog open={showImapDialog} onOpenChange={setShowImapDialog}>
              <DialogTrigger asChild>
                <button 
                  className="email-provider-btn p-6 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                  data-testid="configure-imap-button"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200">
                      <Server className="text-green-600 text-xl" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">IMAP Setup</h4>
                    <p className="text-sm text-gray-500">Custom email server</p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>IMAP Configuration</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleImapSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={imapConfig.email}
                      onChange={(e) => setImapConfig({...imapConfig, email: e.target.value})}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="host">IMAP Host</Label>
                    <Input
                      id="host"
                      value={imapConfig.host}
                      onChange={(e) => setImapConfig({...imapConfig, host: e.target.value})}
                      placeholder="imap.example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={imapConfig.port}
                        onChange={(e) => setImapConfig({...imapConfig, port: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tls"
                        checked={imapConfig.tls}
                        onCheckedChange={(checked) => setImapConfig({...imapConfig, tls: checked})}
                      />
                      <Label htmlFor="tls">Use TLS</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="user">Username</Label>
                    <Input
                      id="user"
                      value={imapConfig.user}
                      onChange={(e) => setImapConfig({...imapConfig, user: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={imapConfig.password}
                      onChange={(e) => setImapConfig({...imapConfig, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={imapSetupMutation.isPending}
                    data-testid="setup-imap-submit"
                  >
                    {imapSetupMutation.isPending ? 'Setting up...' : 'Setup IMAP'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Email Monitoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="check-interval">Check Interval</Label>
              <Select defaultValue="5">
                <SelectTrigger data-testid="check-interval-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notification-email">Failure Notification Email</Label>
              <Input
                id="notification-email"
                type="email"
                placeholder="admin@company.com"
                data-testid="notification-email-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
