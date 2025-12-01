import { Heart, MessageCircle, Share2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutfitCardProps {
  image: string;
  title: string;
  username: string;
  likes: number;
  comments: number;
  tags: string[];
}

const OutfitCard = ({ image, title, username, likes, comments, tags }: OutfitCardProps) => {
  return (
    <div className="outfit-card group">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Overlay Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-playfair text-lg font-semibold mb-2 line-clamp-1">
          {title}
        </h3>
        
        {/* User */}
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center mr-3">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm text-muted-foreground">@{username}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-4 w-4" />
              <span>{likes}</span>
            </button>
            <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span>{comments}</span>
            </button>
          </div>
          <Button size="sm" variant="ghost">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;