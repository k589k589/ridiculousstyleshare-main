import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const OFFICIAL_USER_ID = '092d3c70-770a-43f3-8850-4658cc036851';

const outfitsData = [
  { title: 'Korean Street Style', description: 'Modern urban Korean fashion with oversized hoodie and cargo pants. Perfect for casual streetwear lovers.', image: 'outfit-korean-male-1.jpg', tags: ['韓風', '街頭風', '男裝'] },
  { title: 'Elegant Korean Dress', description: 'Soft feminine dress with cardigan in pastel colors. Sweet and elegant Korean style.', image: 'outfit-korean-female-1.jpg', tags: ['韓風', '甜美風', '女裝'] },
  { title: 'Korean Puffer Jacket', description: 'Trendy oversized puffer jacket with joggers. Essential for Korean winter street style.', image: 'outfit-korean-male-2.jpg', tags: ['韓風', '冬季', '男裝'] },
  { title: 'Korean Knit Elegance', description: 'Cozy knit sweater with midi skirt. Feminine and elegant Korean fashion.', image: 'outfit-korean-female-2.jpg', tags: ['韓風', '優雅', '女裝'] },
  { title: 'Korean Preppy Style', description: 'Layered turtleneck with vest and slacks. University preppy Korean look.', image: 'outfit-korean-male-3.jpg', tags: ['韓風', '學院風', '男裝'] },
  { title: 'European Sophistication', description: 'Tailored blazer with fitted trousers. Classic European gentleman style.', image: 'outfit-european-male-1.jpg', tags: ['歐風', '正裝', '男裝'] },
  { title: 'Chic Winter Coat', description: 'Elegant coat with boots and scarf. Perfect European winter street style.', image: 'outfit-european-female-1.jpg', tags: ['歐風', '冬季', '女裝'] },
  { title: 'European Classic', description: 'Turtleneck sweater with trench coat. Timeless European elegance.', image: 'outfit-european-male-2.jpg', tags: ['歐風', '經典', '男裝'] },
  { title: 'Power Dressing', description: 'Blazer dress with tights and heels. Professional chic European style.', image: 'outfit-european-female-2.jpg', tags: ['歐風', '職業', '女裝'] },
  { title: 'Winter Gentleman', description: 'Wool peacoat with scarf and leather gloves. Sophisticated European winter look.', image: 'outfit-european-male-3.jpg', tags: ['歐風', '冬季', '男裝'] },
  { title: 'Tokyo Minimalist', description: 'Clean minimalist aesthetic with neutral tones. Modern Tokyo street style.', image: 'outfit-japanese-male-1.jpg', tags: ['日風', '極簡', '男裝'] },
  { title: 'Kawaii Layers', description: 'Cute layered look with pleated skirt and cardigan. Sweet Japanese kawaii fashion.', image: 'outfit-japanese-female-1.jpg', tags: ['日風', '可愛', '女裝'] },
  { title: 'Japanese Oversized', description: 'Oversized coat with wide pants. Clean and modern Japanese aesthetic.', image: 'outfit-japanese-male-2.jpg', tags: ['日風', '寬鬆', '男裝'] },
  { title: 'Casual Cute', description: 'Oversized sweater with shorts and knee socks. Cute casual Japanese style.', image: 'outfit-japanese-female-2.jpg', tags: ['日風', '休閒', '女裝'] },
  { title: 'Harajuku Creative', description: 'Colorful Harajuku streetwear with layered accessories. Creative urban Japanese fashion.', image: 'outfit-japanese-male-3.jpg', tags: ['日風', '原宿', '男裝'] },
  { title: 'American Denim Classic', description: 'Casual denim jacket with t-shirt and sneakers. Relaxed American street style.', image: 'outfit-american-male-1.jpg', tags: ['美式', '休閒', '男裝'] },
  { title: 'Sporty Chic', description: 'Bomber jacket with leggings. Athletic urban American style.', image: 'outfit-american-female-1.jpg', tags: ['美式', '運動', '女裝'] },
  { title: 'Flannel Casual', description: 'Flannel shirt with chinos and boots. Relaxed everyday American fashion.', image: 'outfit-american-male-2.jpg', tags: ['美式', '休閒', '男裝'] },
  { title: 'Sundress Charm', description: 'Casual sundress with denim jacket and sneakers. Relaxed American summer style.', image: 'outfit-american-female-2.jpg', tags: ['美式', '夏季', '女裝'] },
  { title: 'Varsity Spirit', description: 'Varsity jacket with athletic wear. Classic American college style.', image: 'outfit-american-male-3.jpg', tags: ['美式', '學院風', '男裝'] },
  { title: 'Romantic Pastels', description: 'Flowy pastel dress with ribbons and lace details. Sweet romantic style.', image: 'outfit-sweet-female-1.jpg', tags: ['甜美風', '浪漫', '女裝'] },
  { title: 'Fairy Tale Dream', description: 'Tulle skirt with embellished top. Romantic fairy-like feminine style.', image: 'outfit-sweet-female-2.jpg', tags: ['甜美風', '夢幻', '女裝'] },
  { title: 'Garden Party', description: 'Ruffled blouse with floral midi skirt. Romantic garden party style.', image: 'outfit-sweet-female-3.jpg', tags: ['甜美風', '花園', '女裝'] },
  { title: '70s Retro Vibes', description: '70s inspired flared pants and patterned shirt. Nostalgic vintage style.', image: 'outfit-vintage-male-1.jpg', tags: ['懷舊風', '70年代', '男裝'] },
  { title: '80s Pop Color', description: '80s inspired high-waisted jeans and colorful sweater. Vibrant retro fashion.', image: 'outfit-vintage-female-1.jpg', tags: ['懷舊風', '80年代', '女裝'] },
  { title: '90s Grunge', description: 'Denim overalls with striped shirt. 90s grunge aesthetic.', image: 'outfit-vintage-male-2.jpg', tags: ['懷舊風', '90年代', '男裝'] },
  { title: '50s Elegance', description: 'Midi skirt with blouse. 50s inspired elegant retro style.', image: 'outfit-vintage-female-2.jpg', tags: ['懷舊風', '50年代', '女裝'] },
  { title: '80s Corduroy Cool', description: 'Corduroy jacket with turtleneck. 80s inspired vintage fashion.', image: 'outfit-vintage-male-3.jpg', tags: ['懷舊風', '80年代', '男裝'] },
  { title: '🎄 Festive Red Sweater', description: 'Cozy red Christmas sweater with holiday patterns. Perfect for Christmas celebrations!', image: 'outfit-christmas-male-1.jpg', tags: ['聖誕裝', '節慶', '男裝'] },
  { title: '🎄 Elegant Holiday Dress', description: 'Stunning red dress with festive accessories. Glamorous Christmas party style.', image: 'outfit-christmas-female-1.jpg', tags: ['聖誕裝', '派對', '女裝'] },
];

