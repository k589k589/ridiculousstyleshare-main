-- Create outfit_bookmarks table for saving favorite posts
CREATE TABLE IF NOT EXISTS public.outfit_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Enable RLS
ALTER TABLE public.outfit_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outfit_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.outfit_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON public.outfit_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.outfit_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create outfit_reports table for content moderation
CREATE TABLE IF NOT EXISTS public.outfit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'))
);

-- Enable RLS
ALTER TABLE public.outfit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outfit_reports
CREATE POLICY "Users can create reports"
  ON public.outfit_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.outfit_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON public.outfit_reports FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
  ON public.outfit_reports FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_outfit_reports_updated_at
  BEFORE UPDATE ON public.outfit_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_outfit_bookmarks_user_id ON public.outfit_bookmarks(user_id);
CREATE INDEX idx_outfit_bookmarks_outfit_id ON public.outfit_bookmarks(outfit_id);
CREATE INDEX idx_outfit_reports_status ON public.outfit_reports(status);
CREATE INDEX idx_outfit_reports_outfit_id ON public.outfit_reports(outfit_id);