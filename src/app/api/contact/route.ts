import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/brevo';

const HCAPTCHA_SECRET_KEY = process.env.HCAPTCHA_SECRET_KEY || '0x0000000000000000000000000000000000000000'; // Test key for development

async function verifyHCaptcha(token: string): Promise<boolean> {
    // Skip verification in development if using test keys
    if (HCAPTCHA_SECRET_KEY === '0x0000000000000000000000000000000000000000') {
        console.warn('Using hCaptcha test keys - skipping verification in development');
        return true;
    }

    try {
        const response = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${HCAPTCHA_SECRET_KEY}&response=${token}`,
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('hCaptcha verification error:', error);
        return false;
    }
}

export async function POST(request: Request) {
    try {
        const { name, email, subject, message, captchaToken } = await request.json();

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        // Validate captcha token
        if (!captchaToken) {
            return NextResponse.json(
                { error: 'Please complete the captcha verification' },
                { status: 400 }
            );
        }

        // Verify hCaptcha
        const isValidCaptcha = await verifyHCaptcha(captchaToken);
        if (!isValidCaptcha) {
            return NextResponse.json(
                { error: 'Captcha verification failed. Please try again.' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Send email to support
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
    </div>

    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 100px;">Name:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}" style="color: #4F46E5;">${email}</a></td>
            </tr>
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Subject:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${subject || 'No subject'}</td>
            </tr>
        </table>

        <div style="margin-top: 20px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            This message was sent from the SyncSEO contact form.
        </p>
    </div>
</body>
</html>
        `.trim();

        const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject || 'No subject'}

Message:
${message}

---
This message was sent from the SyncSEO contact form.
        `.trim();

        const result = await sendEmail({
            to: 'hi@syncseo.io',
            toName: 'SyncSEO Support',
            subject: `Contact Form: ${subject || 'New message from ' + name}`,
            htmlContent,
            textContent,
        });

        if (!result.success) {
            console.error('Failed to send contact email:', result.error);
            return NextResponse.json(
                { error: 'Failed to send message. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
