import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, CheckCircle, Video } from 'lucide-react';
import { toast } from 'sonner';

export default function CandidateScheduler({ applicationId, candidateEmail, onScheduled }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery({
    queryKey: ['interview-availability', applicationId],
    queryFn: async () => {
      const response = await base44.functions.invoke('findCommonAvailability', {
        candidate_email: candidateEmail,
        interview_type: 'phone_screen'
      });
      return response.data;
    },
    enabled: !!applicationId && !!candidateEmail
  });

  const bookSlot = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const response = await base44.functions.invoke('bookInterviewSlot', {
        slot_id: selectedSlot.id,
        application_id: applicationId,
        candidate_notes: notes
      });

      if (response.data.success) {
        toast.success('Interview scheduled successfully!');
        setSelectedSlot(null);
        setNotes('');
        queryClient.invalidateQueries({ queryKey: ['interview-availability'] });
        if (onScheduled) onScheduled(response.data.interview);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to schedule interview');
    } finally {
      setBooking(false);
    }
  };

  const slotsByDate = availability?.slots_by_date || {};

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Your Interview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">Finding available times...</p>
            </div>
          ) : Object.keys(slotsByDate).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No available interview slots at the moment</p>
              <p className="text-sm mt-1">Please check back later</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select a convenient time for your interview. All times are in your local timezone.
              </p>
              
              {Object.entries(slotsByDate).map(([date, slots]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <div className="grid md:grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Clock className="w-4 h-4" />
                        {slot.start_time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}

              {selectedSlot && (
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Selected Time</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(selectedSlot.slot_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {selectedSlot.start_time} - {selectedSlot.end_time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Interviewer: {selectedSlot.recruiter_name}
                        </p>
                      </div>
                      <Badge>{selectedSlot.interview_type}</Badge>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Notes for Interviewer (Optional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requirements or topics you'd like to discuss..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedSlot(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={bookSlot}
                        disabled={booking}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                      >
                        {booking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Confirm Interview
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}