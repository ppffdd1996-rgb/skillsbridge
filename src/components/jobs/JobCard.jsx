import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, DollarSign, Bookmark, BookmarkCheck, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const remoteTypeColors = {
  "remote": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "hybrid": "bg-violet-50 text-violet-700 border-violet-200",
  "on-site": "bg-amber-50 text-amber-700 border-amber-200"
};

const jobTypeLabels = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "contract": "Contract",
  "internship": "Internship",
  "freelance": "Freelance"
};

export default function JobCard({ job, onSave, isSaved, onClick }) {
  const formatSalary = (min, max, period) => {
    if (!min && !max) return null;
    const formatNum = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    if (min && max) return `$${formatNum(min)} - $${formatNum(max)}${period === 'hourly' ? '/hr' : '/yr'}`;
    if (min) return `From $${formatNum(min)}${period === 'hourly' ? '/hr' : '/yr'}`;
    return `Up to $${formatNum(max)}${period === 'hourly' ? '/hr' : '/yr'}`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_period);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
        onClick={onClick}
      >
        <div className="flex gap-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={job.company_name}
                className="w-14 h-14 rounded-xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-100">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-gray-600 font-medium mt-0.5">{job.company_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 -mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(job);
                }}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                ) : (
                  <Bookmark className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                )}
              </Button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                {jobTypeLabels[job.job_type] || job.job_type}
              </span>
              {salary && (
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <DollarSign className="w-4 h-4" />
                  {salary}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {job.remote_type && (
                <Badge variant="outline" className={`${remoteTypeColors[job.remote_type]} border font-medium`}>
                  {job.remote_type === 'on-site' ? 'On-site' : job.remote_type.charAt(0).toUpperCase() + job.remote_type.slice(1)}
                </Badge>
              )}
              {job.experience_level && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                  {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                </Badge>
              )}
              {job.skills?.slice(0, 2).map((skill, i) => (
                <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {skill}
                </Badge>
              ))}
              {job.skills?.length > 2 && (
                <span className="text-xs text-gray-400">+{job.skills.length - 2} more</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(job.created_date), 'MMM d, yyyy')}
              </span>
              {job.applicants_count > 0 && (
                <span className="text-xs text-gray-500">
                  {job.applicants_count} applicant{job.applicants_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}