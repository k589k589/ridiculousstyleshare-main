import { useNavigate } from 'react-router-dom';
import ShareOutfit from '@/components/ShareOutfit';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CreatePost = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pt-20 pb-10 px-4">
            <div className="container max-w-2xl mx-auto">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-2xl font-bold">新增文章</h1>
                </div>

                <div className="bg-card rounded-3xl shadow-sm border p-1">
                    <ShareOutfit onSuccess={() => navigate('/community')} />
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
