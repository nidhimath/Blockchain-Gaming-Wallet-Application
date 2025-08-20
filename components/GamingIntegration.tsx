'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Gamepad2, 
  Trophy, 
  Target, 
  Zap, 
  Users, 
  Clock, 
  Play, 
  Pause,
  DollarSign,
  TrendingUp,
  Star,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GamingIntegrationProps {
  onBack: () => void;
}

export function GamingIntegration({ onBack }: GamingIntegrationProps) {
  const [activeGames, setActiveGames] = useState<string[]>([]);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  const availableGames = [
    {
      id: 'battle-royale',
      name: 'Battle Royale Arena',
      description: 'Last player standing wins the pot',
      entryFee: 50,
      maxPayout: 500,
      players: 12,
      maxPlayers: 20,
      difficulty: 'Hard',
      image: '/placeholder-battle.png'
    },
    {
      id: 'racing',
      name: 'Speed Racing Circuit',
      description: 'First to finish wins',
      entryFee: 25,
      maxPayout: 200,
      players: 8,
      maxPlayers: 10,
      difficulty: 'Medium',
      image: '/placeholder-racing.png'
    },
    {
      id: 'strategy',
      name: 'Tower Defense Master',
      description: 'Defend your base the longest',
      entryFee: 30,
      maxPayout: 180,
      players: 6,
      maxPlayers: 8,
      difficulty: 'Easy',
      image: '/placeholder-strategy.png'
    },
    {
      id: 'puzzle',
      name: 'Mind Bender Puzzles',
      description: 'Solve puzzles faster than opponents',
      entryFee: 15,
      maxPayout: 90,
      players: 4,
      maxPlayers: 6,
      difficulty: 'Easy',
      image: '/placeholder-puzzle.png'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      // Load transaction history (filter for games)
      const transactionsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/transactions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionsResponse.ok) {
        const { transactions } = await transactionsResponse.json();
        const gameTransactions = transactions.filter((t: any) => 
          t.type === 'win' || t.type === 'loss' || t.type === 'game_entry'
        );
        setGameHistory(gameTransactions);
      }

      // Load leaderboard
      const leaderboardResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (leaderboardResponse.ok) {
        const { leaderboard } = await leaderboardResponse.json();
        setLeaderboard(leaderboard);
      }

    } catch (error) {
      console.error('Error loading gaming data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    const game = availableGames.find(g => g.id === gameId);
    if (!game) return;

    if (profile && profile.balance < game.entryFee) {
      toast.error('Insufficient balance to join this game');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Join game on server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/gaming/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId,
          gameName: game.name,
          entryFee: game.entryFee
        })
      });

      if (response.ok) {
        const { balance } = await response.json();
        setProfile(prev => ({ ...prev, balance }));
        setActiveGames(prev => [...prev, gameId]);
        toast.success(`Joined ${game.name}! Entry fee: ${game.entryFee} GTC`);

        // Simulate game completion after 10 seconds
        setTimeout(() => {
          completeGame(gameId, game);
        }, 10000);
      } else {
        const { error } = await response.json();
        toast.error(error || 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
    }
  };

  const completeGame = async (gameId: string, game: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const isWin = Math.random() > 0.4; // 60% win rate for demo
      const amount = isWin ? 
        Math.floor(Math.random() * (game.maxPayout - game.entryFee)) + game.entryFee :
        -game.entryFee;
      
      const opponent = 'Player' + Math.floor(Math.random() * 999);
      const duration = Math.floor(Math.random() * 20 + 5) + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0');

      // Complete game on server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/gaming/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId,
          gameName: game.name,
          result: isWin ? 'win' : 'loss',
          amount,
          opponent,
          duration
        })
      });

      if (response.ok) {
        const { balance, transaction } = await response.json();
        setProfile(prev => ({ ...prev, balance }));
        setGameHistory(prev => [transaction, ...prev]);
        setActiveGames(prev => prev.filter(id => id !== gameId));
        
        if (isWin) {
          toast.success(`🎉 You won ${amount} GTC in ${game.name}!`);
        } else {
          toast.error(`😔 You lost ${Math.abs(amount)} GTC in ${game.name}`);
        }
      }
    } catch (error) {
      console.error('Error completing game:', error);
      setActiveGames(prev => prev.filter(id => id !== gameId));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500 bg-green-50';
      case 'Medium': return 'text-yellow-500 bg-yellow-50';
      case 'Hard': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <h1 className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Gaming Platform
        </h1>
        {profile && (
          <Badge variant="secondary">
            Balance: {profile.balance.toLocaleString()} GTC
          </Badge>
        )}
      </div>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="games">Available Games</TabsTrigger>
          <TabsTrigger value="active">
            Active Games 
            {activeGames.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeGames.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Game History</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableGames.map(game => (
              <Card key={game.id} className="overflow-hidden">
                <div className="relative">
                  <ImageWithFallback
                    src={game.image}
                    alt={game.name}
                    className="w-full h-32 object-cover"
                  />
                  <Badge 
                    className={`absolute top-2 right-2 ${getDifficultyColor(game.difficulty)}`}
                  >
                    {game.difficulty}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium">{game.name}</h3>
                      <p className="text-sm text-muted-foreground">{game.description}</p>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Fee</span>
                      <span className="font-medium">{game.entryFee} GTC</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Payout</span>
                      <span className="font-medium text-green-600">{game.maxPayout} GTC</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Players</span>
                        <span>{game.players}/{game.maxPlayers}</span>
                      </div>
                      <Progress value={(game.players / game.maxPlayers) * 100} className="h-2" />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleJoinGame(game.id)}
                      disabled={activeGames.includes(game.id) || (profile && profile.balance < game.entryFee)}
                    >
                      {activeGames.includes(game.id) ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Playing...
                        </>
                      ) : profile && profile.balance < game.entryFee ? (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Insufficient Balance
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Join Game
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeGames.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3>No Active Games</h3>
                <p className="text-muted-foreground">Join a game to start playing!</p>
              </CardContent>
            </Card>
          ) : (
            activeGames.map(gameId => {
              const game = availableGames.find(g => g.id === gameId);
              return (
                <Card key={gameId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Gamepad2 className="h-8 w-8 text-blue-500" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-medium">{game?.name}</h3>
                          <p className="text-sm text-muted-foreground">Game in progress...</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {gameHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3>No Game History</h3>
                <p className="text-muted-foreground">Start playing games to build your history!</p>
              </CardContent>
            </Card>
          ) : (
            gameHistory.map(game => (
              <Card key={game.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {game.type === 'win' ? (
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      ) : game.type === 'loss' ? (
                        <Target className="h-8 w-8 text-red-500" />
                      ) : (
                        <Gamepad2 className="h-8 w-8 text-purple-500" />
                      )}
                      <div>
                        <h3 className="font-medium">{game.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(game.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        game.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {game.amount > 0 ? '+' : ''}{game.amount} GTC
                      </div>
                      {game.type !== 'game_entry' && (
                        <Badge variant={game.type === 'win' ? 'default' : 'destructive'}>
                          {game.type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Gamers This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map(player => (
                  <div key={player.rank} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        player.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        player.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        player.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {player.rank}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{player.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{player.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.gamesWon} games won
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{player.winnings.toLocaleString()} GTC</div>
                      {player.rank <= 3 && (
                        <Star className="h-4 w-4 text-yellow-500 inline" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}