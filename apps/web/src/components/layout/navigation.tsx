'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Home, Search, User, PlusCircle, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/fragments', icon: Search },
  { name: 'Create', href: '/create', icon: PlusCircle },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'AI Insights', href: '/ai', icon: Brain },
  { name: 'Analytics', href: '/admin', icon: BarChart3 },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span className="font-bold">LLHE</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Share Your Story
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
