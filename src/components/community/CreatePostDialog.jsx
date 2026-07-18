import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'career_growth', label: 'Career Growth' },
  { value: 'advice', label: 'Advice' },
  { value: 'success_story', label: 'Success Story' },
  { value: 'question', label: 'Question' },
  { value: 'resource', label: 'Resource' },
  { value: 'networking', label: 'Networking' }
];

export default function CreatePostDialog({ open, onOpenChange, onSubmit, forumName }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');

  const submit = () => {
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, category });
    setTitle(''); setContent(''); setCategory('discussion');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Post {forumName ? `in ${forumName}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What would you like to discuss?" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Share your thoughts, advice, or question..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || !content.trim()}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}