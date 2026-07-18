import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'career_advice', label: 'Career Advice' },
  { value: 'industry_discussion', label: 'Industry Discussion' },
  { value: 'networking', label: 'Networking' },
  { value: 'job_search', label: 'Job Search' },
  { value: 'skill_development', label: 'Skill Development' }
];

const COLORS = ['indigo', 'purple', 'blue', 'green', 'pink', 'orange', 'teal'];

export default function CreateForumDialog({ open, onOpenChange, onSubmit }) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('industry_discussion');

  const submit = () => {
    if (!name.trim() || !industry.trim()) return;
    onSubmit({ name, industry, description, category, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setName(''); setIndustry(''); setDescription(''); setCategory('industry_discussion');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a New Forum</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Forum Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Women in Tech" />
          </div>
          <div>
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" />
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
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is this forum about?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || !industry.trim()}>Create Forum</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}