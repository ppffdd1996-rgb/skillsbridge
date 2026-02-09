import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Loader2, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RecruiterSlotManager() {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me()
  });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['my-slots', user?.email],
    queryFn: () => base44.entities.InterviewSlot.filter({ 
      recruiter_email: user.email 
    }).then(slots => slots.sort((a, b) => 
      new Date(a.slot_date + 'T' + a.start_time) - new Date(b.slot_date + 'T' + b.start_time)
    )),
    enabled: !!user
  });

  const syncAvailability = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncRecruiterAvailability', {
        date_range_start: new Date().toISOString(),
        date_range_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (response.data.success) {
        toast.success(`Synced ${response.data.slots_created} new available slots`);
        queryClient.invalidateQueries({ queryKey: ['my-slots'] });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await base44.entities.InterviewSlot.delete(slotId);
      toast.success('Slot deleted');
      queryClient.invalidateQueries({ queryKey: ['my-slots'] });
    } catch (error) {
      toast.error('Failed to delete slot');
    }
  };

  const availableSlots = slots.filter(s => s.is_available);
  const bookedSlots = slots.filter(s => !s.is_available);

  // Group by date
  const slotsByDate = {};
  availableSlots.forEach(slot => {
    if (!slotsByDate[slot.slot_date]) {
      slotsByDate[slot.slot_date] = [];
    }
    slotsByDate[slot.slot_date].push(slot);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Interview Availability
            </CardTitle>
            <Button 
              onClick={syncAvailability} 
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync from Calendar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{availableSlots.length}</p>
              <p className="text-sm text-gray-600">Available Slots</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{bookedSlots.length}</p>
              <p className="text-sm text-gray-600">Booked Interviews</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{Object.keys(slotsByDate).length}</p>
              <p className="text-sm text-gray-600">Days with Slots</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No available slots</p>
              <p className="text-sm mt-1">Sync your calendar to create interview slots</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div key={date} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    {dateSlots.map(slot => (
                      <div 
                        key={slot.id}
                        className="flex items-center justify-between p-2 border rounded bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {slot.interview_type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteSlot(slot.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {bookedSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookedSlots.map(slot => (
                <div key={slot.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{slot.booked_by}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(slot.slot_date).toLocaleDateString()}
                        <Clock className="w-3 h-3 ml-2" />
                        {slot.start_time}
                      </div>
                    </div>
                    <Badge>{slot.interview_type}</Badge>
                  </div>
                  {slot.location && (
                    <a 
                      href={slot.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline mt-2 inline-block"
                    >
                      Join Meeting →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}