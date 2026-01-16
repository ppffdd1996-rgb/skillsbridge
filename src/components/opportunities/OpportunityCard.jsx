import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, MapPin, Target, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const compensationTypeIcons = {
  hourly: DollarSign,
  fixed: DollarSign,
  equity: TrendingUp,
  mixed: Sparkles
};

export default function OpportunityCard({ opportunity, matchScore, onClick, onExpress }) {
  const CompIcon = compensationTypeIcons[opportunity.compensation_type] || DollarSign;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        {matchScore && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3">
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-medium">Match Score</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${matchScore * 100}%` }}
                  />
                </div>
                <span className="font-bold">{Math.round(matchScore * 100)}%</span>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="p-6" onClick={onClick}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                {opportunity.title}
              </h3>
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {opportunity.description}
              </p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {opportunity.effort}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <CompIcon className="w-4 h-4" />
              {opportunity.compensation_amount}
            </span>
            {opportunity.location_type === 'remote' ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Remote
              </Badge>
            ) : (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {opportunity.location}
              </span>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {opportunity.skills_required?.slice(0, 4).map((skill, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {skill}
              </Badge>
            ))}
            {opportunity.skills_required?.length > 4 && (
              <span className="text-xs text-gray-400">
                +{opportunity.skills_required.length - 4} more
              </span>
            )}
          </div>

          {/* Trial Task Badge */}
          {opportunity.has_trial_task && (
            <Badge className="bg-purple-100 text-purple-700 border-0 gap-1">
              <Target className="w-3 h-3" />
              Paid Trial Task Available
            </Badge>
          )}

          {/* Action */}
          {onExpress && (
            <Button 
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={(e) => {
                e.stopPropagation();
                onExpress(opportunity);
              }}
            >
              Express Interest
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}