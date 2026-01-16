import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ExperienceSection({ experience, isOwnProfile, onAdd }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Experience
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={onAdd}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {experience?.length > 0 ? (
          <div className="space-y-6">
            {experience.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-100">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                  <p className="text-indigo-600 font-medium">{exp.company}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span>{formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}</span>
                    {exp.location && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{exp.location}</span>
                      </>
                    )}
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-gray-600 text-sm">{exp.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No experience added yet</p>
        )}
      </CardContent>
    </Card>
  );
}