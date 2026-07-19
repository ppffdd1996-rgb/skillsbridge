import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Briefcase, Sparkles, Link2 } from 'lucide-react';

export default function MentorCard({ mentor, onConnect }) {
  const initials = mentor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const fit = mentor.fit_score;
  const fitColor = fit >= 75 ? 'text-green-600 bg-green-50' : fit >= 50 ? 'text-amber-600 bg-amber-50' : 'text-gray-600 bg-gray-50';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-5">
        <div className="flex gap-3">
          <Avatar className="w-14 h-14 flex-shrink-0">
            <AvatarImage src={mentor.profile_picture_url} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{mentor.name}</h3>
                <p className="text-sm text-gray-600 truncate flex items-center gap-1"><Briefcase className="w-3 h-3 flex-shrink-0" />{mentor.title}{mentor.company ? ` @ ${mentor.company}` : ''}</p>
              </div>
              {fit != null && (
                <div className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${fitColor}`}>
                  {fit}% fit
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {mentor.years_experience != null && <span>{mentor.years_experience}y exp</span>}
              {mentor.rating != null && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{mentor.rating.toFixed(1)}</span>}
              {mentor.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{mentor.location}</span>}
            </div>
          </div>
        </div>

        {mentor.bio && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{mentor.bio}</p>}

        {mentor.expertise_areas?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {mentor.expertise_areas.slice(0, 4).map((e, i) => <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>)}
          </div>
        )}

        {mentor.match_reasons?.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-700 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Why this match</p>
            <ul className="space-y-0.5">
              {mentor.match_reasons.slice(0, 2).map((r, i) => <li key={i} className="text-xs text-gray-600">• {r}</li>)}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1 gap-1" onClick={() => onConnect(mentor)} disabled={!mentor.is_available}>
            Connect
          </Button>
          {mentor.linkedin_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"><Link2 className="w-4 h-4" /></a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}