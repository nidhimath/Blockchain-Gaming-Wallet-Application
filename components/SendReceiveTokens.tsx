'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ArrowUpRight, ArrowDownLeft, Copy, QrCode, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SendReceiveTokensProps {
  activeSection: string;
  onBack: () => void;
}

export function SendReceiveTokens({ activeSection, onBack }: SendReceiveTokensProps) {
  const [sendForm, setSendForm] = useState({
    recipient: '',
    amount: '',
    note: '',
    chain: 'ethereum'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  const userAddress = '0x742d35Cc3Bf21f1639BA4078D64B5C3e1CbC49a6';

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/user/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { profile } = await response.json();
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.recipient || !sendForm.amount || !profile) return;
    
    const amount = parseFloat(sendForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > profile.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ceb000bc/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientAddress: sendForm.recipient,
          amount: amount,
          note: sendForm.note
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully sent ${amount} GTC to ${sendForm.recipient}`);
        setProfile(prev => ({ ...prev, balance: data.balance }));
        setSendForm({ recipient: '', amount: '', note: '', chain: 'ethereum' });
      } else {
        toast.error(data.error || 'Failed to send tokens');
      }
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error('Failed to send tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(userAddress);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = [10, 50, 100, 250, 500];
  const chains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' }
  ];

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (activeSection === 'send') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>← Back</Button>
          <h1 className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Send Tokens
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send GTC Tokens</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Available Balance:</span>
              <Badge variant="secondary">
                {profile ? profile.balance.toLocaleString() : '0'} GTC
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chain">Blockchain Network</Label>
                <Select value={sendForm.chain} onValueChange={(value) => setSendForm(prev => ({ ...prev, chain: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map(chain => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name} ({chain.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address or Username</Label>
                <Input
                  id="recipient"
                  placeholder="0x742d35... or @username"
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (GTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={profile?.balance || 0}
                  value={sendForm.amount}
                  onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSendForm(prev => ({ ...prev, amount: amount.toString() }))}
                      disabled={!profile || amount > profile.balance}
                    >
                      {amount} GTC
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="What's this payment for?"
                  value={sendForm.note}
                  onChange={(e) => setSendForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !profile || parseFloat(sendForm.amount || '0') > profile.balance}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Send ${sendForm.amount || '0'} GTC`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <h1 className="flex items-center gap-2">
          <ArrowDownLeft className="h-5 w-5" />
          Receive Tokens
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Wallet Address</CardTitle>
          <p className="text-sm text-muted-foreground">Share this address to receive GTC tokens</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="flex gap-2">
              <Input value={userAddress} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyAddress}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Show QR Code
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
              Copy Address
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Chain Support</CardTitle>
          <p className="text-sm text-muted-foreground">Your wallet supports multiple blockchain networks</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chains.map(chain => (
              <div key={chain.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-sm text-muted-foreground">Native token: {chain.symbol}</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}