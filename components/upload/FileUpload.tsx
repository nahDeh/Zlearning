"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  File,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export interface UploadedMaterial {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  parseStatus: string;
  chunkCount: number;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    charCount?: number;
    title?: string;
    author?: string;
  };
}

export interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (material: UploadedMaterial) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

const ACCEPTED_TYPES = [".txt", ".md", ".pdf", ".epub"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `文件大小超过限制 (${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`;
      }

      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!acceptedTypes.includes(ext)) {
        return `不支持的文件类型，仅支持 ${acceptedTypes.join(", ")}`;
      }

      return null;
    },
    [acceptedTypes, maxFileSize]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadFile[] = Array.from(fileList).map((file) => {
        const error = validateFile(file);

        return {
          id: crypto.randomUUID(),
          file,
          status: error ? "error" : "pending",
          progress: 0,
          error: error || undefined,
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [validateFile]
  );

  const uploadFile = useCallback(
    async (uploadFileItem: UploadFile) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === uploadFileItem.id
            ? {
                ...file,
                status: "uploading",
                progress: 15,
                error: undefined,
              }
            : file
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

        const result = (await response.json()) as {
          success?: boolean;
          error?: string;
          material?: UploadedMaterial;
        };

        if (!response.ok || !result.success || !result.material) {
          throw new Error(result.error || "上传失败");
        }

        const material = result.material;

        setFiles((prev) =>
          prev.map((file) =>
            file.id === uploadFileItem.id
              ? {
                  ...file,
                  status: "success",
                  progress: 100,
                  materialId: material.id,
                }
              : file
          )
        );

        onUploadComplete?.(material);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "上传失败";

        setFiles((prev) =>
          prev.map((file) =>
            file.id === uploadFileItem.id
              ? {
                  ...file,
                  status: "error",
                  progress: 0,
                  error: errorMessage,
                }
              : file
          )
        );

        onUploadError?.(errorMessage);
      }
    },
    [onUploadComplete, onUploadError, projectId]
  );

  const handleUploadAll = async () => {
    if (isUploadingAll) {
      return;
    }

    const pendingFiles = files.filter((file) => file.status === "pending");
    if (pendingFiles.length === 0) {
      return;
    }

    setIsUploadingAll(true);

    try {
      for (const file of pendingFiles) {
        await uploadFile(file);
      }
    } finally {
      setIsUploadingAll(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
      event.target.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    return <File className="h-5 w-5" />;
  };

  const pendingCount = files.filter((file) => file.status === "pending").length;
  const uploadingCount = files.filter((file) => file.status === "uploading").length;
  const successCount = files.filter((file) => file.status === "success").length;
  const errorCount = files.filter((file) => file.status === "error").length;
  const isBusy = isUploadingAll || uploadingCount > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上传学习资料
        </CardTitle>
        <CardDescription>
          支持 {acceptedTypes.join(", ")} 格式，单个文件最大{" "}
          {(maxFileSize / 1024 / 1024).toFixed(0)}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            拖拽文件到此处，或点击选择文件
          </p>
          <p className="text-xs text-muted-foreground">支持批量上传多个文件</p>
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
                <Button size="sm" onClick={handleUploadAll} disabled={isBusy}>
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    `上传全部 (${pendingCount})`
                  )}
                </Button>
              )}
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    fileItem.status === "error" &&
                      "border-destructive/50 bg-destructive/5",
                    fileItem.status === "success" &&
                      "border-green-500/50 bg-green-500/5"
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
                      getFileIcon()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">
                        {fileItem.file.name}
                      </p>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </span>
                    </div>

                    {fileItem.status === "uploading" && (
                      <Progress value={fileItem.progress} className="mt-2 h-1" />
                    )}

                    {fileItem.error && (
                      <p className="mt-1 text-xs text-destructive">
                        {fileItem.error}
                      </p>
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
