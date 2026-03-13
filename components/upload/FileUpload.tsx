"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  materialId?: string;
}

export interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (material: { id: string; filename: string }) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

const ACCEPTED_TYPES = [".txt", ".md", ".pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function FileUpload({
  projectId,
  onUploadComplete,
  onUploadError,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_TYPES,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `文件大小超过限制 (${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(ext)) {
      return `不支持的文件类型，仅支持 ${acceptedTypes.join(", ")}`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadFile[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        newFiles.push({
          id: generateId(),
          file,
          status: error ? "error" : "pending",
          progress: 0,
          error: error || undefined,
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [maxFileSize, acceptedTypes]
  );

  const uploadFile = async (uploadFileItem: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFileItem.id ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", uploadFileItem.file);
      formData.append("projectId", projectId);

      const response = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "上传失败");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? {
                ...f,
                status: "success",
                progress: 100,
                materialId: result.material.id,
              }
            : f
        )
      );

      onUploadComplete?.({
        id: result.material.id,
        filename: uploadFileItem.file.name,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? { ...f, status: "error", error: errorMessage }
            : f
        )
      );

      onUploadError?.(errorMessage);
    }
  };

  const handleUploadAll = () => {
    files.filter((f) => f.status === "pending").forEach(uploadFile);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return <File className="h-5 w-5" />;
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上传学习资料
        </CardTitle>
        <CardDescription>
          支持 {acceptedTypes.join(", ")} 格式，单个文件最大 {(maxFileSize / 1024 / 1024).toFixed(0)}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            拖拽文件到此处，或点击选择文件
          </p>
          <p className="text-xs text-muted-foreground">
            支持批量上传多个文件
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {successCount} 成功 / {errorCount} 失败 / {pendingCount} 待上传
              </span>
              {pendingCount > 0 && (
                <Button size="sm" onClick={handleUploadAll} disabled={uploadingCount > 0}>
                  {uploadingCount > 0 ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    `上传全部 (${pendingCount})`
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    fileItem.status === "error" && "border-destructive/50 bg-destructive/5",
                    fileItem.status === "success" && "border-green-500/50 bg-green-500/5"
                  )}
                >
                  <div className="flex-shrink-0">
                    {fileItem.status === "uploading" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : fileItem.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : fileItem.status === "error" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      getFileIcon(fileItem.file.name)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatFileSize(fileItem.file.size)}
                      </span>
                    </div>

                    {fileItem.status === "uploading" && (
                      <Progress value={fileItem.progress} className="h-1 mt-2" />
                    )}

                    {fileItem.error && (
                      <p className="text-xs text-destructive mt-1">{fileItem.error}</p>
                    )}
                  </div>

                  {fileItem.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeFile(fileItem.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
