import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from 'sonner';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AvailabilityManager({ user }) {
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00'
  });
  const queryClient = useQueryClient();

  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['availability', user.email],
    queryFn: () => base44.entities.RecruiterAvailability.filter({ recruiter_email: user.email })
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.RecruiterAvailability.create({
      ...data,
      recruiter_email: user.email,
      active: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success('Availability added!');
      setNewAvailability({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecruiterAvailability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success('Availability removed!');
    }
  });

  const handleAdd = () => {
    if (newAvailability.start_time >= newAvailability.end_time) {
      toast.error('End time must be after start time');
      return;
    }
    addMutation.mutate(newAvailability);
  };

  const sortedAvailability = [...availability].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Interview Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {sortedAvailability.length > 0 && (
              <div className="space-y-2">
                {sortedAvailability.map((avail) => (
                  <div key={avail.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{DAYS_OF_WEEK[avail.day_of_week]}</Badge>
                      <span className="text-sm text-gray-700">
                        {avail.start_time} - {avail.end_time}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(avail.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Add New Availability</h4>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  value={newAvailability.day_of_week.toString()}
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, day_of_week: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newAvailability.start_time}
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, start_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newAvailability.end_time}
                  onValueChange={(value) => setNewAvailability({ ...newAvailability, end_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full mt-3">
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Availability
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}