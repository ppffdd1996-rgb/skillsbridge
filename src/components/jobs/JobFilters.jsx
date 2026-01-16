import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobFilters({ filters, setFilters, showAdvanced, setShowAdvanced }) {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: 'all',
      remoteType: 'all',
      experienceLevel: 'all'
    });
  };

  const hasActiveFilters = filters.search || filters.location || 
    filters.jobType !== 'all' || filters.remoteType !== 'all' || 
    filters.experienceLevel !== 'all';

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Job title, keywords, or company"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-12 h-12 text-base bg-white border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="City, state, or remote"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="pl-12 h-12 text-base bg-white border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        </div>
        <Button 
          variant="outline" 
          className="h-12 px-4 gap-2"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="flex flex-wrap gap-3">
                <Select value={filters.jobType} onValueChange={(v) => handleChange('jobType', v)}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.remoteType} onValueChange={(v) => handleChange('remoteType', v)}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Work Types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.experienceLevel} onValueChange={(v) => handleChange('experienceLevel', v)}>
                  <SelectTrigger className="w-44 bg-white">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}