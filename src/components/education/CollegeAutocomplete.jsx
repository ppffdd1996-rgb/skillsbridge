import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, GraduationCap, MapPin, Calendar } from "lucide-react";

export default function CollegeAutocomplete({ value, onChange, onAutofill }) {
  const [query, setQuery] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Given the partial college name "${query}", provide autocomplete suggestions with detailed information.
          
Return the top 3 most likely matches with:
- Full official college/university name
- Location (city, state/country)
- Type (e.g., Public University, Private College, Community College)
- Notable programs/majors
- Brief description (1 sentence)

Be accurate with real institutions. If it's too vague to determine, provide the most famous institutions starting with those letters.`,
          response_json_schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    location: { type: "string" },
                    type: { type: "string" },
                    programs: {
                      type: "array",
                      items: { type: "string" }
                    },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        });
        setSuggestions(response.suggestions);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (suggestion) => {
    onChange(suggestion.name);
    if (onAutofill) {
      onAutofill({
        college_name: suggestion.name,
        college_location: suggestion.location,
        college_type: suggestion.type,
        college_programs: suggestion.programs,
      });
    }
    setSuggestions(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Start typing college name..."
          className="pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto shadow-xl">
          <div className="divide-y">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(suggestion)}
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{suggestion.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>{suggestion.location}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-indigo-600">{suggestion.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                    {suggestion.programs?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {suggestion.programs.slice(0, 3).map((program, pIdx) => (
                          <span
                            key={pIdx}
                            className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded"
                          >
                            {program}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}