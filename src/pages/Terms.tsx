import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
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
                    {language === 'zh' ? '服務條款' : 'Terms of Service'}
                </h1>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '1. 用戶行為準則' : '1. User Conduct Guidelines'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? 'StyleShare 致力於維護一個安全、尊重且具包容性的社群環境。使用本應用程式即表示您同意遵守以下準則：'
                                : 'StyleShare is committed to maintaining a safe, respectful, and inclusive community environment. By using this application, you agree to follow these guidelines:'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '2. 禁止內容' : '2. Prohibited Content'}
                        </h2>
                        <p className="text-muted-foreground mb-3">
                            {language === 'zh'
                                ? '本平台對以下內容採取零容忍政策：'
                                : 'We have zero tolerance for the following content:'}
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>{language === 'zh' ? '仇恨言論、歧視或騷擾' : 'Hate speech, discrimination, or harassment'}</li>
                            <li>{language === 'zh' ? '暴力、色情或令人不安的內容' : 'Violent, sexual, or disturbing content'}</li>
                            <li>{language === 'zh' ? '垃圾訊息、詐騙或誤導性資訊' : 'Spam, scams, or misleading information'}</li>
                            <li>{language === 'zh' ? '侵犯他人智慧財產權的內容' : 'Content that infringes on intellectual property rights'}</li>
                            <li>{language === 'zh' ? '任何違反當地法律的內容' : 'Any content that violates local laws'}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '3. 濫用行為' : '3. Abusive Behavior'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '我們對濫用行為採取零容忍政策。這包括但不限於：騷擾其他用戶、冒充他人、發布惡意內容，或任何可能對其他用戶造成傷害的行為。'
                                : 'We have zero tolerance for abusive behavior. This includes, but is not limited to: harassing other users, impersonating others, posting malicious content, or any behavior that may cause harm to other users.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '4. 內容審核' : '4. Content Moderation'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '我們保留審核、移除任何違反本條款內容的權利。用戶可以檢舉違規內容或封鎖其他用戶。所有檢舉將由我們的團隊審查。'
                                : 'We reserve the right to moderate and remove any content that violates these terms. Users can report violations or block other users. All reports will be reviewed by our team.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '5. 帳號終止' : '5. Account Termination'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '違反本服務條款可能導致您的帳號被暫停或永久終止，恕不另行通知。嚴重違規者可能會被禁止重新註冊。'
                                : 'Violation of these terms may result in suspension or permanent termination of your account without prior notice. Serious violators may be prohibited from re-registering.'}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">
                            {language === 'zh' ? '6. 聯絡我們' : '6. Contact Us'}
                        </h2>
                        <p className="text-muted-foreground">
                            {language === 'zh'
                                ? '如果您對本條款有任何疑問，或需要檢舉違規內容，請透過應用程式內的封鎖/檢舉功能，或發送電子郵件至 support@styleshare.app 與我們聯繫。'
                                : 'If you have any questions about these terms, or need to report violations, please use the in-app block/report feature, or contact us at support@styleshare.app.'}
                        </p>
                    </section>

                    <p className="text-sm text-muted-foreground pt-6 border-t">
                        {language === 'zh'
                            ? '最後更新：2026年1月7日'
                            : 'Last updated: January 7, 2026'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
