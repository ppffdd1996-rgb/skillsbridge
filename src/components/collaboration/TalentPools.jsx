import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Plus, Share2, UserPlus, X, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

export default function TalentPools({ currentUserEmail }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [newPool, setNewPool] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [candidateEmail, setCandidateEmail] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: pools = [] } = useQuery({
    queryKey: ['talent-pools', currentUserEmail],
    queryFn: async () => {
      const owned = await base44.entities.TalentPool.filter({ owner_email: currentUserEmail });
      const shared = await base44.entities.TalentPool.filter({ 
        shared_with: { $includes: currentUserEmail } 
      });
      const publicPools = await base44.entities.TalentPool.filter({ is_public: true });
      
      const allPools = [...owned, ...shared, ...publicPools];
      const uniquePools = Array.from(new Map(allPools.map(p => [p.id, p])).values());
      return uniquePools;
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: (poolData) => base44.entities.TalentPool.create({
      ...poolData,
      owner_email: currentUserEmail,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      setIsCreateOpen(false);
      setNewPool({ name: '', description: '', is_public: false });
      toast.success('Talent pool created');
    },
  });

  const updatePoolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TalentPool.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-pools'] });
      toast.success('Pool updated');
    },
  });

  const addCandidateToPool = (poolId, candidateEmail) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;
    
    if (pool.candidate_emails?.includes(candidateEmail)) {
      toast.error('Candidate already in pool');
      return;
    }

    updatePoolMutation.mutate({
      id: poolId,
      data: {
        candidate_emails: [...(pool.candidate_emails || []), candidateEmail],
      },
    });
    setCandidateEmail('');
  };

  const sharePool = (poolId) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool || !shareEmail) return;
    
    if (pool.shared_with?.includes(shareEmail)) {
      toast.error('Already shared with this recruiter');
      return;
    }

    updatePoolMutation.mutate({
      id: poolId,
      data: {
        shared_with: [...(pool.shared_with || []), shareEmail],
      },
    });
    setShareEmail('');
    toast.success('Pool shared');
  };

  const removeCandidate = (poolId, candidateEmail) => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;

    updatePoolMutation.mutate({
      id: poolId,
      data: {
        candidate_emails: pool.candidate_emails.filter(e => e !== candidateEmail),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Talent Pools</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Talent Pool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Pool Name</Label>
                <Input
                  placeholder="e.g., Senior Developers"
                  value={newPool.name}
                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe this talent pool..."
                  value={newPool.description}
                  onChange={(e) => setNewPool({ ...newPool, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Make Public (all recruiters can access)</Label>
                <Switch
                  checked={newPool.is_public}
                  onCheckedChange={(checked) => setNewPool({ ...newPool, is_public: checked })}
                />
              </div>
              <Button
                onClick={() => createPoolMutation.mutate(newPool)}
                disabled={!newPool.name || createPoolMutation.isPending}
                className="w-full"
              >
                Create Pool
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pools.map((pool) => (
          <Card key={pool.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    {pool.name}
                  </CardTitle>
                  {pool.description && (
                    <p className="text-sm text-gray-600 mt-1">{pool.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pool.is_public ? (
                    <Badge variant="outline" className="bg-green-50">
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  {pool.candidate_emails?.length || 0} candidates
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {pool.candidate_emails?.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email.split('@')[0]}
                      {pool.owner_email === currentUserEmail && (
                        <button
                          onClick={() => removeCandidate(pool.id, email)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {pool.owner_email === currentUserEmail && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Candidate email"
                      value={selectedPool === pool.id ? candidateEmail : ''}
                      onChange={(e) => {
                        setSelectedPool(pool.id);
                        setCandidateEmail(e.target.value);
                      }}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => addCandidateToPool(pool.id, candidateEmail)}
                      disabled={!candidateEmail}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {!pool.is_public && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Share with recruiter email"
                        value={selectedPool === pool.id ? shareEmail : ''}
                        onChange={(e) => {
                          setSelectedPool(pool.id);
                          setShareEmail(e.target.value);
                        }}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sharePool(pool.id)}
                        disabled={!shareEmail}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                Owner: {pool.owner_email === currentUserEmail ? 'You' : pool.owner_email}
                {pool.shared_with?.length > 0 && (
                  <span className="ml-2">• Shared with {pool.shared_with.length} recruiters</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pools.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Talent Pools Yet</h3>
            <p className="text-gray-500 mb-4">Create pools to organize and share candidates with your team</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Pool
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}