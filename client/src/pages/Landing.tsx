import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, CheckCircle, Clock, DollarSign, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const { loginMutation } = useAuth();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "chavanv@dotsolved.com",
      password: "testi@123",
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-200 bg-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <Bot className="text-white text-2xl" />
                </div>
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your Sales Order AI account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            data-testid="input-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password"
                            data-testid="input-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogin(false)}
                  data-testid="button-back"
                >
                  ← Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Bot className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900" data-testid="app-title">
                Sales Order AI
              </h1>
              <p className="text-lg text-gray-600">Enterprise Automation Platform</p>
            </div>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Automate your purchase order processing from email to ERP integration with AI-powered 
            document processing, real-time monitoring, and intelligent validation.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-3 text-lg"
            onClick={() => setShowLogin(true)}
            data-testid="login-button"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card data-testid="feature-ai-processing" className="shadow-md border border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Processing</h3>
              <p className="text-gray-600 text-sm">
                Automatically extract and structure purchase order data from emails and documents
              </p>
            </CardContent>
          </Card>

          <Card data-testid="feature-real-time" className="shadow-md border border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
              <p className="text-gray-600 text-sm">
                Track processing status and performance with live dashboards and alerts
              </p>
            </CardContent>
          </Card>

          <Card data-testid="feature-erp-integration" className="shadow-md border border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ERP Integration</h3>
              <p className="text-gray-600 text-sm">
                Seamlessly integrate with NetSuite, SAP, Oracle and other ERP systems
              </p>
            </CardContent>
          </Card>

          <Card data-testid="feature-cost-savings" className="shadow-md border border-gray-200 bg-white">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-yellow-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Savings</h3>
              <p className="text-gray-600 text-sm">
                Reduce manual processing time by 90% with automated workflows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Sales Order AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Multi-Tenant Architecture</h3>
              <p className="text-gray-600">
                Secure, scalable platform with complete data isolation between organizations
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Human-in-the-Loop</h3>
              <p className="text-gray-600">
                Intelligent fallback to manual review for edge cases and validation failures
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Flexible AI Models</h3>
              <p className="text-gray-600">
                Support for OpenAI, Anthropic, and custom hosted models with easy configuration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
