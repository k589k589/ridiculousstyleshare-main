import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAnalytics = () => {
    const { user } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdminCheck();

    if (adminLoading) {
        return (
            <div className="container py-8">
                <Skeleton className="h-12 w-64 mb-8" />
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!isAdmin || !user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <h1 className="text-4xl font-bold">數據分析</h1>
                    </div>
                    <Link to="/admin">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回管理後台
                        </Button>
                    </Link>
                </div>
                <p className="text-muted-foreground">查看網站數據與統計資訊</p>
            </div>

            <AnalyticsDashboard />
        </div>
    );
};

export default AdminAnalytics;
