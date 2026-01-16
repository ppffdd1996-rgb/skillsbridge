import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Award, ExternalLink, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";

const levelColors = {
  learning: "bg-blue-100 text-blue-700 border-blue-200",
  competent: "bg-green-100 text-green-700 border-green-200",
  proficient: "bg-purple-100 text-purple-700 border-purple-200",
  verified: "bg-indigo-100 text-indigo-700 border-indigo-200"
};

const verificationBadge = {
  self: { icon: Clock, text: "Self-Reported", color: "text-gray-500" },
  system: { icon: Shield, text: "AI Verified", color: "text-indigo-600" },
  peer: { icon: Award, text: "Peer Verified", color: "text-green-600" },
  expert: { icon: Award, text: "Expert Verified", color: "text-purple-600" }
};

export default function SkillPassport({ skills, editable = true, onDelete }) {
  const groupedSkills = {
    verified: skills.filter(s => s.verified_by !== 'self'),
    unverified: skills.filter(s => s.verified_by === 'self')
  };

  if (skills.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-gray-50 to-slate-50">
        <CardContent className="p-12 text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Skills Yet</h3>
          <p className="text-gray-500">Add your first skill to start building your passport</p>
        </CardContent>
      </Card>
    );
  }

  const SkillCard = ({ skill, index }) => {
    const VerificationIcon = verificationBadge[skill.verified_by]?.icon || Clock;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="border border-gray-200 hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                  <Badge variant="outline" className={levelColors[skill.level]}>
                    {skill.level}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <VerificationIcon className={`w-4 h-4 ${verificationBadge[skill.verified_by]?.color || 'text-gray-500'}`} />
                    <span>{verificationBadge[skill.verified_by]?.text || 'Unverified'}</span>
                  </div>
                  
                  {skill.years_experience && (
                    <span>• {skill.years_experience} years</span>
                  )}

                  {skill.verification_score && (
                    <span className="flex items-center gap-1">
                      • <Award className="w-3 h-3" /> {skill.verification_score}/100
                    </span>
                  )}
                </div>

                {skill.proof_type && (
                  <Badge variant="outline" className="text-xs">
                    {skill.proof_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {skill.proof_url && (
                  <a href={skill.proof_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {editable && onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(skill.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {groupedSkills.verified.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Verified Skills</h2>
            <Badge className="bg-indigo-100 text-indigo-700">
              {groupedSkills.verified.length}
            </Badge>
          </div>
          <div className="grid gap-4">
            {groupedSkills.verified.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} />
            ))}
          </div>
        </div>
      )}

      {groupedSkills.unverified.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">Pending Verification</h2>
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
              {groupedSkills.unverified.length}
            </Badge>
          </div>
          <div className="grid gap-4">
            {groupedSkills.unverified.map((skill, i) => (
              <SkillCard key={skill.id} skill={skill} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}