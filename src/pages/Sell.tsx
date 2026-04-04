import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Tag, FileText, Image, BookOpen, Package, Wrench, MessageSquare, Phone } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useBookCategories, useMarketplaceCategories, useServiceCategories, useRequestCategories } from "@/hooks/useCategories";
import { useCreateProduct } from "@/hooks/useProducts";
import { uploadProductImage } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { validateImageFile } from "@/lib/fileValidation";

type ListingType = "book" | "item" | "service" | "request";

const listingTypes = [
  { value: "book" as ListingType, label: "Book", icon: BookOpen, description: "Academic or reading material" },
  { value: "item" as ListingType, label: "Product", icon: Package, description: "Physical goods" },
  { value: "service" as ListingType, label: "Service", icon: Wrench, description: "Skills, help, or offerings" },
  { value: "request" as ListingType, label: "Request", icon: MessageSquare, description: "Something you're looking for" },
];

const Sell = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: bookCategories = [] } = useBookCategories();
  const { data: marketplaceCategories = [] } = useMarketplaceCategories();
  const { data: serviceCategories = [] } = useServiceCategories();
  const { data: requestCategories = [] } = useRequestCategories();
  const createProduct = useCreateProduct();
  
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    contact: "",
    contactPublic: false,
  });

  // Get categories based on selected listing type
  const getFilteredCategories = () => {
    switch (listingType) {
      case "book": return bookCategories;
      case "item": return marketplaceCategories;
      case "service": return serviceCategories;
      case "request": return requestCategories;
      default: return [];
    }
  };

  const filteredCategories = getFilteredCategories();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast({ title: "Invalid file", description: validationError, variant: "destructive" });
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to list an item.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!listingType) {
      toast({
        title: "Select listing type",
        description: "Please select whether you're listing a Book, Product, or Service.",
        variant: "destructive",
      });
      return;
    }

    // Services and Requests don't require price
    const priceRequired = listingType !== "service" && listingType !== "request";
    if (!formData.title || (priceRequired && !formData.price) || !formData.category || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = '';
      
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, user.id);
      }
      
      await createProduct.mutateAsync({
        seller_id: user.id,
        category_id: formData.category,
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : 0,
        image_url: imageUrl,
        type: listingType as "book" | "item" | "service" | "request",
        ...(formData.contact ? { contact_info: formData.contact, contact_public: formData.contactPublic } : {}),
      });
      
      toast({
        title: "Item sent to the Coven",
        description: "Your listing is pending approval from the elders.",
      });
      
      setListingType("");
      setFormData({ title: "", price: "", category: "", description: "", contact: "", contactPublic: false });
      setImagePreview(null);
      setImageFile(null);
    } catch (error: any) {
      toast({
        title: "Failed to create listing",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-gothic text-foreground">Sign in to Sell</h1>
          <p className="text-muted-foreground text-center">
            You need to be signed in to list items for sale.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson-glow"
          >
            Sign In
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-gothic text-foreground mb-2">Create Listing</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            List your treasures for fellow creatures of the night
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Listing Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm md:text-base text-muted-foreground mb-2">
              Listing Type *
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {listingTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = listingType === type.value;
                return (
                  <motion.button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setListingType(type.value);
                      setFormData({ ...formData, category: "" });
                    }}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                      isSelected 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent size={24} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
            {listingType && (
              <p className="text-xs text-muted-foreground mt-2">
                {listingTypes.find(t => t.value === listingType)?.description}
              </p>
            )}
          </motion.div>
          {/* Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm text-muted-foreground mb-2">
              Item Image
            </label>
            <div 
              className="card-gothic aspect-square flex flex-col items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Image className="text-muted-foreground mb-2" size={48} />
                  <p className="text-muted-foreground text-sm">Tap to upload</p>
                </>
              )}
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm text-muted-foreground mb-2">
              <FileText size={14} className="inline mr-1" /> Title
            </label>
            <Input
              placeholder="What arcane artifact are you selling?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-card border-border focus:border-primary"
              required
            />
          </motion.div>

          {/* Price - Optional for services and requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm md:text-base text-muted-foreground mb-2">
              {listingType === "request" ? "Budget" : "Price"} (PKR) {(listingType === "service" || listingType === "request") && "(Optional)"}
            </label>
            <Input
              type="number"
              placeholder={(listingType === "service" || listingType === "request") ? "Enter amount in PKR or leave empty" : "0"}
              min="0"
              step="1"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-card border-border focus:border-primary"
              required={listingType !== "service" && listingType !== "request"}
            />
            {(listingType === "service" || listingType === "request") && (
              <p className="text-xs text-muted-foreground mt-1">
                {listingType === "request" ? "Leave empty if flexible" : "Leave empty for \"Contact for pricing\""}
              </p>
            )}
          </motion.div>

          {/* Category - Only show if listing type selected */}
          {listingType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm text-muted-foreground mb-2">
                <Tag size={14} className="inline mr-1" /> Category
              </label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm text-muted-foreground mb-2">
              Description
            </label>
            <Textarea
              placeholder="Describe your item in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-card border-border focus:border-primary min-h-[120px]"
              required
            />
          </motion.div>

          {/* Contact (Optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <label className="block text-sm text-muted-foreground mb-2">
              <Phone size={14} className="inline mr-1" /> Contact (Optional)
            </label>
            <Input
              placeholder="Phone number or name for buyers to reach you"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="bg-card border-border focus:border-primary"
            />
            {formData.contact && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-card border border-border">
                <Checkbox
                  id="contact-public"
                  checked={formData.contactPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, contactPublic: !!checked })}
                />
                <label htmlFor="contact-public" className="text-sm text-muted-foreground cursor-pointer">
                  Make contact <span className="text-foreground font-medium">public</span> (visible to everyone)
                </label>
              </div>
            )}
            {formData.contact && !formData.contactPublic && (
              <p className="text-xs text-muted-foreground mt-1">
                Contact will only be visible to admin
              </p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-crimson-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Upload className="mr-2 animate-pulse" size={18} />
                  Sending to the Coven...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={18} />
                  Submit for Approval
                </>
              )}
            </Button>
          </motion.div>
        </motion.form>
      </div>
    </AppLayout>
  );
};

export default Sell;
