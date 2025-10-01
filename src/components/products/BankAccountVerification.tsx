import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BankAccountVerificationProps {
  profile: any;
  onVerificationUpdate: () => void;
}

export const BankAccountVerification = ({ profile, onVerificationUpdate }: BankAccountVerificationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bank_name: profile?.bank_name || '',
    account_number: profile?.account_number || '',
    account_name: profile?.account_name || '',
    bank_code: profile?.bank_code || ''
  });

  const nigeriaBanks = [
    { name: "Access Bank", code: "044" },
    { name: "Fidelity Bank", code: "070" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "Guaranty Trust Bank", code: "058" },
    { name: "Keystone Bank", code: "082" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Polaris Bank", code: "076" },
    { name: "Sterling Bank", code: "232" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "United Bank For Africa", code: "033" },
    { name: "Unity Bank", code: "215" },
    { name: "Wema Bank", code: "035" },
    { name: "Zenith Bank", code: "057" },
  ];

  const handleBankChange = (bankName: string) => {
    const selectedBank = nigeriaBanks.find(bank => bank.name === bankName);
    setBankDetails(prev => ({
      ...prev,
      bank_name: bankName,
      bank_code: selectedBank?.code || ''
    }));
  };

  const verifyAccount = async () => {
    if (!bankDetails.account_number || !bankDetails.bank_code) {
      toast({
        title: "Missing Information",
        description: "Please select a bank and enter account number",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);
    try {
      // Verify account name with Paystack and create subaccount
      const { data, error } = await supabase.functions.invoke('create-paystack-subaccount', {
        body: {
          userId: user?.id,
          bankDetails: {
            bank_code: bankDetails.bank_code,
            account_number: bankDetails.account_number,
            phone: profile?.phone || profile?.contact_phone
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Bank Account Verified",
          description: data.message,
        });
        
        // Update local state with verified account name
        setBankDetails(prev => ({
          ...prev,
          account_name: data.account_name
        }));
        
        // Refresh profile data
        onVerificationUpdate();
      }
    } catch (error: any) {
      console.error('Account verification error:', error);
      toast({
        title: "Verification Failed", 
        description: error.message || "Could not verify account details",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const saveBankDetails = async () => {
    // This function is no longer needed as verification now saves everything
    // Keep for backwards compatibility but show appropriate message
    toast({
      title: "Already Saved",
      description: "Your bank details were saved during verification.",
    });
  };

  const deleteBankAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: null,
          account_number: null,
          account_name: null,
          bank_code: null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setBankDetails({
        bank_name: '',
        account_number: '',
        account_name: '',
        bank_code: ''
      });

      toast({
        title: "Bank Account Deleted",
        description: "Your bank account has been removed. Add a new one to receive payments.",
      });
      
      onVerificationUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const isAccountVerified = profile?.bank_name && profile?.account_number && profile?.account_name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bank Account Verification</span>
          {isAccountVerified ? (
            <Badge className="bg-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              Not Verified
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isAccountVerified && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="space-y-2">
              <p><strong>Bank:</strong> {profile.bank_name}</p>
              <p><strong>Account Number:</strong> {profile.account_number}</p>
              <p><strong>Account Name:</strong> {profile.account_name}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteBankAccount}
              disabled={deleting}
              className="mt-3"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        )}

        {!isAccountVerified && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Add your bank account to receive payments from sales (75% commission)
              </p>
            </div>

            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Select value={bankDetails.bank_name} onValueChange={handleBankChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {nigeriaBanks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.name}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="Enter your account number"
                maxLength={10}
              />
            </div>

            {bankDetails.account_name && (
              <div>
                <Label>Account Name</Label>
                <Input
                  value={bankDetails.account_name}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={verifyAccount}
                disabled={!bankDetails.account_number || !bankDetails.bank_code || verifying}
              >
                {verifying ? 'Verifying & Saving...' : 'Verify & Save Account'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};