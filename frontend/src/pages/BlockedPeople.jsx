import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/components/ui/use-toast';
import { safetyApi } from '@/api/safety';
import { useUnits } from '@/lib/units';

export default function BlockedPeople() {
  const units = useUnits();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['blocked'],
    queryFn: () => safetyApi.listBlocked(),
  });
  const blocked = data?.blocked || [];

  const unblock = useMutation({
    mutationFn: (userId) => safetyApi.unblock(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocked'] }),
    onError: () => toast({ variant: 'destructive', title: "Couldn't unblock", description: 'Please try again.' }),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 h-14 box-content pt-safe flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Blocked people</h1>
      </div>

      <div className="p-4 space-y-3 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground px-1">
          People you block can't see you, like you or message you, and you won't see them.
          Unblocking lets you see each other in Discover again, but an old match doesn't come back.
        </p>

        {isLoading ? (
          <div className="h-16 rounded-2xl bg-secondary animate-pulse" />
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Ban className="w-6 h-6" />
            <p className="text-sm">You haven't blocked anyone.</p>
          </div>
        ) : blocked.map(person => (
          <div key={person.id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50">
            <div>
              <p className="text-sm font-medium">{person.username || 'Deleted account'}</p>
              <p className="text-xs text-muted-foreground">Blocked {units.date(person.blocked_at)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={unblock.isPending && unblock.variables === person.id}
              onClick={() => unblock.mutate(person.id)}
            >
              Unblock
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
