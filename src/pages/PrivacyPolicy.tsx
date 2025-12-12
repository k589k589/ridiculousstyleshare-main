import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Cookie, Mail, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
    const { t, language } = useLanguage();
    const isChinese = language === 'zh';

    return (
        <div className="container max-w-4xl py-12">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">
                    {isChinese ? '隱私政策' : 'Privacy Policy'}
                </h1>
                <p className="text-muted-foreground">
                    {isChinese
                        ? '最後更新：2025年12月3日'
                        : 'Last Updated: December 3, 2025'}
                </p>
            </div>

            <div className="space-y-6">
                {/* Introduction */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {isChinese ? '簡介' : 'Introduction'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>
                            {isChinese
                                ? 'StyleShare（以下簡稱「我們」）重視您的隱私。本隱私政策說明我們如何收集、使用和保護您的個人資訊。'
                                : 'StyleShare ("we", "us", or "our") values your privacy. This Privacy Policy explains how we collect, use, and protect your personal information.'}
                        </p>
                    </CardContent>
                </Card>

                {/* Data Collection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            {isChinese ? '我們收集的資訊' : 'Information We Collect'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">
                                {isChinese ? '1. 帳戶資訊' : '1. Account Information'}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>{isChinese ? '電子郵件地址' : 'Email address'}</li>
                                <li>{isChinese ? '姓名' : 'Name'}</li>
                                <li>{isChinese ? '個人資料照片（可選）' : 'Profile photo (optional)'}</li>
                                <li>{isChinese ? '個人簡介（可選）' : 'Bio (optional)'}</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">
                                {isChinese ? '2. 穿搭內容' : '2. Outfit Content'}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>{isChinese ? '上傳的圖片' : 'Uploaded images'}</li>
                                <li>{isChinese ? '穿搭描述和標籤' : 'Outfit descriptions and tags'}</li>
                                <li>{isChinese ? '評論和互動' : 'Comments and interactions'}</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">
                                {isChinese ? '3. 使用數據' : '3. Usage Data'}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>{isChinese ? '訪問時間和頻率' : 'Visit times and frequency'}</li>
                                <li>{isChinese ? '瀏覽的頁面' : 'Pages viewed'}</li>
                                <li>{isChinese ? '來源網站（referrer）' : 'Referrer websites'}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* How We Use Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            {isChinese ? '資訊使用方式' : 'How We Use Your Information'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>{isChinese ? '提供和維護服務' : 'Provide and maintain our service'}</li>
                            <li>{isChinese ? '改善用戶體驗' : 'Improve user experience'}</li>
                            <li>{isChinese ? '發送重要通知' : 'Send important notifications'}</li>
                            <li>{isChinese ? '分析網站使用情況' : 'Analyze website usage'}</li>
                            <li>{isChinese ? '防止濫用和欺詐' : 'Prevent abuse and fraud'}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* localStorage */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cookie className="h-5 w-5" />
                            {isChinese ? '本地儲存（localStorage）' : 'Local Storage'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>
                            {isChinese
                                ? '我們使用瀏覽器的 localStorage 來儲存：'
                                : 'We use browser localStorage to store:'}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>{isChinese ? '訪客追蹤ID（匿名）' : 'Visitor tracking ID (anonymous)'}</li>
                            <li>{isChinese ? '訪問統計數據' : 'Visit statistics'}</li>
                            <li>{isChinese ? '語言偏好' : 'Language preference'}</li>
                            <li>{isChinese ? '歡迎訊息狀態' : 'Welcome message status'}</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isChinese
                                ? '注意：您可以隨時清除瀏覽器的 localStorage 來刪除這些數據。'
                                : 'Note: You can clear your browser\'s localStorage at any time to remove this data.'}
                        </p>
                    </CardContent>
                </Card>

                {/* Data Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {isChinese ? '資料安全' : 'Data Security'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>
                            {isChinese
                                ? '我們採取適當的安全措施保護您的個人資訊：'
                                : 'We implement appropriate security measures to protect your personal information:'}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>{isChinese ? 'HTTPS 加密傳輸' : 'HTTPS encrypted transmission'}</li>
                            <li>{isChinese ? 'Supabase 安全認證系統' : 'Supabase secure authentication'}</li>
                            <li>{isChinese ? '密碼加密儲存' : 'Encrypted password storage'}</li>
                            <li>{isChinese ? '資料庫存取控制（RLS）' : 'Database access control (RLS)'}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Your Rights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            {isChinese ? '您的權利' : 'Your Rights'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>{isChinese ? '您有權：' : 'You have the right to:'}</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>{isChinese ? '查看您的個人資訊' : 'Access your personal information'}</li>
                            <li>{isChinese ? '更正不準確的資訊' : 'Correct inaccurate information'}</li>
                            <li>{isChinese ? '刪除您的帳戶和資料' : 'Delete your account and data'}</li>
                            <li>{isChinese ? '導出您的資料' : 'Export your data'}</li>
                            <li>{isChinese ? '撤回同意（在適用情況下）' : 'Withdraw consent (where applicable)'}</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Third-Party Services */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isChinese ? '第三方服務' : 'Third-Party Services'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>{isChinese ? '我們使用以下第三方服務：' : 'We use the following third-party services:'}</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>
                                <strong>Supabase</strong> -
                                {isChinese ? ' 資料庫和認證服務' : ' Database and authentication'}
                            </li>
                            <li>
                                <strong>PayPal</strong> -
                                {isChinese ? ' 付款處理（VIP訂閱）' : ' Payment processing (VIP subscriptions)'}
                            </li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isChinese
                                ? '這些服務有各自的隱私政策，我們建議您查閱。'
                                : 'These services have their own privacy policies, which we encourage you to review.'}
                        </p>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {isChinese ? '聯繫我們' : 'Contact Us'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {isChinese
                                ? '如果您對本隱私政策有任何疑問，請透過以下方式聯繫我們：'
                                : 'If you have questions about this Privacy Policy, please contact us:'}
                        </p>
                        <p className="mt-2">
                            <strong>{isChinese ? '電子郵件：' : 'Email:'}</strong> support@styleshare.com
                        </p>
                    </CardContent>
                </Card>

                {/* Updates */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isChinese ? '政策更新' : 'Policy Updates'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {isChinese
                                ? '我們可能會不時更新本隱私政策。我們將在本頁面發布任何更改，並更新「最後更新」日期。重大更改時，我們會通過電子郵件或網站通知您。'
                                : 'We may update this Privacy Policy from time to time. We will post any changes on this page and update the "Last Updated" date. For significant changes, we will notify you via email or website notification.'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                {isChinese
                    ? '使用我們的服務即表示您同意本隱私政策。如果您不同意，請不要使用我們的服務。'
                    : 'By using our service, you agree to this Privacy Policy. If you do not agree, please do not use our service.'}
            </div>
        </div>
    );
};

export default PrivacyPolicy;
