import * as Brevo from '@getbrevo/brevo';

interface SendEmailParams {
    to: string;
    toName?: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}

export async function sendEmail({ to, toName, subject, htmlContent, textContent }: SendEmailParams) {
    if (!process.env.BREVO_API_KEY) {
        console.warn('BREVO_API_KEY not set, skipping email send');
        return { success: false, error: 'Email not configured' };
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();

    // Set API key using setApiKey method
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
        name: process.env.EMAIL_FROM_NAME || 'SyncSEO',
        email: process.env.EMAIL_FROM_ADDRESS || 'hi@syncseo.io',
    };

    sendSmtpEmail.to = [{ email: to, name: toName || to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    if (textContent) {
        sendSmtpEmail.textContent = textContent;
    }

    try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', result);
        return { success: true, messageId: result.body?.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: String(error) };
    }
}

export async function sendTeamInviteEmail({
    to,
    inviterName,
    projectName,
    role,
    inviteLink,
}: {
    to: string;
    inviterName: string;
    projectName: string;
    role: string;
    inviteLink: string;
}) {
    const roleDescriptions: Record<string, string> = {
        admin: 'Admin (can manage team and all projects)',
        editor: 'Editor (can create and edit content)',
        viewer: 'Viewer (read-only access)',
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited! 🎉</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong> as a <strong>${roleDescriptions[role] || role}</strong>.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accept Invitation
            </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 14px; color: #4F46E5; word-break: break-all;">
            ${inviteLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            This invitation will expire in 7 days.<br>
            If you didn't expect this invitation, you can safely ignore this email.
        </p>
    </div>
</body>
</html>
    `.trim();

    const textContent = `
You're Invited!

${inviterName} has invited you to collaborate on ${projectName} as a ${roleDescriptions[role] || role}.

Accept the invitation by visiting this link:
${inviteLink}

This invitation will expire in 7 days.
If you didn't expect this invitation, you can safely ignore this email.
    `.trim();

    return sendEmail({
        to,
        subject: `${inviterName} invited you to collaborate on ${projectName}`,
        htmlContent,
        textContent,
    });
}

export async function sendProjectAssignmentEmail({
    to,
    toName,
    ownerName,
    projectName,
    role,
    projectUrl,
}: {
    to: string;
    toName?: string;
    ownerName: string;
    projectName: string;
    role: string;
    projectUrl: string;
}) {
    const roleDescriptions: Record<string, string> = {
        admin: 'Admin (can manage team and all projects)',
        editor: 'Editor (can create and edit content)',
        viewer: 'Viewer (read-only access)',
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Project Access! 📁</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${toName || 'there'}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${ownerName}</strong> has given you access to <strong>${projectName}</strong> as a <strong>${roleDescriptions[role] || role}</strong>.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${projectUrl}" style="display: inline-block; background: #10B981; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Open Project
            </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
            You now have access to view ${role === 'viewer' ? '' : 'and edit '}the content in this project.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            You're receiving this email because you're a member of a team using SyncSEO.
        </p>
    </div>
</body>
</html>
    `.trim();

    const textContent = `
New Project Access!

Hi ${toName || 'there'}!

${ownerName} has given you access to ${projectName} as a ${roleDescriptions[role] || role}.

Open the project: ${projectUrl}

You now have access to view ${role === 'viewer' ? '' : 'and edit '}the content in this project.
    `.trim();

    return sendEmail({
        to,
        toName,
        subject: `You now have access to: ${projectName}`,
        htmlContent,
        textContent,
    });
}

// ===== SUBSCRIPTION EMAILS =====

export async function sendWelcomeSubscriptionEmail({
    to,
    toName,
    plan,
}: {
    to: string;
    toName?: string;
    plan: 'pro' | 'agency';
}) {
    const planDetails = {
        pro: {
            name: 'Pro',
            color: '#4F46E5',
            features: [
                '5 projects',
                '100 articles per project',
                '200 canvas nodes per project',
                '3 team members per project',
                'Full SEO analysis',
                'Export to PNG & CSV',
            ],
        },
        agency: {
            name: 'Agency',
            color: '#7C3AED',
            features: [
                'Unlimited projects',
                'Unlimited articles & nodes',
                '10 team members per project',
                'Full SEO analysis with history',
                'Priority support',
                'API access (coming soon)',
            ],
        },
    };

    const details = planDetails[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, ${details.color} 0%, #7C3AED 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${details.name}! 🎉</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${toName || 'there'}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for upgrading to <strong>${details.name}</strong>! Your subscription is now active and you have access to all the premium features.
        </p>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="font-weight: 600; margin-bottom: 10px; color: ${details.color};">What's included in your ${details.name} plan:</p>
            <ul style="margin: 0; padding-left: 20px;">
                ${details.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard" style="display: inline-block; background: ${details.color}; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Go to Dashboard
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Have questions? Reply to this email or contact us at support@syncseo.io
        </p>
    </div>
</body>
</html>
    `.trim();

    const textContent = `
Welcome to ${details.name}!

Hi ${toName || 'there'}!

Thank you for upgrading to ${details.name}! Your subscription is now active.

What's included:
${details.features.map(f => `• ${f}`).join('\n')}

Go to your dashboard: ${appUrl}/dashboard

Have questions? Contact us at support@syncseo.io
    `.trim();

    return sendEmail({
        to,
        toName,
        subject: `Welcome to SyncSEO ${details.name}! 🎉`,
        htmlContent,
        textContent,
    });
}

export async function sendSubscriptionUpdatedEmail({
    to,
    toName,
    fromPlan,
    toPlan,
    effectiveDate,
}: {
    to: string;
    toName?: string;
    fromPlan: string;
    toPlan: string;
    effectiveDate?: string;
}) {
    const isUpgrade = toPlan === 'agency' || (toPlan === 'pro' && fromPlan === 'free');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${isUpgrade ? '#10B981' : '#6B7280'}; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Subscription ${isUpgrade ? 'Upgraded' : 'Changed'}</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${toName || 'there'}!
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            Your subscription has been changed from <strong>${fromPlan}</strong> to <strong>${toPlan}</strong>.
            ${effectiveDate ? `This change will take effect on ${effectiveDate}.` : 'This change is now active.'}
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/settings/subscription" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Subscription
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            If you didn't make this change, please contact us immediately at support@syncseo.io
        </p>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({
        to,
        toName,
        subject: `Your SyncSEO subscription has been ${isUpgrade ? 'upgraded' : 'updated'}`,
        htmlContent,
    });
}

export async function sendSubscriptionCancelledEmail({
    to,
    toName,
    endDate,
}: {
    to: string;
    toName?: string;
    endDate: string;
}) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #EF4444; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Cancelled</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${toName || 'there'},
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            We're sorry to see you go! Your subscription has been cancelled and will end on <strong>${endDate}</strong>.
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            You'll continue to have access to your premium features until then. After that, your account will be downgraded to the Free plan.
        </p>
        
        <div style="background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
                <strong>Note:</strong> Your existing projects and content will NOT be deleted. You just won't be able to create new content beyond free plan limits.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/pricing" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reactivate Subscription
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            We'd love to hear your feedback. Reply to this email to let us know how we can improve.
        </p>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({
        to,
        toName,
        subject: `Your SyncSEO subscription has been cancelled`,
        htmlContent,
    });
}

export async function sendPaymentFailedEmail({
    to,
    toName,
    retryDate,
}: {
    to: string;
    toName?: string;
    retryDate?: string;
}) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncseo.io';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #F59E0B; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Failed ⚠️</h1>
    </div>
    
    <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${toName || 'there'},
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
            We couldn't process your latest payment for SyncSEO. This might be due to an expired card or insufficient funds.
        </p>
        
        ${retryDate ? `
        <p style="font-size: 16px; margin-bottom: 20px;">
            We'll automatically retry the payment on <strong>${retryDate}</strong>.
        </p>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/settings/billing" style="display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Update Payment Method
            </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            If your payment continues to fail, your subscription may be cancelled and your account will be downgraded to the Free plan.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Need help? Contact us at support@syncseo.io
        </p>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({
        to,
        toName,
        subject: `Action required: Payment failed for SyncSEO`,
        htmlContent,
    });
}
