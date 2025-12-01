import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import all generated outfit images
import koreanMale1 from '@/assets/outfit-korean-male-1.jpg';
import koreanFemale1 from '@/assets/outfit-korean-female-1.jpg';
import koreanMale2 from '@/assets/outfit-korean-male-2.jpg';
import koreanFemale2 from '@/assets/outfit-korean-female-2.jpg';
import koreanMale3 from '@/assets/outfit-korean-male-3.jpg';
import europeanMale1 from '@/assets/outfit-european-male-1.jpg';
import europeanFemale1 from '@/assets/outfit-european-female-1.jpg';
import europeanMale2 from '@/assets/outfit-european-male-2.jpg';
import europeanFemale2 from '@/assets/outfit-european-female-2.jpg';
import europeanMale3 from '@/assets/outfit-european-male-3.jpg';
import japaneseMale1 from '@/assets/outfit-japanese-male-1.jpg';
import japaneseFemale1 from '@/assets/outfit-japanese-female-1.jpg';
import japaneseMale2 from '@/assets/outfit-japanese-male-2.jpg';
import japaneseFemale2 from '@/assets/outfit-japanese-female-2.jpg';
import japaneseMale3 from '@/assets/outfit-japanese-male-3.jpg';
import americanMale1 from '@/assets/outfit-american-male-1.jpg';
import americanFemale1 from '@/assets/outfit-american-female-1.jpg';
import americanMale2 from '@/assets/outfit-american-male-2.jpg';
import americanFemale2 from '@/assets/outfit-american-female-2.jpg';
import americanMale3 from '@/assets/outfit-american-male-3.jpg';
import sweetFemale1 from '@/assets/outfit-sweet-female-1.jpg';
import sweetFemale2 from '@/assets/outfit-sweet-female-2.jpg';
import sweetFemale3 from '@/assets/outfit-sweet-female-3.jpg';
import vintageMale1 from '@/assets/outfit-vintage-male-1.jpg';
import vintageFemale1 from '@/assets/outfit-vintage-female-1.jpg';
import vintageMale2 from '@/assets/outfit-vintage-male-2.jpg';
import vintageFemale2 from '@/assets/outfit-vintage-female-2.jpg';
import vintageMale3 from '@/assets/outfit-vintage-male-3.jpg';
import christmasMale1 from '@/assets/outfit-christmas-male-1.jpg';
import christmasFemale1 from '@/assets/outfit-christmas-female-1.jpg';

const OFFICIAL_USER_ID = '092d3c70-770a-43f3-8850-4658cc036851';

const outfitsData = [
  { title: 'Korean Street Style', description: 'Modern urban Korean fashion with oversized hoodie and cargo pants. Perfect for casual streetwear lovers.', image: koreanMale1, tags: ['韓風', '街頭風', '男裝'] },
  { title: 'Elegant Korean Dress', description: 'Soft feminine dress with cardigan in pastel colors. Sweet and elegant Korean style.', image: koreanFemale1, tags: ['韓風', '甜美風', '女裝'] },
  { title: 'Korean Puffer Jacket', description: 'Trendy oversized puffer jacket with joggers. Essential for Korean winter street style.', image: koreanMale2, tags: ['韓風', '冬季', '男裝'] },
  { title: 'Korean Knit Elegance', description: 'Cozy knit sweater with midi skirt. Feminine and elegant Korean fashion.', image: koreanFemale2, tags: ['韓風', '優雅', '女裝'] },
  { title: 'Korean Preppy Style', description: 'Layered turtleneck with vest and slacks. University preppy Korean look.', image: koreanMale3, tags: ['韓風', '學院風', '男裝'] },
  { title: 'European Sophistication', description: 'Tailored blazer with fitted trousers. Classic European gentleman style.', image: europeanMale1, tags: ['歐風', '正裝', '男裝'] },
  { title: 'Chic Winter Coat', description: 'Elegant coat with boots and scarf. Perfect European winter street style.', image: europeanFemale1, tags: ['歐風', '冬季', '女裝'] },
  { title: 'European Classic', description: 'Turtleneck sweater with trench coat. Timeless European elegance.', image: europeanMale2, tags: ['歐風', '經典', '男裝'] },
  { title: 'Power Dressing', description: 'Blazer dress with tights and heels. Professional chic European style.', image: europeanFemale2, tags: ['歐風', '職業', '女裝'] },
  { title: 'Winter Gentleman', description: 'Wool peacoat with scarf and leather gloves. Sophisticated European winter look.', image: europeanMale3, tags: ['歐風', '冬季', '男裝'] },
  { title: 'Tokyo Minimalist', description: 'Clean minimalist aesthetic with neutral tones. Modern Tokyo street style.', image: japaneseMale1, tags: ['日風', '極簡', '男裝'] },
  { title: 'Kawaii Layers', description: 'Cute layered look with pleated skirt and cardigan. Sweet Japanese kawaii fashion.', image: japaneseFemale1, tags: ['日風', '可愛', '女裝'] },
  { title: 'Japanese Oversized', description: 'Oversized coat with wide pants. Clean and modern Japanese aesthetic.', image: japaneseMale2, tags: ['日風', '寬鬆', '男裝'] },
  { title: 'Casual Cute', description: 'Oversized sweater with shorts and knee socks. Cute casual Japanese style.', image: japaneseFemale2, tags: ['日風', '休閒', '女裝'] },
  { title: 'Harajuku Creative', description: 'Colorful Harajuku streetwear with layered accessories. Creative urban Japanese fashion.', image: japaneseMale3, tags: ['日風', '原宿', '男裝'] },
  { title: 'American Denim Classic', description: 'Casual denim jacket with t-shirt and sneakers. Relaxed American street style.', image: americanMale1, tags: ['美式', '休閒', '男裝'] },
  { title: 'Sporty Chic', description: 'Bomber jacket with leggings. Athletic urban American style.', image: americanFemale1, tags: ['美式', '運動', '女裝'] },
  { title: 'Flannel Casual', description: 'Flannel shirt with chinos and boots. Relaxed everyday American fashion.', image: americanMale2, tags: ['美式', '休閒', '男裝'] },
  { title: 'Sundress Charm', description: 'Casual sundress with denim jacket and sneakers. Relaxed American summer style.', image: americanFemale2, tags: ['美式', '夏季', '女裝'] },
  { title: 'Varsity Spirit', description: 'Varsity jacket with athletic wear. Classic American college style.', image: americanMale3, tags: ['美式', '學院風', '男裝'] },
  { title: 'Romantic Pastels', description: 'Flowy pastel dress with ribbons and lace details. Sweet romantic style.', image: sweetFemale1, tags: ['甜美風', '浪漫', '女裝'] },
  { title: 'Fairy Tale Dream', description: 'Tulle skirt with embellished top. Romantic fairy-like feminine style.', image: sweetFemale2, tags: ['甜美風', '夢幻', '女裝'] },
  { title: 'Garden Party', description: 'Ruffled blouse with floral midi skirt. Romantic garden party style.', image: sweetFemale3, tags: ['甜美風', '花園', '女裝'] },
  { title: '70s Retro Vibes', description: '70s inspired flared pants and patterned shirt. Nostalgic vintage style.', image: vintageMale1, tags: ['懷舊風', '70年代', '男裝'] },
  { title: '80s Pop Color', description: '80s inspired high-waisted jeans and colorful sweater. Vibrant retro fashion.', image: vintageFemale1, tags: ['懷舊風', '80年代', '女裝'] },
  { title: '90s Grunge', description: 'Denim overalls with striped shirt. 90s grunge aesthetic.', image: vintageMale2, tags: ['懷舊風', '90年代', '男裝'] },
  { title: '50s Elegance', description: 'Midi skirt with blouse. 50s inspired elegant retro style.', image: vintageFemale2, tags: ['懷舊風', '50年代', '女裝'] },
  { title: '80s Corduroy Cool', description: 'Corduroy jacket with turtleneck. 80s inspired vintage fashion.', image: vintageMale3, tags: ['懷舊風', '80年代', '男裝'] },
  { title: '🎄 Festive Red Sweater', description: 'Cozy red Christmas sweater with holiday patterns. Perfect for Christmas celebrations!', image: christmasMale1, tags: ['聖誕裝', '節慶', '男裝'] },
  { title: '🎄 Elegant Holiday Dress', description: 'Stunning red dress with festive accessories. Glamorous Christmas party style.', image: christmasFemale1, tags: ['聖誕裝', '派對', '女裝'] },
];

