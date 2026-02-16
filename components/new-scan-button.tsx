// components/NewScanButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Globe, Smartphone, Code, FileCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function NewScanButton() {
  const [scanning, setScanning] = useState(false);

  const startScan = (type: string, target: string) => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      toast.success(`${type} scan started — 47 seconds remaining`, {
        description: `Target: ${target}`,
      });
    }, 1200);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent hover:brightness-110">
          <Plus className="w-5 h-5" />
          New Scan
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={() => {/* open repo modal */}}>
          <Code className="mr-2" /> Code Repository
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          const url = prompt('Enter website URL (e.g. https://yoursite.com)');
          if (url) startScan('DAST Website', url);
        }}>
          <Globe className="mr-2" /> Website (DAST)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          const url = prompt('Enter web/mobile app URL (e.g. https://app.yoursite.com)');
          if (url) startScan('Web App', url);
        }}>
          <Smartphone className="mr-2" /> Web / Mobile App
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {/* open contract modal */}}>
          <FileCode className="mr-2" /> Smart Contract
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}