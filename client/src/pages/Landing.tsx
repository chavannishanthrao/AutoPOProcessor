import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, Clock, DollarSign, FileText } from "lucide-react";

export default function Landing() {
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
            onClick={() => window.location.href = '/api/login'}
            data-testid="login-button"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card data-testid="feature-ai-processing">
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

          <Card data-testid="feature-real-time">
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

          <Card data-testid="feature-erp-integration">
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

          <Card data-testid="feature-cost-savings">
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
