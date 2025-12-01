import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Eye,
  ExternalLink,
  Trash2,
  Ban,
  UserX
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BanDialog } from '@/components/BanDialog';

interface Report {
  id: string;
  outfit_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  outfit?: {
    title: string;
    image_url: string;
    user_id: string;
  };
  reporter?: {
    name: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [outfitToDelete, setOutfitToDelete] = useState<{ id: string; title: string } | null>(null);
  const [userToBan, setUserToBan] = useState<{ id: string; name: string } | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: '無權限',
        description: '您沒有訪問管理員頁面的權限',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('outfit_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data: reportsData, error } = await query;

      if (error) throw error;

      // Fetch related outfit and reporter data separately
      if (reportsData && reportsData.length > 0) {
        const outfitIds = [...new Set(reportsData.map(r => r.outfit_id))];
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];

        // Fetch outfits
        const { data: outfitsData } = await supabase
          .from('outfits')
          .select('id, title, image_url, user_id')
          .in('id', outfitIds);

        // Get all user IDs (both reporters and outfit owners)
        const allUserIds = [...new Set([
          ...reporterIds,
          ...(outfitsData?.map(o => o.user_id) || [])
        ])];

        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', allUserIds);

        // Create maps for quick lookup
        const outfitMap = new Map(outfitsData?.map(o => [o.id, o]) || []);
        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        // Combine data
        const enrichedReports = reportsData.map(report => ({
          ...report,
          outfit: outfitMap.get(report.outfit_id) || null,
          reporter: profileMap.get(report.reporter_id) || null,
        }));

        setReports(enrichedReports);
      } else {
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: '載入失敗',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed' | 'reviewing') => {
    try {
      const { error } = await supabase
        .from('outfit_reports')
        .update({
          status: newStatus,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: '狀態已更新',
        description: `舉報已標記為${getStatusLabel(newStatus)}`,
      });

      fetchReports();
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error updating report:', error);
      toast({
        title: '更新失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待處理',
      reviewing: '審核中',
      resolved: '已處理',
      dismissed: '已駁回',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
      reviewing: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
      resolved: 'bg-green-500/20 text-green-700 dark:text-green-400',
      dismissed: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
    };
    return colors[status] || '';
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: '垃圾訊息',
      inappropriate: '不當內容',
      copyright: '侵犯版權',
      harassment: '騷擾霸凌',
      misinformation: '虛假資訊',
      other: '其他',
    };
    return labels[reason] || reason;
  };

  const handleDeleteOutfit = async () => {
    if (!outfitToDelete) return;

    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitToDelete.id);

      if (error) throw error;

      toast({
        title: '刪除成功',
        description: '貼文已被刪除',
      });

      fetchReports();
      setOutfitToDelete(null);
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error deleting outfit:', error);
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenBanDialog = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', userId)
        .maybeSingle();

      setUserToBan({
        id: userId,
        name: profile?.name || '未知用戶',
      });
      setBanDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast({
        title: '錯誤',
        description: '無法載入用戶資訊',
        variant: 'destructive',
      });
    }
  };

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

  if (!isAdmin) {
    return null;
  }

  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">管理員後台</h1>
        </div>
        <p className="text-muted-foreground">審核舉報內容並管理社群安全</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">待處理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">審核中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.reviewing}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已處理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.resolved}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已駁回</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-600" />
              <span className="text-2xl font-bold">{stats.dismissed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>舉報列表</CardTitle>
          <CardDescription>審核和處理用戶舉報的內容</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">待處理</TabsTrigger>
              <TabsTrigger value="reviewing">審核中</TabsTrigger>
              <TabsTrigger value="resolved">已處理</TabsTrigger>
              <TabsTrigger value="dismissed">已駁回</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">暫無舉報記錄</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Outfit Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={report.outfit?.image_url}
                              alt={report.outfit?.title}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          </div>

                          {/* Report Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">
                                  {report.outfit?.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>舉報人：{report.reporter?.name || '未知'}</span>
                                  <span>•</span>
                                  <span>{new Date(report.created_at).toLocaleString('zh-TW')}</span>
                                </div>
                              </div>
                              <Badge className={getStatusColor(report.status)}>
                                {getStatusLabel(report.status)}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="font-medium">原因：</span>
                                <span>{getReasonLabel(report.reason)}</span>
                              </div>
                              {report.description && (
                                <p className="text-sm text-muted-foreground pl-6">
                                  {report.description}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 mt-4 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                查看詳情
                              </Button>
                              {report.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                                >
                                  開始審核
                                </Button>
                              )}
                              {(report.status === 'pending' || report.status === 'reviewing') && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    處理完成
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    駁回舉報
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setOutfitToDelete({ 
                                      id: report.outfit_id, 
                                      title: report.outfit?.title || '未知貼文' 
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    刪除貼文
                                  </Button>
                                  {report.outfit?.user_id && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleOpenBanDialog(report.outfit!.user_id)}
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      封禁用戶
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>舉報詳情</DialogTitle>
            <DialogDescription>
              查看完整的舉報資訊和相關內容
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={selectedReport.outfit?.image_url}
                  alt={selectedReport.outfit?.title}
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-xl mb-2">
                    {selectedReport.outfit?.title}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">狀態：</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedReport.status)}`}>
                        {getStatusLabel(selectedReport.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">舉報原因：</span>
                      <span className="ml-2">{getReasonLabel(selectedReport.reason)}</span>
                    </div>
                    <div>
                      <span className="font-medium">舉報人：</span>
                      <span className="ml-2">{selectedReport.reporter?.name || '未知'}</span>
                    </div>
                    <div>
                      <span className="font-medium">舉報時間：</span>
                      <span className="ml-2">
                        {new Date(selectedReport.created_at).toLocaleString('zh-TW')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <h4 className="font-medium mb-2">詳細說明：</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/community`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  查看原貼文
                </Button>
                {selectedReport && (selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setOutfitToDelete({ 
                        id: selectedReport.outfit_id, 
                        title: selectedReport.outfit?.title || '未知貼文' 
                      })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      刪除貼文
                    </Button>
                    {selectedReport.outfit?.user_id && (
                      <Button
                        variant="destructive"
                        onClick={() => handleOpenBanDialog(selectedReport.outfit!.user_id)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        封禁用戶
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!outfitToDelete} onOpenChange={(open) => !open && setOutfitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除貼文</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除貼文「{outfitToDelete?.title}」嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOutfit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      {userToBan && (
        <BanDialog
          userId={userToBan.id}
          userName={userToBan.name}
          open={banDialogOpen}
          onOpenChange={setBanDialogOpen}
          onBanComplete={fetchReports}
        />
      )}
    </div>
  );
};

export default Admin;
