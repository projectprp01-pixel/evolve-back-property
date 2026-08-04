import { useState } from "react";
import { CreditCard, TrendingUp, AlertCircle, ExternalLink, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { seedData } from "@/data/seedData";
import { toast } from "sonner";

export default function Payments() {
  const [transactions] = useState(seedData.payments.transactions);
  const [settlements] = useState(seedData.payments.settlements);
  const [refunds] = useState(seedData.payments.refunds);
  const [gatewayHealth] = useState(seedData.payments.gatewayHealth);

  const statusColors = {
    "paid": "bg-green-100 text-green-800",
    "failed": "bg-red-100 text-red-800",
    "pending": "bg-yellow-100 text-yellow-800"
  };

  const methodColors = {
    "UPI": "bg-blue-100 text-blue-800",
    "Card": "bg-purple-100 text-purple-800",
    "Cash": "bg-green-100 text-green-800",
    "Wallet": "bg-orange-100 text-orange-800"
  };

  const handleExportCSV = () => {
    toast.success("CSV export initiated");
  };

  const handleResendReceipt = (txnId: string) => {
    toast.success(`Receipt resent for transaction ${txnId}`);
  };

  const handleRefund = (txnId: string) => {
    toast.success(`Refund initiated for transaction ${txnId}`);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments & Reconciliation</h1>
          <p className="text-muted-foreground">Monitor transactions, settlements, and gateway health</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-xl font-semibold text-green-600">{gatewayHealth.successPct}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Settlement Delay</p>
              <p className="text-xl font-semibold">{gatewayHealth.settlementDelayDays} days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Chargeback Rate</p>
              <p className="text-xl font-semibold">{gatewayHealth.chargebackRatePct}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-xl font-semibold">
                {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="health">Gateway Health</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.id}</TableCell>
                      <TableCell className="capitalize">{txn.orderType}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(txn.amount)}</TableCell>
                      <TableCell>
                        <Badge className={methodColors[txn.method as keyof typeof methodColors]}>
                          {txn.method}
                        </Badge>
                      </TableCell>
                      <TableCell>{txn.gateway}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[txn.status as keyof typeof statusColors]}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendReceipt(txn.id)}
                          >
                            Receipt
                          </Button>
                          {txn.status === "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefund(txn.id)}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settlement History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.payoutId}>
                      <TableCell className="font-medium">{settlement.payoutId}</TableCell>
                      <TableCell>{settlement.gateway}</TableCell>
                      <TableCell>{settlement.date}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(settlement.amount)}</TableCell>
                      <TableCell>{settlement.txns} transactions</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refunds & Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Original Transaction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.refundId}>
                      <TableCell className="font-medium">{refund.refundId}</TableCell>
                      <TableCell>{refund.txnId}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(refund.amount)}</TableCell>
                      <TableCell>{refund.reason}</TableCell>
                      <TableCell>{refund.date}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Processed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gateway Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Razorpay</p>
                    <p className="text-sm text-muted-foreground">Primary Gateway</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">97.2%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-sm text-muted-foreground">International Cards</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">94.8%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failed Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">UPI_TIMEOUT</p>
                    <p className="text-sm text-muted-foreground">UPI Gateway Timeout</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">9</p>
                    <p className="text-xs text-muted-foreground">Failures</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">DO_NOT_HONOR</p>
                    <p className="text-sm text-muted-foreground">Bank Declined</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">5</p>
                    <p className="text-xs text-muted-foreground">Failures</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">INSUFFICIENT_FUNDS</p>
                    <p className="text-sm text-muted-foreground">Low Balance</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">4</p>
                    <p className="text-xs text-muted-foreground">Failures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}