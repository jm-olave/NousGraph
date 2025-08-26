"use client"

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Upload, 
  Menu, 
  X 
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Classification',
    href: '/',
    description: 'Upload and classify medical papers',
    icon: Upload,
  },
  {
    title: 'Data Analysis',
    href: '/eda',
    description: 'Explore dataset insights and statistics',
    icon: BarChart3,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-nous-sage/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-nous-green/10 text-nous-navy border border-nous-green/20" 
                      : "text-nous-teal hover:text-nous-navy hover:bg-nous-cream/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Items */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-nous-green/10 text-nous-teal border-nous-sage">
              Beta v1.0
            </Badge>
            <div className="text-sm text-nous-navy hidden sm:block">
              <span className="font-semibold">Judge Portal</span>
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-nous-sage/20 pt-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-nous-green/10 text-nous-navy border border-nous-green/20" 
                        : "text-nous-teal hover:text-nous-navy hover:bg-nous-cream/50"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-nous-sage">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}