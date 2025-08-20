'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowUpRight, ArrowDownLeft, Trophy, Coins, Gamepad2, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface WalletDashboardProps {
  user: { id: string; email: string; username: string };
  onNavigate: (section: string) => void;
}

export function WalletDashboard({ user, onNavigate }: WalletDashboardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [gamingStats, setGamingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Load user profile
      const profileResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/user/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const { profile } = await profileResponse.json();
        setProfile(profile);
      }

      // Load transactions
      const transactionsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/transactions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionsResponse.ok) {
        const { transactions } = await transactionsResponse.json();
        setTransactions(transactions.slice(0, 5)); // Show only recent 5
      }

      // Load gaming stats
      const gamingResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/gaming/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (gamingResponse.ok) {
        const { gamingStats } = await gamingResponse.json();
        setGamingStats(gamingStats);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'win':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'loss':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'sent':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'received':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      case 'game_entry':
        return <Gamepad2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const formatTransactionDescription = (transaction: any) => {
    return transaction.description || 'Transaction';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p>Error loading profile data. Please try refreshing the page.</p>
        <Button onClick={loadUserData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/placeholder-avatar.png" />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1>Welcome back, {user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100">
          Pro Gamer
        </Badge>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                {profile.balance.toLocaleString()} GTC
              </div>
              <div className="flex gap-4 mt-2">
                <div className="text-green-200">
                  Wins: {gamingStats?.gamesWon || 0}
                </div>
                <div className="text-red-200">
                  Losses: {gamingStats?.gamesLost || 0}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onNavigate('send')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Send
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onNavigate('receive')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                Receive
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onNavigate('gaming')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Gamepad2 className="h-4 w-4 mr-1" />
                Gaming
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Games Won</p>
                <p className="text-2xl font-bold">{gamingStats?.gamesWon || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{gamingStats?.currentStreak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{(gamingStats?.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Start playing games to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium">
                        {formatTransactionDescription(transaction)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} GTC
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}