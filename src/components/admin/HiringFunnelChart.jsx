import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

export default function HiringFunnelChart({ data, conversionRates }) {
  const stages = [
    { label: 'Applications', value: data.applications, color: 'bg-blue-500' },
    { label: 'Screening', value: data.screening, color: 'bg-indigo-500' },
    { label: 'Interviews', value: data.interviews, color: 'bg-purple-500' },
    { label: 'Offers', value: data.offers, color: 'bg-pink-500' },
    { label: 'Hires', value: data.hires, color: 'bg-green-500' }
  ];

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Hiring Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{stage.label}</span>
                    <span className="text-sm text-gray-600">{stage.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`${stage.color} h-full rounded-full transition-all duration-500 flex items-center justify-center`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-white text-sm font-semibold">
                          {Math.round(percentage)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {conversionRates.application_to_interview.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Application → Interview</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {conversionRates.interview_to_offer.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Interview → Offer</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {conversionRates.offer_to_hire.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Offer → Hire</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}