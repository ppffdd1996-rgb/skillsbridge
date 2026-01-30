import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Eye, EyeOff, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function RecruiterNotes({ applicationId, currentUserEmail }) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [visibility, setVisibility] = useState('team');
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ['recruiter-notes', applicationId],
    queryFn: () => base44.entities.RecruiterNote.filter({ application_id: applicationId }, '-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const addNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.RecruiterNote.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-notes'] });
      setNewNote('');
      toast.success('Note added');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addNoteMutation.mutate({
      application_id: applicationId,
      author_email: currentUserEmail,
      note: newNote,
      note_type: noteType,
      visibility,
    });
  };

  const visibleNotes = notes.filter(note => 
    note.visibility === 'team' || note.author_email === currentUserEmail
  );

  const noteTypeColors = {
    general: 'bg-gray-100 text-gray-700',
    screening: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    decision: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Team Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Add a note for your team..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2 flex-wrap">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>

              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Team
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-3 h-3" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" disabled={!newNote.trim() || addNoteMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </form>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {visibleNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No team notes yet</p>
              </div>
            ) : (
              visibleNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    note.author_email === currentUserEmail ? 'bg-indigo-50 border-indigo-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <User className="w-3 h-3" />
                        <span className="font-medium">
                          {note.author_email === currentUserEmail ? 'You' : note.author_email.split('@')[0]}
                        </span>
                      </div>
                      <Badge variant="outline" className={noteTypeColors[note.note_type]}>
                        {note.note_type}
                      </Badge>
                      {note.visibility === 'private' && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(note.created_date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}