import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Eye, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BoostStats({ opportunities, onBoostOpportunity }) {
  const boostedOpportunities = opportunities?.filter(opp => {
    const boosted = opp.boosted_until && new Date(opp.boosted_until) > new Date();
    return boosted;
  }) || [];

  const totalImpressions = boostedOpportunities.reduce((sum, opp) => sum + (opp.boost_impressions || 0), 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Boost Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {boostedOpportunities.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Active Boosts</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{boostedOpportunities.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Views</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalImpressions}</p>
              </div>
            </div>

            <div className="space-y-2">
              {boostedOpportunities.map((opp) => (
                <div key={opp.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">{opp.title}</p>
                      <Badge className="bg-yellow-500 text-white text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Boosted
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {opp.boost_impressions || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Until {new Date(opp.boosted_until).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No active boosts</p>
            <p className="text-sm text-gray-500 mb-4">
              Boost your opportunities to get 3-5x more visibility
            </p>
            {opportunities?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => onBoostOpportunity(opportunities[0])}
                className="gap-2"
              >
                <Zap className="w-4 h-4" />
                Boost an Opportunity
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}