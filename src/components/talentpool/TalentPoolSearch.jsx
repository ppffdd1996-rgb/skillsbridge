import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Star, MapPin, Briefcase } from 'lucide-react';

export default function TalentPoolSearch({ talentPoolId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [minRating, setMinRating] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSearch = async () => {
    if (!talentPoolId) return;

    setSearching(true);
    try {
      const response = await base44.functions.invoke('searchTalentPool', {
        talentPoolId,
        searchQuery: searchQuery || undefined,
        skills: selectedSkills,
        experienceLevel: experienceLevel || undefined,
        minInterviewRating: minRating ? parseInt(minRating) : undefined,
        availability: availability || undefined,
        tags: selectedTags
      });

      if (response.data?.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search talent pool');
    } finally {
      setSearching(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills([...selectedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name or Email
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter candidate name or email..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill..."
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button
                  variant="outline"
                  onClick={addSkill}
                  className="px-4"
                >
                  Add
                </Button>
              </div>
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                    >
                      {skill} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Levels</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid-level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interview Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Interview Rating
              </label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Ratings</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger>
                  <SelectValue placeholder="Select availability..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any Availability</SelectItem>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="2-weeks">2 Weeks</SelectItem>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button
                variant="outline"
                onClick={addTag}
                className="px-4"
              >
                Add
              </Button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    className="bg-purple-100 text-purple-800 cursor-pointer"
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Talent Pool
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              Search Results ({results.totalMatches} candidates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.results.length > 0 ? (
              <div className="space-y-3">
                {results.results.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                      </div>
                      {candidate.qualityScore && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{candidate.qualityScore}</span>
                          </div>
                          <p className="text-xs text-gray-500">Quality Score</p>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      {candidate.experienceLevel && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{candidate.experienceLevel} ({candidate.yearsExperience || 0} yrs)</span>
                        </div>
                      )}
                      {candidate.availability && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">Available {candidate.availability}</span>
                        </div>
                      )}
                      {candidate.interviewRating && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{candidate.interviewRating}/5 interview rating</span>
                        </div>
                      )}
                    </div>

                    {(candidate.skills.length > 0 || candidate.tags.length > 0) && (
                      <div className="space-y-2">
                        {candidate.skills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.map(skill => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {candidate.tags.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Tags</p>
                            <div className="flex flex-wrap gap-1">
                              {candidate.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  className="text-xs bg-purple-100 text-purple-800"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No candidates match your criteria</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}