import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  FileText,
  Eye,
  Calendar,
  DollarSign,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface ExtractedPOData {
  id: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  poNumber: string | null;
  supplier: string | null;
  buyer: string | null;
  date: string | null;
  amount: string | null;
  currency: string;
  lineItems: any[] | null;
  attachmentName: string;
  extractedText: string;
  llmResponse: any;
  processingStatus: string;
  errorMessage: string | null;
  createdAt: string;
}

export default function POResults() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: extractedData, isLoading, error } = useQuery<ExtractedPOData[]>({
    queryKey: ['/api/email-config/results'],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (error && !isUnauthorizedError(error)) {
    toast({
      title: "Error",
      description: "Failed to load extracted PO data",
      variant: "destructive",
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | null, currency: string) => {
    if (!amount) return 'N/A';
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Purchase Order Results
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading extracted PO data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Purchase Order Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Extracted purchase order data from email attachments
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extractedData?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {extractedData?.filter(item => item.processingStatus === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Processing</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {extractedData?.filter(item => item.processingStatus === 'failed').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData?.reduce((total, item) => {
                const amount = parseFloat(item.amount || '0');
                return total + (isNaN(amount) ? 0 : amount);
              }, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Purchase Order Data</CardTitle>
        </CardHeader>
        <CardContent>
          {!extractedData || extractedData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No purchase order data found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Connect your email accounts and wait for emails with PO attachments to be processed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attachment</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getStatusBadge(item.processingStatus)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{item.emailSubject}</div>
                        <div className="text-xs text-gray-500">From: {item.emailFrom}</div>
                        <div className="text-xs text-gray-400">{formatDate(item.emailDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm">{item.attachmentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.poNumber ? "default" : "secondary"}>
                        {item.poNumber || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{item.supplier || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        {formatCurrency(item.amount, item.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(item.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid={`view-details-${item.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Purchase Order Details</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-6">
                              {/* Email Info */}
                              <div>
                                <h3 className="font-semibold mb-2">Email Information</h3>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                  <div><strong>Subject:</strong> {item.emailSubject}</div>
                                  <div><strong>From:</strong> {item.emailFrom}</div>
                                  <div><strong>Date:</strong> {formatDate(item.emailDate)}</div>
                                  <div><strong>Attachment:</strong> {item.attachmentName}</div>
                                </div>
                              </div>

                              {/* Extracted Data */}
                              <div>
                                <h3 className="font-semibold mb-2">Extracted Purchase Order Data</h3>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                  <div><strong>PO Number:</strong> {item.poNumber || 'N/A'}</div>
                                  <div><strong>Supplier:</strong> {item.supplier || 'N/A'}</div>
                                  <div><strong>Buyer:</strong> {item.buyer || 'N/A'}</div>
                                  <div><strong>Amount:</strong> {formatCurrency(item.amount, item.currency)}</div>
                                  <div><strong>Date:</strong> {formatDate(item.date)}</div>
                                  {item.lineItems && item.lineItems.length > 0 && (
                                    <div>
                                      <strong>Line Items:</strong>
                                      <div className="mt-2 space-y-1">
                                        {item.lineItems.map((lineItem, index) => (
                                          <div key={index} className="bg-white dark:bg-gray-700 p-2 rounded text-sm">
                                            {lineItem.description} - Qty: {lineItem.quantity}, Unit Price: ${lineItem.unitPrice}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Processing Info */}
                              <div>
                                <h3 className="font-semibold mb-2">Processing Information</h3>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                  <div><strong>Status:</strong> {getStatusBadge(item.processingStatus)}</div>
                                  <div><strong>Processed:</strong> {formatDate(item.createdAt)}</div>
                                  {item.errorMessage && (
                                    <div><strong>Error:</strong> <span className="text-red-600">{item.errorMessage}</span></div>
                                  )}
                                </div>
                              </div>

                              {/* Raw Text */}
                              {item.extractedText && (
                                <div>
                                  <h3 className="font-semibold mb-2">Extracted Text (OCR)</h3>
                                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <pre className="text-sm whitespace-pre-wrap">{item.extractedText}</pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}