import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ResumeFile } from '@/types/resume';

type UploadBoxProps = {
  isAnalyzing: boolean;
  onFileSelected: (file: File | null) => void;
};

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function UploadBox({ isAnalyzing, onFileSelected }: UploadBoxProps) {
  const [selectedFile, setSelectedFile] = useState<ResumeFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File | undefined) => {
    if (!file || !isPdfFile(file)) {
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    onFileSelected(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <Card className="border-dashed bg-card/80">
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
        <CardDescription>Drop a PDF resume here or choose a file to preview the analyzer workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 sm:px-10',
            isDragging ? 'border-foreground bg-muted/50 scale-[1.01]' : 'border-border bg-background/50 hover:border-foreground/40',
            isAnalyzing ? 'pointer-events-none opacity-80' : ''
          )}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="max-w-md space-y-2">
            <h3 className="text-lg font-semibold text-foreground transition-all duration-300">
              {selectedFile ? 'Resume ready for analysis' : 'Drag and drop your resume'}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground transition-all duration-300">
              {isAnalyzing
                ? 'Running a mock ATS pass. Results will appear shortly.'
                : selectedFile
                  ? `${selectedFile.name} is selected and ready for mock ATS review.`
                  : 'Select a PDF file to simulate the resume analysis flow.'}
            </p>
          </div>

          <input
            ref={inputRef}
            accept="application/pdf,.pdf"
            className="hidden"
            id="resume-upload"
            onChange={handleInputChange}
            type="file"
          />

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button disabled={isAnalyzing} onClick={openFilePicker} type="button" variant="default">
              <FileText className="h-4 w-4" />
              {isAnalyzing ? 'Analyzing...' : 'Select PDF'}
            </Button>
            <p className="text-xs text-muted-foreground">Accepted formats: PDF only</p>
          </div>

          <div className="mt-8 w-full max-w-md rounded-2xl border border-border bg-background px-4 py-4 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className={cn('mt-0.5 h-5 w-5', selectedFile ? 'text-emerald-500' : 'text-muted-foreground')} />
              <div className="min-w-0">
                {selectedFile ? (
                  <>
                    <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)} · {selectedFile.type || 'application/pdf'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">No file selected</p>
                    <p className="text-xs text-muted-foreground">Your uploaded resume will appear here once you choose a PDF.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
