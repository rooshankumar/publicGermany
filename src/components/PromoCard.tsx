import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PromoCardProps {
  title: string;
  description: string;
  onClose?: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ title, description, onClose }) => {
  return (
    <div className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:right-4">
      <Card className="max-w-sm mx-auto border-border/60 shadow-lg bg-card/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm">{title}</div>
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
              <div className="mt-3 flex items-center gap-2">
                <Button asChild size="sm" className="h-8 px-3">
                  <Link to="/services">Explore services</Link>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3" onClick={onClose}>Dismiss</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCard;
