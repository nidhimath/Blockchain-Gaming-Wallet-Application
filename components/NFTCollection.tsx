'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Sword, Shield, User, Sparkles, TrendingUp, Eye } from 'lucide-react';

interface NFTCollectionProps {
  onBack: () => void;
}

export function NFTCollection({ onBack }: NFTCollectionProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Mock NFT data
  const nfts = [
    {
      id: '1',
      name: 'Dragon Slayer Sword',
      type: 'weapon',
      game: 'Fantasy Quest',
      rarity: 'legendary',
      image: '/placeholder-sword.png',
      value: 250,
      attributes: { damage: 95, durability: 100 }
    },
    {
      id: '2',
      name: 'Mystic Armor Set',
      type: 'armor',
      game: 'Fantasy Quest',
      rarity: 'epic',
      image: '/placeholder-armor.png',
      value: 180,
      attributes: { defense: 85, magic_resist: 70 }
    },
    {
      id: '3',
      name: 'Cyber Assassin',
      type: 'character',
      game: 'Future Wars',
      rarity: 'rare',
      image: '/placeholder-character.png',
      value: 320,
      attributes: { speed: 88, stealth: 92 }
    },
    {
      id: '4',
      name: 'Neon Racer Skin',
      type: 'skin',
      game: 'Speed Racing',
      rarity: 'common',
      image: '/placeholder-car.png',
      value: 45,
      attributes: { style: 'neon', boost: 5 }
    },
    {
      id: '5',
      name: 'Phoenix Wings',
      type: 'cosmetic',
      game: 'Sky Battles',
      rarity: 'legendary',
      image: '/placeholder-wings.png',
      value: 400,
      attributes: { glide_speed: 100, flame_effect: 'enabled' }
    },
    {
      id: '6',
      name: 'Plasma Rifle',
      type: 'weapon',
      game: 'Space Marines',
      rarity: 'epic',
      image: '/placeholder-rifle.png',
      value: 275,
      attributes: { damage: 88, range: 95 }
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'common': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return <Sword className="h-4 w-4" />;
      case 'armor': return <Shield className="h-4 w-4" />;
      case 'character': return <User className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const filteredNFTs = nfts.filter(nft => filter === 'all' || nft.type === filter);

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    switch (sortBy) {
      case 'value': return b.value - a.value;
      case 'name': return a.name.localeCompare(b.name);
      case 'rarity': 
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>← Back</Button>
          <h1>NFT Collection</h1>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100">
          {nfts.length} Items
        </Badge>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">{nfts.reduce((sum, nft) => sum + nft.value, 0)} GTC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Legendary</p>
                <p className="text-xl font-bold">{nfts.filter(n => n.rarity === 'legendary').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sword className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Weapons</p>
                <p className="text-xl font-bold">{nfts.filter(n => n.type === 'weapon').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Characters</p>
                <p className="text-xl font-bold">{nfts.filter(n => n.type === 'character').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={filter} onValueChange={setFilter} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="weapon">Weapons</TabsTrigger>
            <TabsTrigger value="armor">Armor</TabsTrigger>
            <TabsTrigger value="character">Characters</TabsTrigger>
            <TabsTrigger value="skin">Skins</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Added</SelectItem>
            <SelectItem value="value">Highest Value</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="rarity">Rarity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNFTs.map(nft => (
          <Card key={nft.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative">
              <ImageWithFallback 
                src={nft.image}
                alt={nft.name}
                className="w-full h-48 object-cover"
              />
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white ${getRarityColor(nft.rarity)}`}>
                {nft.rarity}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {nft.game}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{nft.name}</h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getTypeIcon(nft.type)}
                    {nft.type}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="font-bold">{nft.value} GTC</span>
                </div>
                
                {/* Attributes */}
                <div className="space-y-1">
                  {Object.entries(nft.attributes).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Trade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}