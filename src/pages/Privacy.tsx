import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-3xl py-12 px-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {language === 'zh' ? '返回' : 'Back'}
                </Button>

                <h1 className="text-3xl font-bold mb-8">
                    {language === 'zh' ? '隱私權政策' : 'Privacy Policy'}
                </h1>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '1. 資訊收集' : '1. Information Collection'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '我們收集您提供的個人資訊，包括但不限於電子郵件地址、用戶名稱和個人資料圖片。我們也可能收集設備資訊和使用數據，以改善我們的服務。'
                                : 'We collect personal information you provide, including but not limited to email addresses, usernames, and profile pictures. We may also collect device information and usage data to improve our services.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '2. 資訊使用' : '2. Information Usage'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '我們使用收集的資訊來提供、維護和改善我們的服務，與您溝通，並個性化您的體驗。我們不會將您的個人資訊出售給第三方。'
                                : 'We use the collected information to provide, maintain, and improve our services, communicate with you, and personalize your experience. We do not sell your personal information to third parties.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '3. 數據安全' : '3. Data Security'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '我們採取合理的安全措施來保護您的個人資訊免受未經授權的訪問、使用或披露。'
                                : 'We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '4. 您的權利' : '4. Your Rights'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '您有權訪問、更正或刪除您的個人資訊。您可以通過應用程式內的設置或聯繫我們來行使這些權利。'
                                : 'You have the right to access, correct, or delete your personal information. You can exercise these rights through the in-app settings or by contacting us.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '5. 刪除帳號' : '5. Account Deletion'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '您可以隨時透過應用程式內的「編輯個人資料」>「刪除帳號」功能請求刪除您的帳號及相關數據。'
                                : 'You can request the deletion of your account and associated data at any time via the "Edit Profile" > "Delete Account" feature within the app.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '6. 聯絡我們' : '6. Contact Us'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '如果您對本隱私權政策有任何疑問，請發送電子郵件至 support@styleshare.app 與我們聯繫。'
                                : 'If you have any questions about this Privacy Policy, please contact us at support@styleshare.app.'}
                        </p>
                    </section>

                    <p className="text-sm text-muted-foreground pt-6 border-t">
                        {language === 'zh'
                            ? '最後更新：2026年1月15日'
                            : 'Last updated: January 15, 2026'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
