'use client';

import React, { useState, useEffect } from 'react';
import { AuthModal } from './components/AuthModal';
import { WalletDashboard } from './components/WalletDashboard';
import { SendReceiveTokens } from './components/SendReceiveTokens';
import { NFTCollection } from './components/NFTCollection';
import { GamingIntegration } from './components/GamingIntegration';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Wallet, LogOut, Moon, Sun, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';

interface User {
  id: string;
  email: string;
  username: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Fetch user profile
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const { profile } = await response.json();
          setUser({
            id: profile.id,
            email: profile.email,
            username: profile.username
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = (userData: User) => {
    setUser(userData);
    setActiveSection('dashboard');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveSection('dashboard');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading GameWallet...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo/Header */}
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Wallet className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                GameWallet
              </h1>
              <p className="text-muted-foreground mt-2">
                The ultimate blockchain gaming wallet where your wins and losses have real value
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-white/50 backdrop-blur p-4 rounded-lg border">
              <h3 className="font-medium mb-2">🎮 Gaming Integration</h3>
              <p className="text-sm text-muted-foreground">
                Connect with your favorite games and earn tokens
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur p-4 rounded-lg border">
              <h3 className="font-medium mb-2">💎 NFT Collection</h3>
              <p className="text-sm text-muted-foreground">
                Store and trade your gaming assets
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur p-4 rounded-lg border">
              <h3 className="font-medium mb-2">🔄 P2P Transfers</h3>
              <p className="text-sm text-muted-foreground">
                Send and receive tokens instantly
              </p>
            </div>
            <div className="bg-white/50 backdrop-blur p-4 rounded-lg border">
              <h3 className="font-medium mb-2">⛓️ Multi-Chain</h3>
              <p className="text-sm text-muted-foreground">
                Support for multiple blockchains
              </p>
            </div>
          </div>

          {/* Auth Button */}
          <AuthModal onAuthenticate={handleAuthenticate} />
          
          <p className="text-xs text-muted-foreground">
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">GameWallet</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Badge variant="secondary">{user.username}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeSection === 'dashboard' && (
          <WalletDashboard user={user} onNavigate={setActiveSection} />
        )}
        
        {(activeSection === 'send' || activeSection === 'receive') && (
          <SendReceiveTokens 
            activeSection={activeSection} 
            onBack={() => setActiveSection('dashboard')} 
          />
        )}
        
        {activeSection === 'nfts' && (
          <NFTCollection onBack={() => setActiveSection('dashboard')} />
        )}
        
        {activeSection === 'gaming' && (
          <GamingIntegration onBack={() => setActiveSection('dashboard')} />
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t md:hidden">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('dashboard')}
            className="flex-col gap-1 h-auto py-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Wallet</span>
          </Button>
          <Button
            variant={activeSection === 'gaming' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('gaming')}
            className="flex-col gap-1 h-auto py-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Gaming</span>
          </Button>
          <Button
            variant={activeSection === 'nfts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('nfts')}
            className="flex-col gap-1 h-auto py-2"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-xs">NFTs</span>
          </Button>
        </div>
      </nav>

      <Toaster />
    </div>
  );
}