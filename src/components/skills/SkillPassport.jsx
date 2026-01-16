import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const levelColors = {
  learning: "bg-blue-50 text-blue-700 border-blue-200",
  competent: "bg-green-50 text-green-700 border-green-200",
  proficient: "bg-purple-50 text-purple-700 border-purple-200",
  verified: "bg-indigo-50 text-indigo-700 border-indigo-200"
};

const verifiedByIcons = {
  self: AlertCircle,
  system: CheckCircle2,
  peer: Shield,
  expert: Shield
};

export default function SkillPassport({ skills, onAdd, editable = false }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Skill Passport
        </CardTitle>
        {editable && (
          <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {skills?.length > 0 ? (
          <div className="grid gap-4">
            {skills.map((skill, i) => {
              const VerifiedIcon = verifiedByIcons[skill.verified_by] || AlertCircle;
              return (
                <motion.div
                  key={skill.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                        <Badge variant="outline" className={`${levelColors[skill.level]} border`}>
                          {skill.level}
                        </Badge>
                        {skill.verified_by !== 'self' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <VerifiedIcon className="w-3 h-3" />
                            {skill.verified_by}
                          </Badge>
                        )}
                      </div>
                      
                      {skill.years_experience && (
                        <p className="text-sm text-gray-600">
                          {skill.years_experience} {skill.years_experience === 1 ? 'year' : 'years'} experience
                        </p>
                      )}
                      
                      {skill.verification_score && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${skill.verification_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {skill.verification_score}/100
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {skill.proof_url && (
                      <a 
                        href={skill.proof_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  {skill.proof_type && (
                    <Badge variant="outline" className="mt-2 text-xs bg-white">
                      {skill.proof_type.replace('_', ' ')}
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No skills added yet</p>
            {editable && (
              <Button variant="outline" className="mt-3" onClick={onAdd}>
                Add Your First Skill
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}