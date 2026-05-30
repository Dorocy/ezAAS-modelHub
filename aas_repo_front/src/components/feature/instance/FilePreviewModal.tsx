"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  opened,
  onClose,
  fileUrl,
  fileType,
}) => {
  const isPdf = fileType.toLowerCase().includes("pdf");

  return (
    <Dialog open={opened} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
        </DialogHeader>
        <div className="h-[70vh]">
          {isPdf ? (
            <iframe src={fileUrl} width="100%" height="100%" title="File Preview" className="rounded" />
          ) : (
            <img
              src={fileUrl}
              alt="File Preview"
              className="max-w-full max-h-full object-contain mx-auto"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
