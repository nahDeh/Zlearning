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
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 glass rounded-xl">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-600">
            共 <span className="font-semibold text-cyan-600">{chapters.length}</span> 个章节
          </span>
          <span className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-cyan-500" />
            总时长 <span className="font-semibold text-cyan-600">{Math.floor(totalTime / 60)}</span>小时<span className="font-semibold text-cyan-600">{totalTime % 60}</span>分钟
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddChapter}
          className="border-cyan-300 text-cyan-600 hover:bg-cyan-50 rounded-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          添加章节
        </Button>
      </div>

      <div className="space-y-3">
        {chapters.map((chapter, index) => (
          <Card
            key={index}
            className={cn(
              "glass rounded-xl transition-all duration-200",
              draggedIndex === index && "opacity-50 scale-95",
              dragOverIndex === index && "border-cyan-400 border-2 shadow-lg shadow-cyan-100"
            )}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 pt-1">
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-grab active:cursor-grabbing" />
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-sm font-medium text-white shadow-md shadow-cyan-200/50">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="章节标题"
                        className="rounded-xl border-slate-200 focus:border-cyan-300"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="章节描述"
                        className="rounded-xl border-slate-200 focus:border-cyan-300"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(index)}
                          className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg"
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                          className="rounded-lg border-slate-300"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">{chapter.title}</h3>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(index)}
                            className="text-slate-500 hover:text-cyan-600 hover:bg-cyan-50"
                          >
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteChapter(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {chapter.description}
                      </p>
                    </>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-500" />
                      <Input
                        type="number"
                        min={5}
                        max={180}
                        value={chapter.estimatedMinutes}
                        onChange={(e) =>
                          handleTimeChange(index, parseInt(e.target.value) || 30)
                        }
                        className="w-16 h-8 rounded-lg border-slate-200 focus:border-cyan-300"
                      />
                      <span className="text-sm text-slate-500">分钟</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-cyan-500" />
                      <select
                        value={chapter.difficulty}
                        onChange={(e) =>
                          handleDifficultyChange(index, e.target.value as Difficulty)
                        }
                        className={cn(
                          "h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm focus:border-cyan-300 focus:outline-none",
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
        <Button 
          variant="outline" 
          onClick={onSave} 
          disabled={isSaving}
          className="rounded-full border-slate-300 px-6"
        >
          {isSaving ? "保存中..." : "保存大纲"}
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isConfirming}
          className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-200/50 px-6"
        >
          {isConfirming ? "处理中..." : "确认并生成课程"}
        </Button>
      </div>
    </div>
  );
}
