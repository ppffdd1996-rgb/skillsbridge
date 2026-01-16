import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, Clock, DollarSign, MapPin, CheckCircle2, 
  X, MessageCircle, Award, Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  pending: { 
    label: "New Match", 
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock 
  },
  talent_interested: { 
    label: "Interest Sent", 
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Sparkles 
  },
  creator_interested: { 
    label: "Creator Interested", 
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2 
  },
  mutual_interest: { 
    label: "Mutual Interest", 
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: MessageCircle 
  },
  in_trial: { 
    label: "In Trial", 
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Award 
  },
  completed: { 
    label: "Completed", 
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2 
  },
  declined: { 
    label: "Declined", 
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: X 
  }
};

export default function MatchCard({ 
  match, 
  opportunity, 
  userType = "talent",
  onAccept,
  onDecline,
  onChat 
}) {
  if (!opportunity) {
    return null;
  }

  const status = statusConfig[match.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const matchPercent = Math.round(match.match_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {opportunity.title}
              </h3>
              <p className="text-gray-600 line-clamp-2">{opportunity.description}</p>
            </div>
            
            <div className="ml-4">
              <div className="flex flex-col items-center gap-1 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                <Target className="w-5 h-5 text-indigo-600" />
                <span className="text-2xl font-bold text-indigo-600">{matchPercent}%</span>
                <span className="text-xs text-gray-600">Match</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <Badge variant="outline" className={`${status.color} gap-1.5`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </Badge>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span>{opportunity.compensation_amount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{opportunity.effort}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="capitalize">{opportunity.location_type}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {match.matched_skills?.map(skill => (
                <Badge key={skill} className="bg-green-50 text-green-700 border-green-200">
                  ✓ {skill}
                </Badge>
              ))}
              {match.missing_skills?.map(skill => (
                <Badge key={skill} variant="outline" className="text-gray-500 border-gray-300">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Trial Task Badge */}
          {opportunity.has_trial_task && (
            <div className="mb-4">
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                💰 Paid Trial Task Available: {opportunity.trial_task_pay}
              </Badge>
            </div>
          )}

          {/* Actions */}
          {match.status === 'pending' && userType === 'talent' && onAccept && onDecline && (
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onAccept(match)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Express Interest
              </Button>
              <Button 
                variant="outline"
                onClick={() => onDecline(match)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {match.chat_unlocked && onChat && (
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              onClick={() => onChat(match)}
            >
              <MessageCircle className="w-4 h-4" />
              Open Chat
            </Button>
          )}

          {match.status === 'talent_interested' && userType === 'talent' && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center">
              <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 font-medium">
                Waiting for creator response...
              </p>
            </div>
          )}

          {match.status === 'mutual_interest' && !match.chat_unlocked && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
              <MessageCircle className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-indigo-700 font-medium">
                Chat unlocking...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}