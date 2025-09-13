-- Allow users to delete their own unapproved reviews
CREATE POLICY "Users can delete their own unapproved reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = user_id AND is_approved = false);
