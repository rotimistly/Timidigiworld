import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function ClearTrackingHistory({ onCleared }: { onCleared?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const clearPendingHistory = async () => {
    if (!user) return;

    setIsClearing(true);
    try {
      const { error } = await supabase.rpc('clear_pending_tracking_history', {
        user_uuid: user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "All pending tracking history has been cleared",
      });
      onCleared?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear tracking history",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Order Tracking Management
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Clear all pending order tracking history. This will remove tracking records for orders that haven't been completed or delivered yet.
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isClearing}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Pending History
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Pending Tracking History</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all tracking history for pending orders. 
                  Completed and delivered orders will not be affected. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={clearPendingHistory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}