
-- Update handle_new_user to also insert a welcome notification
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  
  -- Send welcome notification to the new user
  INSERT INTO public.notifications (user_id, title, body, type, recipient_role)
  VALUES (
    NEW.id,
    'Welcome to publicgermany! 🎓',
    'We are excited to have you on board. Start by completing your profile, uploading your documents, and exploring our services to begin your journey to Germany.',
    'welcome',
    'student'
  );

  -- Queue welcome email
  INSERT INTO public.emails_outbox (to_email, subject, html, meta)
  VALUES (
    NEW.email,
    'Welcome to publicgermany - Your Journey to Germany Starts Here! 🇩🇪',
    '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h1 style="color:#1a1a1a">Welcome to publicgermany! 🎓</h1>
      <p>Hi ' || COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'there') || ',</p>
      <p>We are thrilled to have you join us! publicgermany is here to guide you every step of the way on your journey to studying in Germany.</p>
      <h3>Here is what you should do next:</h3>
      <ol>
        <li><strong>Complete your profile</strong> — This helps us understand your background and provide personalized guidance.</li>
        <li><strong>Upload your documents</strong> — Get your documents reviewed by our expert team.</li>
        <li><strong>Explore our services</strong> — From APS guidance to university applications, we have got you covered.</li>
      </ol>
      <p><a href="https://publicgermany.vercel.app/dashboard" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">Go to Dashboard</a></p>
      <p style="margin-top:20px;color:#666;font-size:13px">If you have any questions, feel free to reach out to us anytime.</p>
      <p>Best regards,<br/><strong>publicgermany Team</strong></p>
    </div>',
    jsonb_build_object('type', 'welcome', 'user_id', NEW.id)
  );

  RETURN NEW;
END;
$function$;
