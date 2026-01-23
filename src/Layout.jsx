import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Target, User, LogOut, Menu, X, Shield,
  Home, Search, PlusCircle, Users, ChevronDown, Sparkles, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
      }
    };
    loadUser();
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navLinks = [
    { name: 'Discover', page: 'Discover', icon: Target, authRequired: true },
    { name: 'Search', page: 'Opportunities', icon: Search },
    { name: 'Matches', page: 'Matches', icon: Users, authRequired: true },
    { name: 'Career Match', page: 'CareerMatch', icon: Sparkles },
  ];

  const userLinks = user ? [
    { name: 'Create Opportunity', page: 'CreateOpportunity', icon: PlusCircle },
    { name: 'Applications', page: 'Applications', icon: ClipboardList },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">SkillsBridge</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                if (link.authRequired && !user) return null;
                return (
                  <Link key={link.page} to={createPageUrl(link.page)}>
                    <Button 
                      variant={currentPageName === link.page ? "secondary" : "ghost"}
                      className="gap-2"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </Button>
                  </Link>
                );
              })}
              {userLinks.map(link => (
                <Link key={link.page} to={createPageUrl(link.page)}>
                  <Button 
                    variant={currentPageName === link.page ? "secondary" : "ghost"}
                    className="gap-2"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600">
                          {getInitials(user.display_name || user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline font-medium">
                        {user.display_name || user.full_name?.split(' ')[0] || 'User'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="font-medium text-gray-900">
                        {user.display_name || user.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.verified_talent && (
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600">Verified</span>
                        </div>
                      )}
                    </div>
                    <Link to={createPageUrl('SkillPassport')}>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        Skill Passport
                      </DropdownMenuItem>
                    </Link>
                    <Link to={createPageUrl('Profile')}>
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link to={createPageUrl('Matches')}>
                      <DropdownMenuItem>
                        <Target className="w-4 h-4 mr-2" />
                        My Matches
                      </DropdownMenuItem>
                    </Link>
                    {user.role === 'admin' && (
                      <Link to={createPageUrl('Admin')}>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => base44.auth.logout()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => base44.auth.redirectToLogin()}
                >
                  Sign In
                </Button>
              )}

              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-white"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(link => {
                  if (link.authRequired && !user) return null;
                  return (
                    <Link 
                      key={link.page} 
                      to={createPageUrl(link.page)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button 
                        variant={currentPageName === link.page ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2"
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Button>
                    </Link>
                  );
                })}
                {userLinks.map(link => (
                  <Link 
                    key={link.page} 
                    to={createPageUrl(link.page)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button 
                      variant={currentPageName === link.page ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Onboarding Flow */}
      {user && <OnboardingFlow user={user} />}

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">SkillsBridge</span>
              </div>
              <p className="text-gray-600 max-w-md">
                Connecting verified talent with real opportunities through skill-based matching.
                No resumes, no spam, just results.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Platform</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Home')} className="block text-gray-600 hover:text-indigo-600">
                  Home
                </Link>
                <Link to={createPageUrl('Opportunities')} className="block text-gray-600 hover:text-indigo-600">
                  Opportunities
                </Link>
                {user && (
                  <Link to={createPageUrl('Matches')} className="block text-gray-600 hover:text-indigo-600">
                    My Matches
                  </Link>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-600 hover:text-indigo-600">How It Works</a>
                <a href="#" className="block text-gray-600 hover:text-indigo-600">Support</a>
                <a href="#" className="block text-gray-600 hover:text-indigo-600">Privacy</a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
            © {new Date().getFullYear()} SkillsBridge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}