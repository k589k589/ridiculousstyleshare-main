import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown, TrendingUp, Activity, FileText, Heart, MessageCircle, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVisitStats } from '@/lib/visitTracker';

interface AnalyticsData {
    totalUsers: number;
    userGrowth: number;
    vipUsers: number;
    vipGrowth: number;
    conversionRate: number;
    postsLast7Days: number;
    commentsLast7Days: number;
    likesLast7Days: number;
    totalVisits: number;
    totalUniqueVisitors: number;
    last7DaysVisits: number;
    last7DaysUniqueVisitors: number;
    dailyStats: Array<{
        date: string;
        users: number;
        vips: number;
        posts: number;
        visits: number;
        uniqueVisitors: number;
    }>;
    referrers: Array<{ source: string; count: number }>;
}

export const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Fetch total users
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch users created in last 7 days
            const { count: newUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Fetch active VIP subscriptions
            const { count: vipUsers } = await supabase
                .from('vip_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Fetch new VIPs in last 7 days
            const { count: newVips } = await supabase
                .from('vip_subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')
                .gte('created_at', sevenDaysAgo.toISOString());

            // Fetch posts in last 7 days
            const { count: postsLast7Days } = await supabase
                .from('outfits')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Fetch comments in last 7 days
            const { count: commentsLast7Days } = await supabase
                .from('outfit_comments')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Fetch likes in last 7 days
            const { count: likesLast7Days } = await supabase
                .from('outfit_likes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Fetch daily stats for chart
            const dailyStats = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

                // Users created on this day
                const { count: dayUsers } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', date.toISOString())
                    .lt('created_at', nextDate.toISOString());

                // VIPs created on this day
                const { count: dayVips } = await supabase
                    .from('vip_subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')
                    .gte('created_at', date.toISOString())
                    .lt('created_at', nextDate.toISOString());

                // Posts created on this day
                const { count: dayPosts } = await supabase
                    .from('outfits')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', date.toISOString())
                    .lt('created_at', nextDate.toISOString());

                dailyStats.push({
                    date: dateStr,
                    users: dayUsers || 0,
                    vips: dayVips || 0,
                    posts: dayPosts || 0,
                });
            }

            const conversionRate = totalUsers && totalUsers > 0
                ? ((vipUsers || 0) / totalUsers) * 100
                : 0;

            // Get visit statistics
            const visitStats = await getVisitStats();

            // Merge daily stats with visit data
            const mergedDailyStats = dailyStats.map((stat) => {
                const visitDayStat = visitStats.dailyStats.find((v: { date: string }) => v.date === stat.date);
                return {
                    ...stat,
                    visits: visitDayStat?.visits || 0,
                    uniqueVisitors: visitDayStat?.uniqueVisitors || 0
                };
            });

            setAnalytics({
                totalUsers: totalUsers || 0,
                userGrowth: newUsers || 0,
                vipUsers: vipUsers || 0,
                vipGrowth: newVips || 0,
                conversionRate,
                postsLast7Days: postsLast7Days || 0,
                commentsLast7Days: commentsLast7Days || 0,
                likesLast7Days: likesLast7Days || 0,
                totalVisits: visitStats.totalVisits,
                totalUniqueVisitors: visitStats.totalUniqueVisitors,
                last7DaysVisits: visitStats.last7DaysVisits,
                last7DaysUniqueVisitors: visitStats.last7DaysUniqueVisitors,
                dailyStats: mergedDailyStats,
                referrers: visitStats.referrers || [],
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">無法載入分析數據</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            總會員數
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            近7天新增: +{analytics.userGrowth}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-600" />
                            VIP會員數
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.vipUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            近7天新增: +{analytics.vipGrowth}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            VIP轉化率
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            VIP / 總會員比例
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-600" />
                            活躍度
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.postsLast7Days}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            近7天發文數
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Eye className="h-4 w-4 text-indigo-600" />
                            網站訪問數
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.last7DaysVisits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            近7天訪問次數
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            貼文
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.postsLast7Days}</div>
                        <p className="text-xs text-muted-foreground">近7天</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            評論
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.commentsLast7Days}</div>
                        <p className="text-xs text-muted-foreground">近7天</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            點讚
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.likesLast7Days}</div>
                        <p className="text-xs text-muted-foreground">近7天</p>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Sources & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Sources */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>流量來源</CardTitle>
                        <CardDescription>前10名訪問來源</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.referrers.length > 0 ? (
                                analytics.referrers.map((ref, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{ref.source}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{
                                                        width: `${(ref.count / analytics.totalVisits) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-muted-foreground w-8 text-right">
                                                {ref.count}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    尚無來源數據
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Charts */}
                <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>新增會員趨勢</CardTitle>
                            <CardDescription>近7天每日新增會員數</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={analytics.dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString('zh-TW')}
                                        formatter={(value: number) => [value, '新增會員']}
                                    />
                                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>發文趨勢</CardTitle>
                            <CardDescription>近7天每日發文數</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={analytics.dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(value) => new Date(value).toLocaleDateString('zh-TW')}
                                        formatter={(value: number) => [value, '發文數']}
                                    />
                                    <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};
