import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Loader2, CheckCircle, Video } from "lucide-react";
import { toast } from 'sonner';

export default function InterviewScheduler({ application, recruiter, onClose, onScheduled }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scheduling, setScheduling] = useState(false);

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['available-slots', recruiter.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateAvailableSlots', {
        recruiter_email: recruiter.email,
        days_ahead: 14
      });
      return response.data;
    }
  });

  const scheduleInterview = async () => {
    if (!selectedSlot) return;

    setScheduling(true);
    try {
      await base44.functions.invoke('scheduleInterview', {
        application_id: application.id,
        recruiter_email: recruiter.email,
        scheduled_time: selectedSlot.start_time,
        duration_minutes: 60
      });
      toast.success('Interview scheduled successfully!');
      if (onScheduled) onScheduled();
      onClose();
    } catch (error) {
      toast.error('Failed to schedule interview');
      console.error(error);
    } finally {
      setScheduling(false);
    }
  };

  const slots = slotsData?.slots || [];
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Schedule Interview: {application.applicant_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : slots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No available slots</p>
                <p className="text-sm text-gray-500">The recruiter hasn't set their availability yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <h3 className="font-semibold text-gray-900 mb-3">{date}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {dateSlots.map((slot, idx) => {
                        const startTime = new Date(slot.start_time);
                        const timeStr = startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedSlot?.start_time === slot.start_time
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{timeStr}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedSlot && (
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Selected Time</h4>
                        <p className="text-gray-700 mb-1">{selectedSlot.display}</p>
                        <p className="text-sm text-gray-600">Duration: 60 minutes</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                          <Video className="w-4 h-4" />
                          Video interview link will be sent via email
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={scheduleInterview}
                  disabled={!selectedSlot || scheduling}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {scheduling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Confirm & Send Invites'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}