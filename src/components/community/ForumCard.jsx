import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, ArrowRight } from 'lucide-react';

const CATEGORY_LABELS = {
  career_advice: 'Career Advice',
  industry_discussion: 'Industry Discussion',
  networking: 'Networking',
  job_search: 'Job Search',
  skill_development: 'Skill Development'
};

export default function ForumCard({ forum, isMember, onJoin, onLeave, onOpen }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onOpen(forum)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-9 h-9 rounded-lg bg-${forum.color || 'indigo'}-100 flex items-center justify-center flex-shrink-0`}>
                <Users className={`w-5 h-5 text-${forum.color || 'indigo'}-600`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600">{forum.name}</h3>
                <p className="text-xs text-gray-500">{forum.industry}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">{forum.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{forum.member_count || 0} members</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{forum.post_count || 0} posts</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[forum.category] || 'Discussion'}</Badge>
          {isMember ? (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onLeave(forum); }}>Joined ✓</Button>
          ) : (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onJoin(forum); }} className="gap-1">Join<ArrowRight className="w-3 h-3" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}