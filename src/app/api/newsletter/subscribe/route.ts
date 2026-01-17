import { NextRequest, NextResponse } from 'next/server';
import { addNewsletterSubscriber } from '@/lib/brevo/client';

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Add to Brevo newsletter list
    const result = await addNewsletterSubscriber(email.trim(), name.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
      });
    }

    // Handle specific Brevo errors
    if (result.error?.includes('Contact already exist')) {
      return NextResponse.json({
        success: true,
        message: 'You\'re already subscribed!',
      });
    }

    return NextResponse.json(
      { error: result.error || 'Failed to subscribe' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Newsletter Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
