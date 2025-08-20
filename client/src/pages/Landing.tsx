import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle, Clock, DollarSign, FileText } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    // Redirect to Replit Auth
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center">
              <Bot className="text-white text-3xl" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sales Order AI Automation
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Automate your complete purchase order lifecycle from email intake to ERP integration. 
            AI-powered document processing with real-time monitoring and enterprise-grade security.
          </p>
          
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            data-testid="login-button"
          >
            Sign in with Replit
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Enterprise-Grade Purchase Order Processing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Document Processing</h3>
              <p className="text-gray-600">
                Automatically extract and validate purchase order data from emails, PDFs, and documents
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ERP Integration</h3>
              <p className="text-gray-600">
                Seamless integration with NetSuite, SAP, Oracle, and Microsoft Dynamics
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-gray-600">
                Track processing status, agent performance, and system health in real-time
              </p>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cost Savings</h3>
              <p className="text-gray-600">
                Reduce manual processing time by 90% with automated workflows
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Tenant Architecture</h3>
              <p className="text-gray-600">
                Secure, scalable platform with complete data isolation between organizations
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}