/**
 * Visit Tracking Utility
 * Tracks unique visitors and page views using Supabase
 */

import { supabase } from '@/lib/supabase';

const VISITOR_ID_KEY = 'rss_visitor_id';
const LAST_VISIT_KEY = 'rss_last_visit';

/**
 * Generate or retrieve visitor ID (stored locally for identification)
 */
export const getVisitorId = (): string => {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
};

/**
 * Get current date string (YYYY-MM-DD)
 */
const getDateString = (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Track a visit - sends to Supabase
 */
export const trackVisit = async () => {
    const visitorId = getVisitorId();
    const today = getDateString();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

    // Only track once per day per visitor
    if (lastVisit === today) {
        return;
    }

    // Get referrer
    let referrerDomain = 'Direct';
    const referrer = document.referrer;

    if (referrer) {
        try {
            const url = new URL(referrer);
            const hostname = url.hostname.toLowerCase();

            // Social Media Mapping
            if (hostname.includes('t.co') || hostname.includes('twitter.com') || hostname.includes('x.com')) {
                referrerDomain = 'X (Twitter)';
            } else if (hostname.includes('instagram.com')) {
                referrerDomain = 'Instagram';
            } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
                referrerDomain = 'Facebook';
            } else if (hostname.includes('threads.net')) {
                referrerDomain = 'Threads';
            } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                referrerDomain = 'YouTube';
            } else if (hostname.includes('tiktok.com')) {
                referrerDomain = 'TikTok';
            } else if (hostname.includes('linkedin.com')) {
                referrerDomain = 'LinkedIn';
            } else if (hostname.includes('pinterest.com')) {
                referrerDomain = 'Pinterest';
            } else if (hostname.includes('google.com')) {
                referrerDomain = 'Google';
            } else if (hostname.includes('bing.com')) {
                referrerDomain = 'Bing';
            } else if (hostname.includes('yahoo.com')) {
                referrerDomain = 'Yahoo';
            } else {
                // Default: remove www.
                referrerDomain = hostname.replace('www.', '');

                // Don't count internal referrers
                if (referrerDomain === window.location.hostname.replace('www.', '')) {
                    referrerDomain = 'Direct';
                }
            }
        } catch (e) {
            referrerDomain = 'Direct';
        }
    }

    try {
        // Insert visit record to Supabase
        const { error } = await supabase
            .from('site_visits')
            .upsert({
                visitor_id: visitorId,
                visit_date: today,
                referrer: referrerDomain,
                user_agent: navigator.userAgent
            }, {
                onConflict: 'visitor_id,visit_date',
                ignoreDuplicates: true
            });

        if (error) {
            // If table doesn't exist yet, silently fail
            if (error.code === '42P01') {
                console.warn('site_visits table not yet created');
                return;
            }
            console.error('Error tracking visit:', error);
            return;
        }

        // Mark as visited today
        localStorage.setItem(LAST_VISIT_KEY, today);
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
};

/**
 * Get visit statistics from Supabase
 */
export const getVisitStats = async () => {
    try {
        // Call the stored function
        const { data, error } = await supabase.rpc('get_visit_stats');

        if (error) {
            // If function doesn't exist, return empty stats
            if (error.code === '42883') {
                console.warn('get_visit_stats function not yet created');
                return getEmptyStats();
            }
            console.error('Error fetching visit stats:', error);
            return getEmptyStats();
        }

        // Fill in missing days for the chart
        const filledDailyStats = fillMissingDays(data?.dailyStats || []);

        return {
            totalVisits: data?.totalVisits || 0,
            totalUniqueVisitors: data?.totalUniqueVisitors || 0,
            last7DaysVisits: data?.last7DaysVisits || 0,
            last7DaysUniqueVisitors: data?.last7DaysUniqueVisitors || 0,
            dailyStats: filledDailyStats,
            referrers: data?.referrers || []
        };
    } catch (error) {
        console.error('Error fetching visit stats:', error);
        return getEmptyStats();
    }
};

/**
 * Fill in missing days for the last 7 days
 */
const fillMissingDays = (dailyStats: Array<{ date: string; visits: number; uniqueVisitors: number }>) => {
    const result = [];
    const statsMap = new Map(dailyStats.map(s => [s.date, s]));
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = getDateString(date);
        const stat = statsMap.get(dateStr);

        result.push({
            date: dateStr,
            visits: stat?.visits || 0,
            uniqueVisitors: stat?.uniqueVisitors || 0
        });
    }

    return result;
};

/**
 * Return empty stats structure
 */
const getEmptyStats = () => ({
    totalVisits: 0,
    totalUniqueVisitors: 0,
    last7DaysVisits: 0,
    last7DaysUniqueVisitors: 0,
    dailyStats: fillMissingDays([]),
    referrers: []
});