const UploadOfficialOutfits = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpload = async () => {
    setLoading(true);
    setProgress(0);
    setUploadedCount(0);
    setCompleted(false);
    
    try {
      for (let i = 0; i < outfitsData.length; i++) {
        const outfit = outfitsData[i];
        
        // Fetch the image from the imported path
        const response = await fetch(outfit.image);
        const blob = await response.blob();
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `official-outfit-${i + 1}-${timestamp}.jpg`;
        const filePath = `${OFFICIAL_USER_ID}/${filename}`;
        
        // Upload to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('outfit-images')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading image ${i + 1}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('outfit-images')
          .getPublicUrl(filePath);
        
        // Create outfit record
        const { error: insertError } = await supabase
          .from('outfits')
          .insert({
            user_id: OFFICIAL_USER_ID,
            title: outfit.title,
            description: outfit.description,
            image_url: publicUrl,
            style_tags: outfit.tags,
          });

        if (insertError) {
          console.error(`Error creating outfit ${i + 1}:`, insertError);
        } else {
          setUploadedCount(prev => prev + 1);
        }
        
        setProgress(Math.round(((i + 1) / outfitsData.length) * 100));
      }
      
      setCompleted(true);
      toast({
        title: '成功！',
        description: `已成功上傳並創建 ${uploadedCount} 個穿搭貼文！`,
      });
    } catch (error) {
      console.error('Error during upload:', error);
      toast({
        title: '錯誤',
        description: '上傳過程中發生錯誤，請查看控制台以獲取詳細信息。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-orange-400/5 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">上傳Official Account穿搭貼文</CardTitle>
            <CardDescription>
              點擊下方按鈕批量上傳30張AI生成的穿搭圖片並創建貼文。
              包含韓風、歐風、日風、美式、甜美風、懷舊風和聖誕風格。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!completed && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>準備上傳 30 個穿搭貼文</span>
                  <span>15 男裝 + 15 女裝</span>
                </div>
                
                <Button 
                  onClick={handleUpload} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      上傳中... {progress}%
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      開始批量上傳
                    </>
                  )}
                </Button>

                {loading && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      已上傳: {uploadedCount} / {outfitsData.length}
                    </p>
                  </div>
                )}
              </div>
            )}

            {completed && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-green-600">上傳完成！</h3>
                  <p className="text-muted-foreground">
                    成功創建了 {uploadedCount} 個Official Account穿搭貼文
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/community')}
                  className="w-full"
                >
                  前往社群頁面查看
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">風格分佈：</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 韓風 (Korean): 5 個貼文</li>
                <li>• 歐風 (European): 5 個貼文</li>
                <li>• 日風 (Japanese): 5 個貼文</li>
                <li>• 美式 (American): 5 個貼文</li>
                <li>• 甜美風 (Sweet): 3 個貼文</li>
                <li>• 懷舊風 (Vintage): 5 個貼文</li>
                <li>• 聖誕裝 (Christmas): 2 個貼文</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadOfficialOutfits;
