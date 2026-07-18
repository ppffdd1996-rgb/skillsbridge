import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';

const COMPETITIVENESS_CONFIG = {
  below_market: { label: 'Below Market', color: 'red', icon: TrendingDown },
  at_market: { label: 'At Market', color: 'blue', icon: CheckCircle2 },
  above_market: { label: 'Above Market', color: 'green', icon: TrendingUp }
};

const RECOMMENDATION_CONFIG = {
  increase_offer: { label: 'Consider increasing the offer', color: 'amber' },
  competitive: { label: 'Offer is competitive', color: 'green' },
  consider_reduction: { label: 'Offer may exceed market', color: 'blue' }
};

export default function SalaryBenchmarkDialog({ offer }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runBenchmark = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('manageOffer', {
        action: 'benchmark',
        job_title: offer.job_title,
        salary: offer.salary,
        location
      });
      setResult(res.data);
    } catch (e) {
      toast({ title: 'Benchmark failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => (typeof n === 'number' ? '$' + Math.round(n).toLocaleString() : '—');

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <BarChart3 className="w-3.5 h-3.5" /> Benchmark
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Salary Benchmark</DialogTitle>
          <DialogDescription>
            Compare {offer.candidate_name}'s offer for <strong>{offer.job_title}</strong> ({offer.salary || 'no salary set'}) against industry market data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Location (optional, improves accuracy)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
          </div>

          {!result && !loading && (
            <Button onClick={runBenchmark} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
              <TrendingUp className="w-4 h-4" /> Analyze Market Competitiveness
            </Button>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm text-gray-600">Researching market salary data…</p>
            </div>
          )}

          {result?.analysis && (
            <div className="space-y-4">
              {(() => {
                const a = result.analysis;
                const comp = COMPETITIVENESS_CONFIG[a.competitiveness] || COMPETITIVENESS_CONFIG.at_market;
                const rec = RECOMMENDATION_CONFIG[a.recommendation];
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge className={`bg-${comp.color}-100 text-${comp.color}-800 gap-1`}>
                        <comp.icon className="w-3.5 h-3.5" /> {comp.label}
                      </Badge>
                      <span className="text-sm text-gray-600">Offer at <strong>{a.percentile ?? '—'}th</strong> percentile</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-500">Market Low</p>
                        <p className="font-semibold text-gray-900">{fmt(a.market_low)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                        <p className="text-xs text-indigo-600">Median</p>
                        <p className="font-semibold text-indigo-900">{fmt(a.market_median)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-xs text-gray-500">Market High</p>
                        <p className="font-semibold text-gray-900">{fmt(a.market_high)}</p>
                      </div>
                    </div>

                    {rec && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg bg-${rec.color}-50 border border-${rec.color}-100`}>
                        <AlertTriangle className={`w-4 h-4 text-${rec.color}-600 mt-0.5 flex-shrink-0`} />
                        <p className={`text-sm text-${rec.color}-800`}>{rec.label}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Analysis</p>
                      <p className="text-sm text-gray-600">{a.summary}</p>
                    </div>

                    {Array.isArray(a.similar_roles) && a.similar_roles.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Comparable Roles</p>
                        <div className="space-y-1">
                          {a.similar_roles.map((r, i) => (
                            <div key={i} className="flex justify-between text-sm py-1.5 px-2 bg-gray-50 rounded">
                              <span className="text-gray-700">{r.title}</span>
                              <span className="font-medium text-gray-900">{fmt(r.median_salary)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {result && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResult(null); }}>Re-run</Button>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}