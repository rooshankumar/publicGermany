import { supabase } from "@/integrations/supabase/client";

export type SendEmailOptions = {
  text?: string;
  templateId?: number;
  params?: Record<string, unknown>;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType?: string;
  }>;
};

export async function sendEmail(
  to: string | string[],
  subject: string,
  html?: string,
  options: SendEmailOptions = {}
) {
  const payload = {
    to,
    subject,
    html: html || undefined,
    text: options.text,
    templateId: options.templateId,
    params: options.params,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
  };

  const { data, error } = await supabase.functions.invoke("send-email", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean };
}
