import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
  bookingId: string;
  guestName: string;
  children: React.ReactNode;
}

export function DocumentUploadDialog({ bookingId, guestName, children }: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [visaDocument, setVisaDocument] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIdDocument(file);
    }
  };

  const handleVisaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVisaDocument(file);
    }
  };

  const handleSubmit = async () => {
    if (!idDocument) {
      toast.error("Please upload an ID document");
      return;
    }

    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      toast.success(`Documents uploaded successfully for ${guestName}`);
      setUploading(false);
      setOpen(false);
      // Reset form
      setIdDocument(null);
      setVisaDocument(null);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents - {guestName}</DialogTitle>
          <p className="text-sm text-muted-foreground">Booking ID: {bookingId}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* ID Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="id-document" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ID Document *
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="id-document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleIdUpload}
                className="flex-1"
              />
              {idDocument && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            {idDocument && (
              <p className="text-xs text-muted-foreground">
                Selected: {idDocument.name}
              </p>
            )}
          </div>

          {/* Visa Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="visa-document" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Visa Document (if required)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="visa-document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleVisaUpload}
                className="flex-1"
              />
              {visaDocument && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            {visaDocument && (
              <p className="text-xs text-muted-foreground">
                Selected: {visaDocument.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={uploading || !idDocument}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}