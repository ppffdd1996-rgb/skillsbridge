import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, Link as LinkIcon, Edit2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileHeader({ user, isOwnProfile, onEdit }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Cover gradient */}
      <div className="h-32 md:h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl" />
      
      <div className="px-6 pb-6 -mt-16 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600">
              {getInitials(user?.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'Anonymous User'}</h1>
              {user?.open_to_work && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 w-fit">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Open to Work
                </Badge>
              )}
            </div>
            
            {user?.headline && (
              <p className="text-gray-600 mt-1 text-lg">{user.headline}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {user?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </span>
              )}
              {user?.experience?.[0] && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {user.experience[0].title} at {user.experience[0].company}
                </span>
              )}
              {user?.portfolio_url && (
                <a 
                  href={user.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          {isOwnProfile && (
            <Button variant="outline" className="gap-2 self-start md:self-auto" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="mt-4 text-gray-600 leading-relaxed max-w-2xl">{user.bio}</p>
        )}

        {/* Skills */}
        {user?.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {user.skills.map((skill, i) => (
              <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}