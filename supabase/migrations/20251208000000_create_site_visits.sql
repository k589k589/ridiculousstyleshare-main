-- Create site_visits table for tracking website visits
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    referrer TEXT DEFAULT 'Direct',
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_referrer ON site_visits(referrer);

-- Create unique constraint to prevent duplicate visits per visitor per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_visits_unique_daily 
ON site_visits(visitor_id, visit_date);

-- Enable RLS
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking anonymous visitors)
CREATE POLICY "Anyone can insert visits" ON site_visits
    FOR INSERT WITH CHECK (true);

-- Only admins can read visits
CREATE POLICY "Admins can read visits" ON site_visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Create a function to get visit statistics (bypasses RLS for aggregation)
CREATE OR REPLACE FUNCTION get_visit_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    seven_days_ago DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
    SELECT json_build_object(
        'totalVisits', (SELECT COUNT(*) FROM site_visits),
        'totalUniqueVisitors', (SELECT COUNT(DISTINCT visitor_id) FROM site_visits),
        'last7DaysVisits', (SELECT COUNT(*) FROM site_visits WHERE visit_date >= seven_days_ago),
        'last7DaysUniqueVisitors', (SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE visit_date >= seven_days_ago),
        'dailyStats', (
            SELECT json_agg(daily_data ORDER BY date)
            FROM (
                SELECT 
                    visit_date::TEXT as date,
                    COUNT(*) as visits,
                    COUNT(DISTINCT visitor_id) as "uniqueVisitors"
                FROM site_visits
                WHERE visit_date >= seven_days_ago
                GROUP BY visit_date
            ) daily_data
        ),
        'referrers', (
            SELECT json_agg(ref_data ORDER BY count DESC)
            FROM (
                SELECT 
                    referrer as source,
                    COUNT(*) as count
                FROM site_visits
                GROUP BY referrer
                ORDER BY count DESC
                LIMIT 10
            ) ref_data
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
