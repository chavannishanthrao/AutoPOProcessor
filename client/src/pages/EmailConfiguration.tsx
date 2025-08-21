import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Settings, Globe, Mail, AlertCircle, Check, X, Edit3, Trash2, Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';

// OAuth Configuration Schema
const oauthConfigSchema = z.object({
  provider: z.enum(['gmail', 'microsoft']),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  redirectUri: z.string().url('Must be a valid URL'),
  scopes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type OAuthConfigFormData = z.infer<typeof oauthConfigSchema>;

// ConnectEmailButton Component
function ConnectEmailButton({ provider, oauthConfigs }: { provider: 'gmail' | 'microsoft', oauthConfigs: any[] }) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();
  
  const config = oauthConfigs.find(c => c.provider === provider && c.isActive);
  const hasConfig = !!config;
  
  const handleConnect = async () => {
    if (!hasConfig) {
      toast({
        title: "OAuth Configuration Required",
        description: `Please configure ${provider === 'gmail' ? 'Gmail' : 'Microsoft'} OAuth credentials first in the OAuth Settings tab.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    try {
      const authEndpoint = provider === 'gmail' ? '/api/auth/gmail' : '/api/auth/microsoft';
      const response = await fetch(authEndpoint);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get auth URL');
      }
      
      // Open OAuth flow in popup window
      const popup = window.open(data.authUrl, 'oauth-popup', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
      
      toast({
        title: "OAuth Flow Started",
        description: `Please complete the ${provider === 'gmail' ? 'Gmail' : 'Microsoft'} authentication in the popup window.`,
      });
      
      // Poll for popup closure and check for success parameters
      const pollTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            
            // Check if we have tokens in session by trying to connect
            const connectEndpoint = provider === 'gmail' 
              ? '/api/email-accounts/gmail/connect' 
              : '/api/email-accounts/outlook/connect';
              
            const connectResponse = await fetch(connectEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (connectResponse.ok) {
              const emailAccount = await connectResponse.json();
              toast({
                title: "Email Account Connected!",
                description: `Successfully connected ${emailAccount.email}`,
              });
              
              // Refresh the email accounts list
              queryClient.invalidateQueries({ queryKey: ['/api/email-accounts'] });
            } else {
              const error = await connectResponse.json();
              if (error.message?.includes('No Gmail tokens found') || error.message?.includes('No Microsoft tokens found')) {
                // User probably cancelled or didn't complete the flow
                toast({
                  title: "Connection Cancelled",
                  description: "The OAuth flow was not completed. Please try again.",
                  variant: "destructive",
                });
              } else {
                throw new Error(error.message || 'Failed to connect email account');
              }
            }
            setIsConnecting(false);
          }
        } catch (error: any) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          console.error('OAuth connection error:', error);
          toast({
            title: "Connection Failed",
            description: error.message || 'An error occurred while connecting the email account',
            variant: "destructive",
          });
        }
      }, 1000);
      
      // Safety timeout to prevent infinite polling
      setTimeout(() => {
        if (!popup.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
        }
      }, 300000); // 5 minutes timeout
      
    } catch (error: any) {
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const providerIcon = provider === 'gmail' ? <FaGoogle className="w-4 h-4" /> : <FaMicrosoft className="w-4 h-4" />;
  const providerName = provider === 'gmail' ? 'Gmail' : 'Microsoft';
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {providerIcon}
          </div>
          <div>
            <div className="font-medium">{providerName}</div>
            <div className="text-sm text-muted-foreground">
              {hasConfig ? 'OAuth configured' : 'OAuth configuration required'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasConfig ? (
            <Badge variant="default">Ready</Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )}
        </div>
      </div>
      
      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full"
        variant={hasConfig ? "default" : "outline"}
      >
        {isConnecting ? 'Connecting...' : `Connect ${providerName}`}
        <ExternalLink className="w-4 h-4 ml-2" />
      </Button>
      
      {!hasConfig && (
        <p className="text-xs text-muted-foreground">
          Configure OAuth credentials in the OAuth Settings tab first
        </p>
      )}
    </div>
  );
}

export default function EmailConfiguration() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email accounts
  const { data: emailAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/email-accounts'],
  });

  // Fetch OAuth configurations
  const { data: oauthConfigs = [], isLoading: oauthLoading } = useQuery({
    queryKey: ['/api/oauth-configurations'],
  });

  // OAuth configuration form
  const form = useForm<OAuthConfigFormData>({
    resolver: zodResolver(oauthConfigSchema),
    defaultValues: {
      provider: 'gmail',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scopes: '',
      isActive: true,
    },
  });

  // Create OAuth configuration mutation
  const createOAuthConfig = useMutation({
    mutationFn: async (data: OAuthConfigFormData) => {
      const response = await fetch('/api/oauth-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          scopes: data.scopes ? data.scopes.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create OAuth configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oauth-configurations'] });
      form.reset();
      toast({
        title: "OAuth Configuration Created",
        description: "The OAuth configuration has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete OAuth configuration mutation
  const deleteOAuthConfig = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/oauth-configurations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete OAuth configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/oauth-configurations'] });
      toast({
        title: "OAuth Configuration Deleted",
        description: "The OAuth configuration has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OAuthConfigFormData) => {
    createOAuthConfig.mutate(data);
  };

  const toggleShowSecret = (configId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Configuration</h1>
        <p className="text-muted-foreground">
          Manage email accounts and OAuth settings for automated purchase order processing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Accounts
          </TabsTrigger>
          <TabsTrigger value="oauth" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            OAuth Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* Connect Email Accounts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Connect Email Accounts
              </CardTitle>
              <CardDescription>
                Connect your email accounts to start monitoring purchase order emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConnectEmailButton provider="gmail" oauthConfigs={oauthConfigs} />
                <ConnectEmailButton provider="microsoft" oauthConfigs={oauthConfigs} />
              </div>
            </CardContent>
          </Card>

          {/* Connected Email Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Connected Email Accounts
              </CardTitle>
              <CardDescription>
                Email accounts configured for monitoring purchase order emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg dark:bg-gray-800" />
                  ))}
                </div>
              ) : emailAccounts.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No email accounts connected yet. Use the connection buttons above to connect your accounts.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {emailAccounts.map((account: any) => (
                    <div 
                      key={account.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{account.email}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {account.provider} • Last checked: {account.lastChecked ? new Date(account.lastChecked).toLocaleString() : 'Never'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.isActive ? 'default' : 'secondary'}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oauth" className="space-y-6">
          {/* OAuth Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add OAuth Configuration
              </CardTitle>
              <CardDescription>
                Configure OAuth credentials for email providers. These settings enable secure authentication with Gmail and Microsoft services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gmail">Gmail</SelectItem>
                              <SelectItem value="microsoft">Microsoft/Outlook</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter client secret" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redirectUri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redirect URI</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-domain.com/api/auth/callback" {...field} />
                        </FormControl>
                        <FormDescription>
                          This must match exactly what you configured in your OAuth provider
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scopes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scopes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="https://www.googleapis.com/auth/gmail.readonly, https://www.googleapis.com/auth/userinfo.email"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of OAuth scopes. Leave empty to use defaults.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={createOAuthConfig.isPending}>
                    {createOAuthConfig.isPending ? 'Creating...' : 'Create Configuration'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Existing OAuth Configurations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                OAuth Configurations
              </CardTitle>
              <CardDescription>
                Manage existing OAuth configurations for email providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {oauthLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg dark:bg-gray-800" />
                  ))}
                </div>
              ) : oauthConfigs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No OAuth configurations found. Create one above to get started with email integration.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {oauthConfigs.map((config: any) => (
                    <div 
                      key={config.id} 
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {config.provider === 'gmail' ? 
                              <Mail className="w-5 h-5 text-primary" /> : 
                              <Globe className="w-5 h-5 text-primary" />
                            }
                          </div>
                          <div>
                            <div className="font-medium capitalize">{config.provider} OAuth</div>
                            <div className="text-sm text-muted-foreground">
                              Client ID: {config.clientId?.slice(0, 20)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowSecret(config.id)}
                          >
                            {showSecrets[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOAuthConfig.mutate(config.id)}
                            disabled={deleteOAuthConfig.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {showSecrets[config.id] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-900">
                          <div>
                            <Label className="text-sm font-medium">Client ID</Label>
                            <div className="text-sm font-mono bg-white p-2 rounded border dark:bg-gray-800">
                              {config.clientId}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Client Secret</Label>
                            <div className="text-sm font-mono bg-white p-2 rounded border dark:bg-gray-800">
                              {config.clientSecret || '****'}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium">Redirect URI</Label>
                            <div className="text-sm font-mono bg-white p-2 rounded border dark:bg-gray-800">
                              {config.redirectUri}
                            </div>
                          </div>
                          {config.scopes && config.scopes.length > 0 && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium">Scopes</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {config.scopes.map((scope: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {scope}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Gmail OAuth Setup:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select existing one</li>
                  <li>Enable the Gmail API</li>
                  <li>Create OAuth 2.0 credentials</li>
                  <li>Add your redirect URI to authorized redirect URIs</li>
                  <li>Copy Client ID and Client Secret to the form above</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Microsoft OAuth Setup:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Go to <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Azure Portal</a></li>
                  <li>Navigate to Azure Active Directory &gt; App registrations</li>
                  <li>Create a new app registration</li>
                  <li>Add your redirect URI under Authentication</li>
                  <li>Create a client secret under Certificates & secrets</li>
                  <li>Add required API permissions (Mail.Read, User.Read)</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}