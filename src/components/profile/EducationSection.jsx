import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function EducationSection({ education, isOwnProfile, onAdd }) {
  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Education
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={onAdd}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {education?.length > 0 ? (
          <div className="space-y-6">
            {education.map((edu, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{edu.school}</h4>
                  <p className="text-gray-600">
                    {edu.degree}{edu.field && `, ${edu.field}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {edu.start_year} - {edu.end_year || 'Present'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No education added yet</p>
        )}
      </CardContent>
    </Card>
  );
}