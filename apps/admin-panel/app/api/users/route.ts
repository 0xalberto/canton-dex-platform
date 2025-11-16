import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, UserStatus, KYCStatus } from '@/types';

// Mock data - Replace with actual database queries
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'alice',
    role: UserRole.TRADER,
    status: UserStatus.ACTIVE,
    kycStatus: KYCStatus.APPROVED,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-01-20T15:30:00Z',
    partyId: 'party::alice::123',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    username: 'bob',
    role: UserRole.TRADER,
    status: UserStatus.ACTIVE,
    kycStatus: KYCStatus.APPROVED,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    lastLogin: '2024-01-21T09:15:00Z',
    partyId: 'party::bob::456',
  },
  {
    id: 'user-3',
    email: 'charlie@example.com',
    username: 'charlie',
    role: UserRole.TRADER,
    status: UserStatus.PENDING,
    kycStatus: KYCStatus.PENDING,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
  {
    id: 'user-4',
    email: 'compliance@cantondex.com',
    username: 'compliance',
    role: UserRole.COMPLIANCE,
    status: UserStatus.ACTIVE,
    kycStatus: KYCStatus.APPROVED,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    lastLogin: '2024-01-21T11:00:00Z',
    partyId: 'party::compliance::789',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    let filteredUsers = mockUsers;

    if (search) {
      filteredUsers = mockUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = filteredUsers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        data: paginatedUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
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

    // TODO: Validate and create user
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newUser,
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
