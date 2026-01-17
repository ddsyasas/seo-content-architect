import { NextRequest, NextResponse } from 'next/server';
import { addUserToBrevo } from '@/lib/brevo/client';

/**
 * Add a registered user to Brevo user list
 * This is called during signup - failures are silent to not block registration
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Add to Brevo user list
    const result = await addUserToBrevo(email.trim(), name.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'User added to Brevo',
      });
    }

    // Log error but still return success to not expose internal errors
    console.error('[Subscribe User] Brevo error:', result.error);
    return NextResponse.json({
      success: false,
      error: result.error,
    });
  } catch (error) {
    console.error('[Subscribe User] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
