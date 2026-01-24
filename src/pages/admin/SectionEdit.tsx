import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Save,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  FileText,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const sectionIcons = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
  general: FileText,
};

const sectionColors = {
  listening: 'bg-listening text-white',
  reading: 'bg-reading text-white',
  writing: 'bg-writing text-white',
  speaking: 'bg-speaking text-white',
  general: 'bg-primary text-primary-foreground',
};

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'fill_blank', label: 'Điền vào chỗ trống' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
  { value: 'true_false_not_given', label: 'TRUE/FALSE/NOT GIVEN' },
  { value: 'matching', label: 'Nối đáp án' },
  { value: 'essay', label: 'Bài luận' },
];

interface QuestionGroup {
  id: string;
  title: string | null;
  passage: string | null;
  instructions: string | null;
  order_index: number;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  order_index: number;
}

export default function AdminSectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<QuestionGroup | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [groupForm, setGroupForm] = useState({ title: '', passage: '', instructions: '' });
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });

  const { data: section, isLoading: sectionLoading } = useQuery({
    queryKey: ['section-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_sections')
        .select('*, exams(id, title)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: questionGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['question-groups', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_groups')
        .select('*, questions(*)')
        .eq('section_id', id!)
        .order('order_index');
      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        questions: (g.questions || []).sort((a: any, b: any) => a.order_index - b.order_index),
      })) as QuestionGroup[];
    },
    enabled: !!id,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { title: string; passage: string; instructions: string }) => {
      const orderIndex = (questionGroups?.length || 0);
      const { error } = await supabase.from('question_groups').insert({
        section_id: id,
        title: data.title || null,
        passage: data.passage || null,
        instructions: data.instructions || null,
        order_index: orderIndex,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      setGroupDialogOpen(false);
      setGroupForm({ title: '', passage: '', instructions: '' });
      toast({ title: 'Thành công', description: 'Đã tạo nhóm câu hỏi mới' });
    },
    onError: (error: any) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; passage: string; instructions: string }) => {
      const { error } = await supabase
        .from('question_groups')
        .update({
          title: data.title || null,
          passage: data.passage || null,
          instructions: data.instructions || null,
        } as any)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      toast({ title: 'Thành công', description: 'Đã cập nhật nhóm câu hỏi' });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('question_groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      toast({ title: 'Đã xóa', description: 'Nhóm câu hỏi đã được xóa' });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm & { groupId: string }) => {
      const group = questionGroups?.find((g) => g.id === data.groupId);
      const orderIndex = (group?.questions?.length || 0);
      
      const { error } = await supabase.from('questions').insert({
        group_id: data.groupId,
        question_text: data.question_text,
        question_type: data.question_type,
        options: data.question_type === 'multiple_choice' ? data.options.filter(Boolean) : null,
        correct_answer: data.correct_answer || null,
        points: data.points,
        order_index: orderIndex,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      setQuestionDialogOpen(false);
      setSelectedGroupId(null);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
      });
      toast({ title: 'Thành công', description: 'Đã tạo câu hỏi mới' });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: typeof questionForm & { id: string }) => {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: data.question_text,
          question_type: data.question_type,
          options: data.question_type === 'multiple_choice' ? data.options.filter(Boolean) : null,
          correct_answer: data.correct_answer || null,
          points: data.points,
        } as any)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      toast({ title: 'Thành công', description: 'Đã cập nhật câu hỏi' });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-groups', id] });
      toast({ title: 'Đã xóa', description: 'Câu hỏi đã được xóa' });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (data: { audio_url?: string; instructions?: string }) => {
      const { error } = await supabase
        .from('exam_sections')
        .update(data as any)
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-detail', id] });
      toast({ title: 'Đã lưu', description: 'Thông tin section đã được cập nhật' });
    },
  });

  const handleOpenGroupDialog = (group?: QuestionGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({
        title: group.title || '',
        passage: group.passage || '',
        instructions: group.instructions || '',
      });
    } else {
      setEditingGroup(null);
      setGroupForm({ title: '', passage: '', instructions: '' });
    }
    setGroupDialogOpen(true);
  };

  const handleOpenQuestionDialog = (groupId: string, question?: Question) => {
    setSelectedGroupId(groupId);
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options || ['', '', '', ''],
        correct_answer: question.correct_answer || '',
        points: question.points,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
      });
    }
    setQuestionDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, ...groupForm });
    } else {
      createGroupMutation.mutate(groupForm);
    }
  };

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, ...questionForm });
    } else if (selectedGroupId) {
      createQuestionMutation.mutate({ ...questionForm, groupId: selectedGroupId });
    }
  };

  if (sectionLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!section) {
    return <div className="text-center py-8">Section không tồn tại</div>;
  }

  const Icon = sectionIcons[section.section_type as keyof typeof sectionIcons] || FileText;
  const colorClass = sectionColors[section.section_type as keyof typeof sectionColors] || sectionColors.general;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={colorClass}>
                <Icon className="mr-1 h-3 w-3" />
                {section.section_type?.toUpperCase()}
              </Badge>
              {section.exams && (
                <span className="text-sm text-muted-foreground">
                  / <Link to={`/admin/exams/${(section.exams as any).id}`} className="hover:underline">{(section.exams as any).title}</Link>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{section.title}</h1>
          </div>
        </div>
      </div>

      {/* Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cài đặt Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>URL Audio (Listening)</Label>
              <Input
                placeholder="https://..."
                defaultValue={section.audio_url || ''}
                onBlur={(e) => updateSectionMutation.mutate({ audio_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời gian (phút)</Label>
              <Input type="number" defaultValue={section.duration_minutes || ''} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hướng dẫn chung</Label>
            <Textarea
              placeholder="Nhập hướng dẫn cho section..."
              defaultValue={section.instructions || ''}
              onBlur={(e) => updateSectionMutation.mutate({ instructions: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Nhóm câu hỏi</CardTitle>
            <CardDescription>Quản lý passages, audios và câu hỏi</CardDescription>
          </div>
          <Button onClick={() => handleOpenGroupDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhóm
          </Button>
        </CardHeader>
        <CardContent>
          {questionGroups && questionGroups.length > 0 ? (
            <Accordion type="multiple" className="space-y-4">
              {questionGroups.map((group, gIndex) => (
                <AccordionItem key={group.id} value={group.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{group.title || `Nhóm ${gIndex + 1}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {group.questions?.length || 0} câu hỏi
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenGroupDialog(group)}>
                          Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteGroupMutation.mutate(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {group.passage && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Đoạn văn:</div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{group.passage}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {group.questions?.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                            {qIndex + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-2">{q.question_text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {QUESTION_TYPES.find((t) => t.value === q.question_type)?.label || q.question_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{q.points} điểm</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenQuestionDialog(group.id, q)}>
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteQuestionMutation.mutate(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenQuestionDialog(group.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm câu hỏi
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có nhóm câu hỏi nào. Nhấn "Thêm nhóm" để bắt đầu.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}</DialogTitle>
            <DialogDescription>
              Nhóm câu hỏi có thể chứa một đoạn văn (passage) hoặc hướng dẫn riêng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề nhóm</Label>
              <Input
                placeholder="VD: Part 1, Questions 1-5"
                value={groupForm.title}
                onChange={(e) => setGroupForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Đoạn văn (Passage)</Label>
              <Textarea
                placeholder="Nhập đoạn văn đọc hiểu..."
                value={groupForm.passage}
                onChange={(e) => setGroupForm((f) => ({ ...f, passage: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Hướng dẫn</Label>
              <Textarea
                placeholder="Hướng dẫn làm bài cho nhóm câu hỏi này..."
                value={groupForm.instructions}
                onChange={(e) => setGroupForm((f) => ({ ...f, instructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveGroup} disabled={createGroupMutation.isPending || updateGroupMutation.isPending}>
              {(createGroupMutation.isPending || updateGroupMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nội dung câu hỏi *</Label>
              <Textarea
                placeholder="Nhập câu hỏi..."
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm((f) => ({ ...f, question_text: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <Select
                  value={questionForm.question_type}
                  onValueChange={(v) => setQuestionForm((f) => ({ ...f, question_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Điểm</Label>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, points: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            {questionForm.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Các lựa chọn</Label>
                {questionForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">{String.fromCharCode(65 + i)}.</span>
                    <Input
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[i] = e.target.value;
                        setQuestionForm((f) => ({ ...f, options: newOpts }));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Đáp án đúng</Label>
              <Input
                placeholder="Nhập đáp án đúng..."
                value={questionForm.correct_answer}
                onChange={(e) => setQuestionForm((f) => ({ ...f, correct_answer: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={!questionForm.question_text || createQuestionMutation.isPending || updateQuestionMutation.isPending}
            >
              {(createQuestionMutation.isPending || updateQuestionMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
