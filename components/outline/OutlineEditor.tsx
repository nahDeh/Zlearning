"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { OutlineChapter, Difficulty } from "@/types/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Plus, Trash2, Clock, BarChart3 } from "lucide-react";

interface OutlineEditorProps {
  chapters: OutlineChapter[];
  onChange: (chapters: OutlineChapter[]) => void;
  onSave: () => void;
  isSaving?: boolean;
  onConfirm: () => void;
  isConfirming?: boolean;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

export function OutlineEditor({
  chapters,
  onChange,
  onSave,
  isSaving,
  onConfirm,
  isConfirming,
}: OutlineEditorProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      const newChapters = [...chapters];
      const [draggedItem] = newChapters.splice(draggedIndex, 1);
      newChapters.splice(dragOverIndex, 0, draggedItem);
      const reorderedChapters = newChapters.map((chapter, idx) => ({
        ...chapter,
        orderIndex: idx,
      }));
      onChange(reorderedChapters);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddChapter = () => {
    const newChapter: OutlineChapter = {
      title: `新章节 ${chapters.length + 1}`,
      description: "请输入章节描述",
      estimatedMinutes: 30,
      difficulty: "medium",
      orderIndex: chapters.length,
    };
    onChange([...chapters, newChapter]);
  };

  const handleDeleteChapter = (index: number) => {
    const newChapters = chapters.filter((_, i) => i !== index);
    const reorderedChapters = newChapters.map((chapter, idx) => ({
      ...chapter,
      orderIndex: idx,
    }));
    onChange(reorderedChapters);
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditTitle(chapters[index].title);
    setEditDescription(chapters[index].description);
  };

  const handleEditSave = (index: number) => {
    const newChapters = [...chapters];
    newChapters[index] = {
      ...newChapters[index],
      title: editTitle,
      description: editDescription,
    };
    onChange(newChapters);
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  const handleDifficultyChange = (index: number, difficulty: Difficulty) => {
    const newChapters = [...chapters];
    newChapters[index] = {
      ...newChapters[index],
      difficulty,
    };
    onChange(newChapters);
  };

  const handleTimeChange = (index: number, minutes: number) => {
    const newChapters = [...chapters];
    newChapters[index] = {
      ...newChapters[index],
      estimatedMinutes: minutes,
    };
    onChange(newChapters);
  };

  const totalTime = chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>共 {chapters.length} 个章节</span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            总时长 {Math.floor(totalTime / 60)}小时{totalTime % 60}分钟
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleAddChapter}>
          <Plus className="h-4 w-4 mr-1" />
          添加章节
        </Button>
      </div>

      <div className="space-y-3">
        {chapters.map((chapter, index) => (
          <Card
            key={index}
            className={cn(
              "transition-all duration-200",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "border-primary border-2"
            )}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 pt-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="章节标题"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="章节描述"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(index)}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{chapter.title}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(index)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteChapter(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {chapter.description}
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={5}
                        max={180}
                        value={chapter.estimatedMinutes}
                        onChange={(e) =>
                          handleTimeChange(index, parseInt(e.target.value) || 30)
                        }
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">分钟</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <select
                        value={chapter.difficulty}
                        onChange={(e) =>
                          handleDifficultyChange(index, e.target.value as Difficulty)
                        }
                        className={cn(
                          "h-8 rounded-md border border-input bg-background px-2 text-sm",
                          difficultyColors[chapter.difficulty]
                        )}
                      >
                        <option value="easy">简单</option>
                        <option value="medium">中等</option>
                        <option value="hard">困难</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存大纲"}
        </Button>
        <Button onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? "处理中..." : "确认并生成课程"}
        </Button>
      </div>
    </div>
  );
}
