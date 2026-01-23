import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export default function BoostBadge({ boostedUntil, className = "" }) {
  if (!boostedUntil) return null;
  
  const isActive = new Date(boostedUntil) > new Date();
  if (!isActive) return null;

  return (
    <Badge className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white ${className}`}>
      <Zap className="w-3 h-3 mr-1" />
      Boosted
    </Badge>
  );
}