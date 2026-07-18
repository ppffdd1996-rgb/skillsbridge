import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Users, MessageSquare, Heart, Clock, ArrowLeft } from 'lucide-react';
import ForumCard from '@/components/community/ForumCard';
import ForumThread from '@/components/community/ForumThread';
import CreatePostDialog from '@/components/community/CreatePostDialog';
import CreateForumDialog from '@/components/community/CreateForumDialog';

const CATEGORY_LABELS = {
  career_growth: 'Career Growth', advice: 'Advice', success_story: 'Success Story',
  question: 'Question', resource: 'Resource', networking: 'Networking'
};

function initials(name) { return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
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

export default function CommunityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [view, setView] = useState('forums'); // forums | forum | thread
  const [selectedForum, setSelectedForum] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreateForum, setShowCreateForum] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [replyText, setReplyText] = useState('');

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Forums
  const { data: forums = [], isLoading: forumsLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: () => base44.entities.Forum.list('-member_count', 50)
  });

  // User memberships
  const { data: memberships = [] } = useQuery({
    queryKey: ['forum-memberships', user?.email],
    queryFn: () => base44.entities.ForumMembership.filter({ user_email: user.email }),
    enabled: !!user
  });

  const joinedIds = useMemo(() => new Set(memberships.map(m => m.forum_id)), [memberships]);

  // Posts for selected forum
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['forum-posts', selectedForum?.id],
    queryFn: () => base44.entities.ForumPost.filter({ forum_id: selectedForum.id }, '-created_date', 50),
    enabled: !!selectedForum
  });

  // Replies for selected post
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ['forum-replies', selectedPost?.id],
    queryFn: () => base44.entities.ForumReply.filter({ post_id: selectedPost.id }, 'created_date'),
    enabled: !!selectedPost
  });

  // Join forum
  const joinMutation = useMutation({
    mutationFn: async (forum) => {
      await base44.entities.ForumMembership.create({
        forum_id: forum.id, forum_name: forum.name,
        user_email: user.email, user_name: user.full_name || user.display_name,
        joined_at: new Date().toISOString()
      });
      await base44.entities.Forum.update(forum.id, { member_count: (forum.member_count || 0) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-memberships', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      toast({ title: 'Joined forum!' });
    },
    onError: (e) => toast({ title: 'Failed to join', description: e.message, variant: 'destructive' })
  });

  // Leave forum
  const leaveMutation = useMutation({
    mutationFn: async (forum) => {
      const myMembership = memberships.find(m => m.forum_id === forum.id);
      if (myMembership) await base44.entities.ForumMembership.delete(myMembership.id);
      await base44.entities.Forum.update(forum.id, { member_count: Math.max(0, (forum.member_count || 0) - 1) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-memberships', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      toast({ title: 'Left forum' });
    }
  });

  // Create forum
  const createForumMutation = useMutation({
    mutationFn: (data) => base44.entities.Forum.create({
      ...data, created_by_email: user.email, created_by_name: user.full_name || user.display_name,
      member_count: 1, post_count: 0
    }),
    onSuccess: (forum) => {
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      base44.entities.ForumMembership.create({
        forum_id: forum.id, forum_name: forum.name,
        user_email: user.email, user_name: user.full_name, joined_at: new Date().toISOString()
      }).then(() => queryClient.invalidateQueries({ queryKey: ['forum-memberships', user?.email] }));
      setShowCreateForum(false);
      toast({ title: 'Forum created!' });
    },
    onError: (e) => toast({ title: 'Failed to create forum', description: e.message, variant: 'destructive' })
  });

  // Create post
  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create({
      ...data, forum_id: selectedForum.id, forum_name: selectedForum.name,
      author_email: user.email, author_name: user.full_name || user.display_name,
      likes_count: 0, replies_count: 0, liked_by: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts', selectedForum?.id] });
      queryClient.invalidateQueries({ queryKey: ['forums'] });
      base44.entities.Forum.update(selectedForum.id, { post_count: (selectedForum.post_count || 0) + 1 });
      setShowCreatePost(false);
      toast({ title: 'Post published!' });
    },
    onError: (e) => toast({ title: 'Failed to post', description: e.message, variant: 'destructive' })
  });

  // Reply
  const replyMutation = useMutation({
    mutationFn: () => base44.entities.ForumReply.create({
      post_id: selectedPost.id, forum_id: selectedPost.forum_id,
      author_email: user.email, author_name: user.full_name || user.display_name,
      content: replyText, likes_count: 0, liked_by: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedPost?.id] });
      base44.entities.ForumPost.update(selectedPost.id, { replies_count: (selectedPost.replies_count || 0) + 1 });
      setReplyText('');
      toast({ title: 'Reply posted' });
    }
  });

  // Like post
  const likePostMutation = useMutation({
    mutationFn: (post) => {
      const liked = post.liked_by?.includes(user.email);
      return base44.entities.ForumPost.update(post.id, {
        likes_count: liked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1,
        liked_by: liked ? (post.liked_by || []).filter(e => e !== user.email) : [...(post.liked_by || []), user.email]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts', selectedForum?.id] })
  });

  // Like reply
  const likeReplyMutation = useMutation({
    mutationFn: (replyId) => {
      const r = replies.find(x => x.id === replyId);
      const liked = r.liked_by?.includes(user.email);
      return base44.entities.ForumReply.update(replyId, {
        likes_count: liked ? (r.likes_count || 0) - 1 : (r.likes_count || 0) + 1,
        liked_by: liked ? (r.liked_by || []).filter(e => e !== user.email) : [...(r.liked_by || []), user.email]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-replies', selectedPost?.id] })
  });

  const filteredForums = useMemo(() => {
    if (!search) return forums;
    const q = search.toLowerCase();
    return forums.filter(f => f.name?.toLowerCase().includes(q) || f.industry?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q));
  }, [forums, search]);

  const openForum = (forum) => { setSelectedForum(forum); setView('forum'); };
  const openPost = (post) => { setSelectedPost(post); setView('thread'); };
  const backToForums = () => { setSelectedForum(null); setView('forums'); };
  const backToForum = () => { setSelectedPost(null); setView('forum'); };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 py-8">
      {view === 'thread' && selectedPost && (
        <ForumThread
          post={selectedPost} replies={replies} user={user}
          onBack={backToForum}
          onReply={() => replyMutation.mutate()} onLikePost={() => likePostMutation.mutate(selectedPost)}
          onLikeReply={(id) => likeReplyMutation.mutate(id)}
          replyText={replyText} setReplyText={setReplyText} isReplying={replyMutation.isPending}
        />
      )}

      {view === 'forum' && selectedForum && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={backToForums} className="mb-4 gap-1">
            <ArrowLeft className="w-4 h-4" /> All Forums
          </Button>
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedForum.name}</h1>
              <p className="text-gray-600 mt-1">{selectedForum.description || `${selectedForum.industry} discussions`}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {selectedForum.member_count || 0} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {selectedForum.post_count || 0} posts</span>
              </div>
            </div>
            {joinedIds.has(selectedForum.id) && (
              <Button onClick={() => setShowCreatePost(true)} className="gap-1"><Plus className="w-4 h-4" /> New Post</Button>
            )}
          </div>
          {!joinedIds.has(selectedForum.id) && (
            <Card className="mb-6 bg-indigo-50 border-indigo-100"><CardContent className="pt-4 text-center">
              <p className="text-gray-700 mb-3">Join this forum to participate in discussions.</p>
              <Button onClick={() => joinMutation.mutate(selectedForum)}>Join Forum</Button>
            </CardContent></Card>
          )}
          {postsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : posts.length === 0 ? (
            <Card><CardContent className="pt-12 pb-12 text-center text-gray-500">No posts yet. Start the conversation!</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const liked = post.liked_by?.includes(user.email);
                return (
                  <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openPost(post)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9"><AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">{initials(post.author_name)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 hover:text-indigo-600">{post.title}</h3>
                            <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[post.category] || 'Discussion'}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{post.author_name} · <Clock className="w-3 h-3 inline" /> {timeAgo(post.created_date)}</p>
                          <p className="text-gray-700 mt-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className={`flex items-center gap-1 ${liked ? 'text-red-500' : ''}`}><Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} /> {post.likes_count || 0}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.replies_count || 0} replies</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'forums' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-8 h-8 text-indigo-600" /> Community Forums</h1>
            <p className="text-gray-600 mt-1">Join industry-specific forums to discuss career growth, share advice, and network with peers.</p>
          </div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search forums by name, industry, or topic..." className="pl-9" />
            </div>
            <Button onClick={() => setShowCreateForum(true)} className="gap-1"><Plus className="w-4 h-4" /> Start a Forum</Button>
          </div>

          {forumsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : filteredForums.length === 0 ? (
            <Card><CardContent className="pt-12 pb-12 text-center text-gray-500">No forums found. Start one!</CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForums.map(forum => (
                <ForumCard
                  key={forum.id} forum={forum} isMember={joinedIds.has(forum.id)}
                  onJoin={() => joinMutation.mutate(forum)} onLeave={() => leaveMutation.mutate(forum)} onOpen={openForum}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateForumDialog open={showCreateForum} onOpenChange={setShowCreateForum} onSubmit={(data) => createForumMutation.mutate(data)} />
      <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} onSubmit={(data) => createPostMutation.mutate(data)} forumName={selectedForum?.name} />
    </div>
  );
}