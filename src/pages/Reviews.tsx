import { useState } from "react";
import { Star, Bot, Calendar, MessageCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { seedData } from "@/data/seedData";
import { toast } from "sonner";

export default function Reviews() {
  const [reviews] = useState(seedData.reviews);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyTone, setReplyTone] = useState("professional");

  const sourceColors = {
    "Google": "bg-blue-100 text-blue-800",
    "Booking.com": "bg-blue-100 text-blue-800",
    "TripAdvisor": "bg-green-100 text-green-800"
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getThemeColor = (theme: string) => {
    if (theme.includes("+")) return "bg-green-100 text-green-800";
    if (theme.includes("-")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleGenerateAI = (review: any) => {
    const toneTemplates = {
      professional: `Dear ${review.source === "Google" ? "Valued Guest" : "Guest"},\n\nThank you for taking the time to share your feedback about your recent stay at LUME Resort Thekkady. We appreciate your review and are committed to continuously improving our services.\n\nBest regards,\nLUME Resort Team`,
      warm: `Hello! 😊\n\nThank you so much for your wonderful review! We're thrilled that you enjoyed your stay with us at LUME Resort Thekkady. Your feedback means the world to us.\n\nWe look forward to welcoming you back soon!\n\nWarm regards,\nThe LUME Family`,
      concise: `Thank you for your review. We appreciate your feedback and are committed to providing excellent service at LUME Resort Thekkady.\n\nBest regards,\nLUME Resort Team`
    };
    
    setReplyText(toneTemplates[replyTone as keyof typeof toneTemplates]);
    toast.success("AI reply generated successfully");
  };

  const handleSendReply = () => {
    toast.success("Reply sent successfully");
    setReplyText("");
    setSelectedReview(null);
  };

  const handleScheduleReply = () => {
    toast.success("Reply scheduled successfully");
    setReplyText("");
    setSelectedReview(null);
  };

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const responseRate = (reviews.filter(r => r.respondedAt).length / reviews.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews Hub</h1>
          <p className="text-muted-foreground">Monitor and respond to guest reviews</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-xl font-semibold">{avgRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-xl font-semibold text-green-600">{responseRate.toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-xl font-semibold">{reviews.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending Replies</p>
              <p className="text-xl font-semibold text-danger">
                {reviews.filter(r => !r.respondedAt).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Reviews</h3>
          {reviews.map((review) => (
            <Card key={review.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={() => setSelectedReview(review)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={sourceColors[review.source as keyof typeof sourceColors]}>
                      {review.source}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                
                <p className="text-sm text-foreground mb-3">{review.text}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 flex-wrap">
                    {review.themes?.map((theme) => (
                      <Badge key={theme} variant="outline" className={`text-xs ${getThemeColor(theme)}`}>
                        {theme}
                      </Badge>
                    ))}
                  </div>
                  {review.respondedAt ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Replied
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reply Composer */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reply Composer</h3>
          {selectedReview ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Replying to {selectedReview.source} Review
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedReview.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedReview.text}</p>
                </div>

                <div className="flex gap-2">
                  <Select value={replyTone} onValueChange={setReplyTone}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateAI(selectedReview)}
                    className="bg-accent/10 text-accent border-accent/20"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Generate AI Reply
                  </Button>
                </div>

                <Textarea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-32"
                />

                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={() => setSelectedReview(null)}>
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleScheduleReply}
                      disabled={!replyText.trim()}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a review to compose a reply</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}