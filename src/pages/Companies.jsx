import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, MapPin, Users, Globe, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Companies() {
  const [search, setSearch] = useState('');

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date')
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.filter({ status: 'active' })
  });

  const getJobCount = (companyName) => jobs.filter(j => j.company_name === companyName).length;

  const filteredCompanies = companies.filter(c => 
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Discover Companies</h1>
          <p className="text-gray-500 mt-3">Explore innovative companies and find your next workplace</p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search companies by name or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Companies Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer h-full">
                  {/* Cover */}
                  <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    {company.cover_image && (
                      <img 
                        src={company.cover_image} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  <CardContent className="p-6 pt-0 -mt-10 relative">
                    {/* Logo */}
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={company.name}
                        className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-gray-400" />
                      </div>
                    )}

                    <h3 className="font-semibold text-lg text-gray-900 mt-3 group-hover:text-indigo-600 transition-colors">
                      {company.name}
                    </h3>

                    {company.industry && (
                      <Badge variant="outline" className="mt-2 bg-gray-50 border-gray-200">
                        {company.industry}
                      </Badge>
                    )}

                    {company.description && (
                      <p className="text-gray-500 text-sm mt-3 line-clamp-2">{company.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-500">
                      {company.headquarters && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {company.headquarters}
                        </span>
                      )}
                      {company.company_size && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {company.company_size} employees
                        </span>
                      )}
                    </div>

                    {/* Job count */}
                    {getJobCount(company.name) > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-indigo-600">
                          <Briefcase className="w-4 h-4" />
                          {getJobCount(company.name)} open position{getJobCount(company.name) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 rounded-2xl border border-gray-100">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No companies found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}