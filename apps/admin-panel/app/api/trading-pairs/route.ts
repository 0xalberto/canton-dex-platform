import { NextRequest, NextResponse } from 'next/server';
import { TradingPair, TradingPairStatus } from '@/types';

// Mock data - Replace with actual database queries
const mockTradingPairs: TradingPair[] = [
  {
    id: 'pair-1',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    symbol: 'BTC/USD',
    status: TradingPairStatus.ACTIVE,
    minOrderSize: '0.0001',
    maxOrderSize: '100',
    priceIncrement: '0.01',
    quantityIncrement: '0.0001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pair-2',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    symbol: 'ETH/USD',
    status: TradingPairStatus.ACTIVE,
    minOrderSize: '0.001',
    maxOrderSize: '1000',
    priceIncrement: '0.01',
    quantityIncrement: '0.001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pair-3',
    baseAsset: 'ETH',
    quoteAsset: 'BTC',
    symbol: 'ETH/BTC',
    status: TradingPairStatus.ACTIVE,
    minOrderSize: '0.001',
    maxOrderSize: '1000',
    priceIncrement: '0.00001',
    quantityIncrement: '0.001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pair-4',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    symbol: 'SOL/USD',
    status: TradingPairStatus.INACTIVE,
    minOrderSize: '0.01',
    maxOrderSize: '10000',
    priceIncrement: '0.01',
    quantityIncrement: '0.01',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: mockTradingPairs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Validate and create trading pair
    const newPair: TradingPair = {
      id: `pair-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newPair,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
