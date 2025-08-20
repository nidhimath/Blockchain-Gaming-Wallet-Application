import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Hono } from "npm:hono@3.11.11"
import { logger } from "npm:hono@3.11.11/logger"
import { cors } from "npm:hono@3.11.11/cors"
import { createClient } from "npm:@supabase/supabase-js@2.39.1"
import * as kv from "./kv_store.tsx"

const app = new Hono()

app.use('*', logger(console.log))
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
)

// User signup route
app.post('/make-server-ceb000bc/auth/signup', async (c) => {
  try {
    const { email, password, username } = await c.req.json()
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (authError) {
      console.log('Authentication error during signup:', authError)
      return c.json({ error: 'Failed to create user account' }, 400)
    }

    const userId = authData.user.id

    // Initialize user profile in KV store
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      username,
      balance: 1000, // Starting balance
      totalWins: 0,
      totalLosses: 0,
      gamesPlayed: 0,
      createdAt: new Date().toISOString()
    })

    // Initialize empty transaction history
    await kv.set(`transactions:${userId}`, [])
    
    // Initialize empty NFT collection
    await kv.set(`nfts:${userId}`, [])

    // Initialize gaming stats
    await kv.set(`gaming:${userId}`, {
      gamesWon: 0,
      gamesLost: 0,
      totalEarnings: 0,
      totalLosses: 0,
      currentStreak: 0,
      bestStreak: 0
    })

    return c.json({
      user: {
        id: userId,
        email,
        username
      }
    })
  } catch (error) {
    console.log('Signup error:', error)
    return c.json({ error: 'Internal server error during signup' }, 500)
  }
})

// Get user profile
app.get('/make-server-ceb000bc/user/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const profile = await kv.get(`user:${user.id}`)
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404)
    }

    return c.json({ profile })
  } catch (error) {
    console.log('Error fetching user profile:', error)
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Update user balance
app.post('/make-server-ceb000bc/user/balance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { amount, type, description } = await c.req.json()
    
    const profile = await kv.get(`user:${user.id}`)
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404)
    }

    // Update balance
    const newBalance = profile.balance + amount
    if (newBalance < 0) {
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    profile.balance = newBalance
    await kv.set(`user:${user.id}`, profile)

    // Add transaction record
    const transactions = await kv.get(`transactions:${user.id}`) || []
    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount,
      description,
      timestamp: new Date().toISOString(),
      balance: newBalance
    }
    
    transactions.unshift(newTransaction) // Add to beginning
    if (transactions.length > 100) transactions.pop() // Keep only last 100
    
    await kv.set(`transactions:${user.id}`, transactions)

    return c.json({ 
      balance: newBalance,
      transaction: newTransaction
    })
  } catch (error) {
    console.log('Error updating balance:', error)
    return c.json({ error: 'Failed to update balance' }, 500)
  }
})

// Get transaction history
app.get('/make-server-ceb000bc/transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const transactions = await kv.get(`transactions:${user.id}`) || []
    return c.json({ transactions })
  } catch (error) {
    console.log('Error fetching transactions:', error)
    return c.json({ error: 'Failed to fetch transactions' }, 500)
  }
})

// Send tokens to another user
app.post('/make-server-ceb000bc/transfer', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { recipientAddress, amount, note } = await c.req.json()
    
    // Get sender profile
    const senderProfile = await kv.get(`user:${user.id}`)
    if (!senderProfile) {
      return c.json({ error: 'Sender profile not found' }, 404)
    }

    if (senderProfile.balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    // For demo purposes, we'll create a mock transfer
    // In a real app, you'd need to find the recipient by address/username
    
    // Update sender balance
    senderProfile.balance -= amount
    await kv.set(`user:${user.id}`, senderProfile)

    // Add transaction records
    const senderTransactions = await kv.get(`transactions:${user.id}`) || []
    const transferTransaction = {
      id: Date.now().toString(),
      type: 'sent',
      amount: -amount,
      description: `Sent to ${recipientAddress}${note ? ` - ${note}` : ''}`,
      timestamp: new Date().toISOString(),
      balance: senderProfile.balance
    }
    
    senderTransactions.unshift(transferTransaction)
    await kv.set(`transactions:${user.id}`, senderTransactions)

    return c.json({ 
      success: true,
      balance: senderProfile.balance,
      transaction: transferTransaction
    })
  } catch (error) {
    console.log('Error processing transfer:', error)
    return c.json({ error: 'Failed to process transfer' }, 500)
  }
})

