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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Brain,
  Bot,
  Server,
  TestTube,
  CheckCircle,
  Settings,
  AlertTriangle,
} from "lucide-react";

export default function AISettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ocrThreshold, setOcrThreshold] = useState([85]);
  const [customModelConfig, setCustomModelConfig] = useState({
    endpoint: '',
    modelName: '',
    authType: 'bearer',
    maxTokens: 4096,
  });

  const { data: aiConfigurations, isLoading } = useQuery({
    queryKey: ['/api/ai-configurations'],
    retry: false,
  });

  const addAiConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/ai-configurations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-configurations'] });
      toast({
        title: "Success",
        description: "AI configuration added successfully",
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
        description: "Failed to add AI configuration",
        variant: "destructive",
      });
    },
  });

  const testAiConnectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/ai-configurations/${id}/test`),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Success" : "Test Failed",
        description: data.success ? "AI model connection test successful" : data.error,
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
        description: "Failed to test AI connection",
        variant: "destructive",
      });
    },
  });

  const handleProviderSelect = (provider: string) => {
    let defaultConfig = {
      provider,
      modelName: '',
      isActive: true,
    };

    switch (provider) {
      case 'openai':
        defaultConfig.modelName = 'gpt-4o';
        break;
      case 'anthropic':
        defaultConfig.modelName = 'claude-3-opus-20240229';
        break;
      case 'custom':
        defaultConfig.modelName = 'custom-model';
        break;
    }

    addAiConfigMutation.mutate(defaultConfig);
  };

  const testCustomModel = () => {
    // Test custom model configuration
    toast({
      title: "Testing Connection",
      description: "Testing custom model connection...",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="ai-settings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Model Configuration</h1>
        <p className="text-gray-600">Configure AI processing parameters and model selection</p>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList>
          <TabsTrigger value="models" data-testid="models-tab">LLM Providers</TabsTrigger>
          <TabsTrigger value="processing" data-testid="processing-tab">Processing Settings</TabsTrigger>
          <TabsTrigger value="custom" data-testid="custom-tab">Custom Models</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* LLM Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* OpenAI */}
                <div 
                  className={`ai-provider-card border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    aiConfigurations?.some((config: any) => config.provider === 'openai' && config.isActive)
                      ? 'active border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleProviderSelect('openai')}
                  data-testid="openai-provider"
                >
                  <div className="absolute top-2 right-2">
                    {aiConfigurations?.some((config: any) => config.provider === 'openai' && config.isActive) && (
                      <Badge className="bg-primary text-white">Active</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                      <Brain className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">OpenAI</h4>
                      <p className="text-sm text-gray-500">GPT-4, GPT-3.5</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">GPT-4o</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">
                        {aiConfigurations?.some((config: any) => config.provider === 'openai') ? 'Connected' : 'Not configured'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anthropic */}
                <div 
                  className="ai-provider-card border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => handleProviderSelect('anthropic')}
                  data-testid="anthropic-provider"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bot className="text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Anthropic</h4>
                      <p className="text-sm text-gray-500">Claude 3, Claude 2</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">Claude 3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-gray-400">Not configured</span>
                    </div>
                  </div>
                </div>

                {/* Custom/Self-Hosted */}
                <div 
                  className="ai-provider-card border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => handleProviderSelect('custom')}
                  data-testid="custom-provider"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Server className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Custom/Self-Hosted</h4>
                      <p className="text-sm text-gray-500">Your own model</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Endpoint:</span>
                      <span className="font-medium">Custom API</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-gray-400">Not configured</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Configurations */}
          {aiConfigurations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Configurations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiConfigurations.map((config: any) => (
                  <div 
                    key={config.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`ai-config-${config.provider}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        config.provider === 'openai' ? 'bg-gray-900' :
                        config.provider === 'anthropic' ? 'bg-orange-100' : 'bg-purple-100'
                      }`}>
                        {config.provider === 'openai' && <Brain className="text-white" />}
                        {config.provider === 'anthropic' && <Bot className="text-orange-600" />}
                        {config.provider === 'custom' && <Server className="text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{config.provider}</p>
                        <p className="text-sm text-gray-500">{config.modelName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {config.isActive && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testAiConnectionMutation.mutate(config.id)}
                        disabled={testAiConnectionMutation.isPending}
                        data-testid={`test-ai-${config.id}`}
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          {/* AI Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OCR Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">OCR Settings</h4>
                  <div>
                    <Label htmlFor="ocr-threshold">OCR Accuracy Threshold</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Slider
                        value={ocrThreshold}
                        onValueChange={setOcrThreshold}
                        max={99}
                        min={70}
                        step={1}
                        className="flex-1"
                        data-testid="ocr-threshold-slider"
                      />
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {ocrThreshold[0]}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum confidence level for OCR results</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-retry" defaultChecked data-testid="auto-retry-ocr-switch" />
                    <Label htmlFor="auto-retry" className="text-sm text-gray-700">
                      Auto-retry Failed OCR
                    </Label>
                  </div>
                </div>

                {/* Validation Rules */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Validation Rules</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="strict-vendor" 
                        defaultChecked 
                        data-testid="strict-vendor-matching-switch"
                      />
                      <Label htmlFor="strict-vendor" className="text-sm text-gray-700">
                        Strict Vendor Matching
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="auto-approve-vendors" 
                        data-testid="auto-approve-vendors-switch"
                      />
                      <Label htmlFor="auto-approve-vendors" className="text-sm text-gray-700">
                        Auto-approve Known Vendors
                      </Label>
                    </div>
                    <div>
                      <Label htmlFor="max-amount">Maximum PO Amount (Auto-approve)</Label>
                      <Input
                        id="max-amount"
                        type="number"
                        placeholder="10000"
                        className="mt-1"
                        data-testid="max-auto-approve-amount"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {/* Custom Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Model Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    type="url"
                    value={customModelConfig.endpoint}
                    onChange={(e) => setCustomModelConfig({...customModelConfig, endpoint: e.target.value})}
                    placeholder="https://your-model-api.com/v1"
                    data-testid="custom-endpoint-input"
                  />
                </div>
                <div>
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={customModelConfig.modelName}
                    onChange={(e) => setCustomModelConfig({...customModelConfig, modelName: e.target.value})}
                    placeholder="custom-llm-v1"
                    data-testid="custom-model-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="auth-type">Authentication Type</Label>
                  <Select 
                    value={customModelConfig.authType} 
                    onValueChange={(value) => setCustomModelConfig({...customModelConfig, authType: value})}
                  >
                    <SelectTrigger data-testid="auth-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="none">No Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={customModelConfig.maxTokens}
                    onChange={(e) => setCustomModelConfig({...customModelConfig, maxTokens: parseInt(e.target.value)})}
                    placeholder="4096"
                    data-testid="max-tokens-input"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline"
                  onClick={testCustomModel}
                  data-testid="test-custom-model-button"
                >
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Accuracy</h4>
                  <p className="text-2xl font-bold text-blue-600" data-testid="model-accuracy">96.8%</p>
                  <p className="text-sm text-blue-600">Data extraction</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Throughput</h4>
                  <p className="text-2xl font-bold text-green-600" data-testid="model-throughput">145</p>
                  <p className="text-sm text-green-600">docs/hour</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Avg Latency</h4>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="model-latency">1.2s</p>
                  <p className="text-sm text-yellow-600">per request</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900">Error Rate</h4>
                  <p className="text-2xl font-bold text-red-600" data-testid="model-error-rate">2.1%</p>
                  <p className="text-sm text-red-600">failed requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
