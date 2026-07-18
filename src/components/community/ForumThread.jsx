import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Heart, ArrowLeft, Clock, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const CATEGORY_LABELS = {
  career_growth: 'Career Growth',
  advice: 'Advice',
  success_story: 'Success Story',
  question: 'Question',
  resource: 'Resource',
  networking: 'Networking'
};

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return new Date(date).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h ago`;
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins}m ago` : 'just now';
}

export default function ForumThread({ post, replies, user, onBack, onReply, onLikePost, onLikeReply, replyText, setReplyText, isReplying }) {
  const liked = post.liked_by?.includes(user?.email);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to forum
      </Button>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-indigo-100 text-indigo-700">{initials(post.author_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
                <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[post.category] || 'Discussion'}</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                by {post.author_name || 'Anonymous'} · <Clock className="w-3 h-3 inline" /> {timeAgo(post.created_date)}
              </p>
            </div>
          </div>
          <p className="text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          <div className="flex items-center gap-4 mt-5 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={onLikePost} className={`gap-1 ${liked ? 'text-red-500' : 'text-gray-500'}`}>
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {post.likes_count || 0}
            </Button>
            <span className="text-sm text-gray-500 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {replies.length} replies</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Replies</h3>
        <div className="space-y-3">
          {replies.map(r => {
            const rLiked = r.liked_by?.includes(user?.email);
            return (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <CornerDownRight className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">{initials(r.author_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{r.author_name || 'Anonymous'} <span className="text-gray-400 font-normal text-xs">· {timeAgo(r.created_date)}</span></p>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{r.content}</p>
                      <Button variant="ghost" size="sm" onClick={() => onLikeReply(r.id)} className={`mt-2 h-7 gap-1 ${rLiked ? 'text-red-500' : 'text-gray-400'}`}>
                        <Heart className={`w-3 h-3 ${rLiked ? 'fill-current' : ''}`} /> {r.likes_count || 0}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {replies.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No replies yet. Be the first to respond!</p>}
        </div>

        {user && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                className="mb-2"
              />
              <Button onClick={onReply} disabled={!replyText.trim() || isReplying} size="sm">Post Reply</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}