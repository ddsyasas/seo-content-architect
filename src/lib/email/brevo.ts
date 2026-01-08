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
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@syncseo.app',
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