// Join a game
app.post('/make-server-ceb000bc/gaming/join', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { gameId, gameName, entryFee } = await c.req.json()
    
    const profile = await kv.get(`user:${user.id}`)
    if (!profile || profile.balance < entryFee) {
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    // Deduct entry fee
    profile.balance -= entryFee
    await kv.set(`user:${user.id}`, profile)

    // Add transaction
    const transactions = await kv.get(`transactions:${user.id}`) || []
    transactions.unshift({
      id: Date.now().toString(),
      type: 'game_entry',
      amount: -entryFee,
      description: `Joined ${gameName}`,
      timestamp: new Date().toISOString(),
      balance: profile.balance
    })
    await kv.set(`transactions:${user.id}`, transactions)

    return c.json({ 
      success: true,
      balance: profile.balance,
      gameId 
    })
  } catch (error) {
    console.log('Error joining game:', error)
    return c.json({ error: 'Failed to join game' }, 500)
  }
})

// Complete a game (win/loss)
app.post('/make-server-ceb000bc/gaming/complete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { gameId, gameName, result, amount, opponent, duration } = await c.req.json()
    
    // Update user profile and balance
    const profile = await kv.get(`user:${user.id}`)
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404)
    }

    profile.balance += amount
    profile.gamesPlayed = (profile.gamesPlayed || 0) + 1
    
    if (result === 'win') {
      profile.totalWins = (profile.totalWins || 0) + 1
    } else {
      profile.totalLosses = (profile.totalLosses || 0) + 1
    }
    
    await kv.set(`user:${user.id}`, profile)

    // Update gaming stats
    const gamingStats = await kv.get(`gaming:${user.id}`) || {
      gamesWon: 0, gamesLost: 0, totalEarnings: 0, totalLosses: 0, currentStreak: 0, bestStreak: 0
    }
    
    if (result === 'win') {
      gamingStats.gamesWon += 1
      gamingStats.totalEarnings += amount
      gamingStats.currentStreak += 1
      gamingStats.bestStreak = Math.max(gamingStats.bestStreak, gamingStats.currentStreak)
    } else {
      gamingStats.gamesLost += 1
      gamingStats.totalLosses += Math.abs(amount)
      gamingStats.currentStreak = 0
    }
    
    await kv.set(`gaming:${user.id}`, gamingStats)

    // Add transaction
    const transactions = await kv.get(`transactions:${user.id}`) || []
    const gameTransaction = {
      id: Date.now().toString(),
      type: result,
      amount,
      description: `${result === 'win' ? 'Won' : 'Lost'} against ${opponent} in ${gameName}`,
      game: gameName,
      opponent,
      duration,
      timestamp: new Date().toISOString(),
      balance: profile.balance
    }
    
    transactions.unshift(gameTransaction)
    await kv.set(`transactions:${user.id}`, transactions)

    return c.json({ 
      success: true,
      balance: profile.balance,
      transaction: gameTransaction,
      gamingStats
    })
  } catch (error) {
    console.log('Error completing game:', error)
    return c.json({ error: 'Failed to complete game' }, 500)
  }
})

// Get gaming stats
app.get('/make-server-ceb000bc/gaming/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const gamingStats = await kv.get(`gaming:${user.id}`) || {
      gamesWon: 0, gamesLost: 0, totalEarnings: 0, totalLosses: 0, currentStreak: 0, bestStreak: 0
    }

    return c.json({ gamingStats })
  } catch (error) {
    console.log('Error fetching gaming stats:', error)
    return c.json({ error: 'Failed to fetch gaming stats' }, 500)
  }
})

// Get/Set NFT collection
app.get('/make-server-ceb000bc/nfts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const nfts = await kv.get(`nfts:${user.id}`) || []
    return c.json({ nfts })
  } catch (error) {
    console.log('Error fetching NFTs:', error)
    return c.json({ error: 'Failed to fetch NFTs' }, 500)
  }
})

app.post('/make-server-ceb000bc/nfts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { nft } = await c.req.json()
    
    const nfts = await kv.get(`nfts:${user.id}`) || []
    nfts.push({
      ...nft,
      id: Date.now().toString(),
      ownerId: user.id,
      acquiredAt: new Date().toISOString()
    })
    
    await kv.set(`nfts:${user.id}`, nfts)

    return c.json({ success: true, nfts })
  } catch (error) {
    console.log('Error adding NFT:', error)
    return c.json({ error: 'Failed to add NFT' }, 500)
  }
})

// Global leaderboard
app.get('/make-server-ceb000bc/leaderboard', async (c) => {
  try {
    // For demo purposes, we'll return mock data
    // In a real app, you'd query all users and sort by winnings
    const leaderboard = [
      { rank: 1, username: 'ProGamer123', winnings: 2847.32, gamesWon: 47 },
      { rank: 2, username: 'SkillzMaster', winnings: 2156.88, gamesWon: 38 },
      { rank: 3, username: 'GameChampion', winnings: 1923.45, gamesWon: 35 },
      { rank: 4, username: 'ElitePlayer', winnings: 1678.21, gamesWon: 31 },
      { rank: 5, username: 'VictorySeeker', winnings: 1445.67, gamesWon: 28 }
    ]

    return c.json({ leaderboard })
  } catch (error) {
    console.log('Error fetching leaderboard:', error)
    return c.json({ error: 'Failed to fetch leaderboard' }, 500)
  }
})

serve(app.fetch)