const SeedOfficialOutfits = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    setProgress(0);
    
    try {
      // Upload images to storage and create outfit records
      for (let i = 0; i < outfitsData.length; i++) {
        const outfit = outfitsData[i];
        
        // For now, use placeholder image URL - you'll need to upload actual images
        const imageUrl = `https://wzcdiirglluyrueqllla.supabase.co/storage/v1/object/public/outfit-images/${outfit.image}`;
        
        const { error } = await supabase
          .from('outfits')
          .insert({
            user_id: OFFICIAL_USER_ID,
            title: outfit.title,
            description: outfit.description,
            image_url: imageUrl,
            style_tags: outfit.tags,
          });

        if (error) {
          console.error(`Error inserting outfit ${i + 1}:`, error);
        }
        
        setProgress(Math.round(((i + 1) / outfitsData.length) * 100));
      }
      
      toast({
        title: 'Success!',
        description: `Successfully created ${outfitsData.length} official outfits!`,
      });
    } catch (error) {
      console.error('Error seeding outfits:', error);
      toast({
        title: 'Error',
        description: 'Failed to create some outfits. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Seed Official Outfits</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click the button below to create 30 official outfit posts (15 male, 15 female) with various styles including Korean, European, Japanese, American, Sweet, Vintage, and Christmas themes.
      </p>
      <Button onClick={handleSeed} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? `Creating... ${progress}%` : 'Create 30 Official Outfits'}
      </Button>
    </div>
  );
};

export default SeedOfficialOutfits;
