import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const steamId = searchParams.get('steamid')
  const apiKey = searchParams.get('key')

  if (!steamId || !apiKey) {
    return NextResponse.json(
      { error: 'Missing steamid or API key' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`,
      {
        headers: {
          'User-Agent': 'Esports Tournament Management',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Steam API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Steam user info' },
      { status: 500 }
    )
  }
}