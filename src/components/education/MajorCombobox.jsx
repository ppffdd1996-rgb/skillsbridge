import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MajorCombobox({ collegeName, collegePrograms = [], value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!collegeName || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `For ${collegeName}, list the most popular and relevant majors/fields of study that match or relate to "${query}". 
          
Known programs: ${collegePrograms.join(', ')}

Return 8-10 specific major names that this university actually offers. Be accurate and specific to what this institution is known for.`,
          response_json_schema: {
            type: "object",
            properties: {
              majors: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        });
        setSuggestions(response.majors || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Major fetch error:', error);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, collegeName]);

  const handleSelect = (major) => {
    onChange(major);
    setQuery(major);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={collegeName ? "Start typing major name..." : "Select college first"}
          disabled={!collegeName}
          className="pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto shadow-xl">
          <div className="divide-y">
            {suggestions.map((major, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(major)}
                className="w-full p-3 hover:bg-indigo-50 transition-colors text-left flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="text-sm text-gray-900">{major}</span>
                {value === major && <Check className="w-4 h-4 text-green-600 ml-auto" />}
              </button>
            ))}
          </div>
          <div className="p-2 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowSuggestions(false)}
            >
              Close
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}