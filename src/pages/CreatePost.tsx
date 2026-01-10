import { useNavigate } from 'react-router-dom';
import ShareOutfit from '@/components/ShareOutfit';

const CreatePost = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pt-20 pb-10">
            <ShareOutfit onSuccess={() => navigate('/community')} />
        </div>
    );
};

export default CreatePost;
