/**
 * Unified Email Template for publicGermany
 * Use this for ALL email communications
 */

const APP_URL = 'https://publicgermany.vercel.app';

/**
 * Wraps email content in the standard publicGermany email template
 * @param content - The main email content (HTML allowed, line breaks will be converted to <br>)
 * @param options - Optional configuration
 */
export function wrapInEmailTemplate(
  content: string,
  options: {
    skipGreeting?: boolean;
    customGreeting?: string;
    signOff?: string;
  } = {}
): string {
  const { 
    skipGreeting = false, 
    customGreeting = 'Hello,',
    signOff = 'Best regards,<br>Admin'
  } = options;

  // Convert line breaks to <br> tags if not already HTML
  const formattedContent = content.replace(/\n/g, '<br>');

  const greetingHTML = skipGreeting ? '' : `${customGreeting}<br><br>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>publicGermany</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <!-- Minimal Header with Germany Accent -->
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Plain Content -->
  <tr>
    <td style="padding:12px 16px; font-size:14px; line-height:1.6; color:#000000;">
      ${greetingHTML}${formattedContent}
      <br><br>
      ${signOff}
    </td>
  </tr>
  <!-- Referral Line -->
  <tr>
    <td style="padding:10px 16px; text-align:center; font-size:12px; color:#374151;">
      <em>
        Refer your friends and get <strong>₹1,000 instant cashback</strong> once they enroll.
      </em>
    </td>
  </tr>
  <!-- Footer Brand -->
  <tr>
    <td style="padding:8px 16px; text-align:center; font-size:12px; color:#111827;">
      <a href="${APP_URL}"
         style="font-weight:bold; color:#111827; text-decoration:none;">
        publicGermany
      </a>
    </td>
  </tr>
  <!-- Minimal Footer with Germany Accent -->
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#000000; height:3px;"></td>
          <td style="background:#DD0000; height:3px;"></td>
          <td style="background:#FFCE00; height:3px;"></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Helper to create personalized greeting
 */
export function getPersonalizedGreeting(name?: string): string {
  return name ? `Hi ${name},` : 'Hello,';
}

/**
 * Standard sign-off options
 */
export const signOffs = {
  admin: 'Best regards,<br>Admin',
  team: 'Best regards,<br>publicGermany Team',
  default: 'Best regards,<br>Admin'
};
