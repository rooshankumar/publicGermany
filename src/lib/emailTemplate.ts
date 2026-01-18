/**
 * Unified Email Template for publicGermany
 * Use this for ALL email communications
 */

const APP_URL = 'https://publicgermany.vercel.app';

export interface EmailTemplateOptions {
  skipGreeting?: boolean;
  customGreeting?: string;
  signOff?: 'admin' | 'team' | 'none' | string;
}

/**
 * Wraps email content in the standard publicGermany email template
 * @param content - The main email content (HTML allowed, line breaks will be converted to <br>)
 * @param options - Optional configuration
 */
export function wrapInEmailTemplate(
  content: string,
  options: EmailTemplateOptions = {}
): string {
  const { 
    skipGreeting = false, 
    customGreeting,
    signOff = 'admin'
  } = options;

  // Convert line breaks to <br> tags if not already HTML
  const formattedContent = content.includes('<') ? content : content.replace(/\n/g, '<br>');

  // Build greeting
  let greetingHTML = '';
  if (!skipGreeting) {
    greetingHTML = customGreeting 
      ? `${customGreeting}<br><br>`
      : 'Hello,<br><br>';
  }

  // Build sign-off
  let signOffHTML = '';
  if (signOff === 'admin') {
    signOffHTML = '<br><br>Best regards,<br>Admin';
  } else if (signOff === 'team') {
    signOffHTML = '<br><br>Warm regards,<br>Team publicGermany';
  } else if (signOff && signOff !== 'none') {
    // Custom sign-off string
    signOffHTML = `<br><br>${signOff.replace(/\n/g, '<br>')}`;
  }
  // 'none' = no sign-off

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
      ${greetingHTML}${formattedContent}${signOffHTML}
    </td>
  </tr>
  <!-- Referral Line with Stars -->
  <tr>
    <td style="padding:10px 16px; text-align:center; font-size:12px; color:#374151;">
      <em>
        ⭐ Refer your friends and get <strong>₹1,000 instant cashback</strong> once they enroll. ⭐
      </em>
    </td>
  </tr>
  <!-- Footer Brand with Flag -->
  <tr>
    <td style="padding:8px 16px; text-align:center; font-size:12px; color:#111827;">
      <a href="${APP_URL}"
         style="font-weight:bold; color:#111827; text-decoration:none;">
        🇩🇪 publicGermany
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
 * Standard sign-off options for display
 */
export const signOffs = {
  admin: 'Best regards, Admin',
  team: 'Warm regards, Team publicGermany',
  none: '(No sign-off - include in content)'
};
