import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, XCircle, Clock, Target } from "lucide-react";
import { motion } from "framer-motion";

const statusColors = {
  pending: "bg-gray-100 text-gray-700",
  talent_interested: "bg-blue-100 text-blue-700",
  creator_interested: "bg-purple-100 text-purple-700",
  mutual_interest: "bg-green-100 text-green-700",
  in_trial: "bg-yellow-100 text-yellow-700",
  completed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700"
};

export default function MatchCard({ match, opportunity, userType, onAccept, onDecline, onChat }) {
  const isMutualInterest = match.talent_interested && match.creator_interested;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{opportunity?.title}</h3>
                <Badge className={`${statusColors[match.status]} border-0`}>
                  {match.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {/* Match Score */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${match.match_score * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(match.match_score * 100)}% match
                </span>
              </div>

              {/* Matched Skills */}
              {match.matched_skills?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Matched Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {match.matched_skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {match.missing_skills?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Growth Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {match.missing_skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trial Task Status */}
          {opportunity?.has_trial_task && match.trial_task_status && (
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Trial Task: {match.trial_task_status.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {match.status === 'pending' && (
              <>
                {userType === 'talent' && !match.talent_interested && (
                  <Button 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onAccept(match)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    I'm Interested
                  </Button>
                )}
                {userType === 'creator' && !match.creator_interested && (
                  <Button 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => onAccept(match)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Invite to Apply
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => onDecline(match)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {isMutualInterest && match.chat_unlocked && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onChat(match)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            )}

            {match.status === 'talent_interested' && userType === 'creator' && (
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onAccept(match)}
              >
                Accept & Unlock Chat
              </Button>
            )}

            {match.status === 'creator_interested' && userType === 'talent' && (
              <div className="flex-1 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Waiting for creator response...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}