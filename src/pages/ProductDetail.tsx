import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Check, MessageSquare, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppSetting } from "@/hooks/useAppSettings";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: adminPhone } = useAppSetting("admin_phone");

  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          profiles:seller_id (username),
          categories:category_id (name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isService = product?.type === 'service';

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      imageUrl: product.image_url || "",
      sellerName: product.profiles?.username || "Unknown",
    });
    
    setAddedToCart(true);
    toast({
      title: "Added to Cart",
      description: `${product.title} has been added to your cart.`,
    });
    
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleContactAdmin = () => {
    if (!product || !adminPhone) return;
    
    const message = encodeURIComponent(
      `Hi! I'm interested in the service: "${product.title}" listed on Crimson. Could you help me with more details?`
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-24 bg-card" />
          <Skeleton className="aspect-square w-full rounded-xl bg-card" />
          <Skeleton className="h-8 w-3/4 bg-card" />
          <Skeleton className="h-6 w-1/4 bg-card" />
          <Skeleton className="h-24 w-full bg-card" />
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Product not found</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4"
        >
          <div className="aspect-square rounded-xl overflow-hidden bg-card relative">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {isService && (
              <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <MessageSquare size={14} />
                Service
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 space-y-4"
        >
          {product.categories?.name && (
            <span className="inline-block bg-primary/20 text-primary text-sm px-3 py-1 rounded-full">
              {product.categories.name}
            </span>
          )}

          <h1 className="text-2xl font-gothic text-foreground">
            {product.title}
          </h1>

          <div className="flex items-center gap-3">
            {isService && Number(product.price) === 0 ? (
              <span className="text-xl font-semibold text-muted-foreground">
                Contact for pricing
              </span>
            ) : (
              <span className="text-3xl font-bold text-primary">
                Rs {Number(product.price).toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-muted-foreground">
            Listed by <span className="text-foreground">{product.profiles?.username || "Unknown"}</span>
          </p>

          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || "No description provided."}
            </p>
          </div>

          {product.contact_info && (product.contact_public || isAdmin) && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Phone size={18} /> Contact
                {!product.contact_public && isAdmin && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin only</span>
                )}
              </h3>
              <p className="text-muted-foreground">{product.contact_info}</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            {isService ? (
              <Button
                onClick={handleContactAdmin}
                disabled={!adminPhone}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 crimson-glow"
              >
                <MessageSquare size={24} className="mr-2" />
                Contact Admin
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 crimson-glow"
                disabled={addedToCart}
              >
                {addedToCart ? (
                  <>
                    <Check size={24} className="mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={24} className="mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            )}
          </motion.div>

          <p className="text-sm text-muted-foreground text-center pt-2">
            {isService 
              ? "Connect with our admin to discuss this service." 
              : "Crimson acts as a mediator. A service fee may apply."}
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;
