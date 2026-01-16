import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, Clock, Briefcase, DollarSign, Building2, 
  Globe, Users, CheckCircle2, Bookmark, BookmarkCheck,
  Share2, ExternalLink, Send
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const remoteTypeColors = {
  "remote": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "hybrid": "bg-violet-50 text-violet-700 border-violet-200",
  "on-site": "bg-amber-50 text-amber-700 border-amber-200"
};

export default function JobDetailModal({ job, open, onClose, onApply, onSave, isSaved, hasApplied }) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!job) return null;

  const formatSalary = (min, max, period) => {
    if (!min && !max) return null;
    const formatNum = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    const suffix = period === 'hourly' ? '/hr' : '/yr';
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}${suffix}`;
    if (min) return `From ${formatNum(min)}${suffix}`;
    return `Up to ${formatNum(max)}${suffix}`;
  };

  const handleApply = async () => {
    setIsApplying(true);
    await onApply(job, coverLetter);
    setIsApplying(false);
    setShowApplyForm(false);
    setCoverLetter('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex gap-4">
              {job.company_logo ? (
                <img 
                  src={job.company_logo} 
                  alt={job.company_name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-indigo-500" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold text-gray-900">{job.title}</DialogTitle>
                <p className="text-indigo-600 font-medium mt-1">{job.company_name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(job.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              {hasApplied ? (
                <Button disabled className="flex-1 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Applied
                </Button>
              ) : (
                <Button 
                  className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setShowApplyForm(!showApplyForm)}
                >
                  <Send className="w-4 h-4" />
                  {showApplyForm ? 'Cancel' : 'Apply Now'}
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => onSave?.(job)}>
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Apply Form */}
            <AnimatePresence>
              {showApplyForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter (optional)
                    </label>
                    <Textarea
                      placeholder="Tell the employer why you're a great fit for this role..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="min-h-[120px] bg-white"
                    />
                    <Button 
                      className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700"
                      onClick={handleApply}
                      disabled={isApplying}
                    >
                      {isApplying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {job.remote_type && (
                <Badge variant="outline" className={`${remoteTypeColors[job.remote_type]} border`}>
                  {job.remote_type === 'on-site' ? 'On-site' : job.remote_type.charAt(0).toUpperCase() + job.remote_type.slice(1)}
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {job.job_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {job.experience_level && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                  {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)} Level
                </Badge>
              )}
            </div>

            {/* Salary */}
            {formatSalary(job.salary_min, job.salary_max, job.salary_period) && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-lg font-semibold text-green-700">
                    {formatSalary(job.salary_min, job.salary_max, job.salary_period)}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">About This Role</h3>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                <div className="grid grid-cols-2 gap-2">
                  {job.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}