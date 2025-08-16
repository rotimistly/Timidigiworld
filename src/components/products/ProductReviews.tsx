import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Check if current user has already reviewed
      if (user) {
        const existing = data?.find(review => review.user_id === user.id);
        setUserReview(existing || null);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkCanReview = async () => {
    if (!user) return;

    try {
      // Check if user has purchased and received this product
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('product_id', productId)
        .in('status', ['completed', 'delivered'])
        .limit(1);

      if (error) throw error;
      setCanReview((data?.length || 0) > 0 && !userReview);
    } catch (error: any) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !newRating || newRating < 1 || newRating > 5) {
      toast({
        title: "Invalid rating",
        description: "Please select a rating between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: newRating,
          comment: newComment.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      setNewRating(0);
      setNewComment('');
      fetchReviews();
      setCanReview(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setNewRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews
          </span>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {renderStars(Math.round(averageRating))}
              <span>({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Write Review Section */}
        {canReview && (
          <div className="border-b pb-6">
            <h3 className="font-medium mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                {renderStars(newRating, true)}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmitReview} disabled={isSubmitting || newRating === 0}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}

        {userReview && !canReview && (
          <div className="border-b pb-6">
            <h3 className="font-medium mb-2">Your Review</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(userReview.rating)}
                <span className="text-sm text-muted-foreground">
                  {new Date(userReview.created_at).toLocaleDateString()}
                </span>
              </div>
              {userReview.comment && (
                <p className="text-sm">{userReview.comment}</p>
              )}
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.filter(review => review.id !== userReview?.id).map((review) => (
              <div key={review.id} className="border-b border-border/50 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">
                        Customer
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}