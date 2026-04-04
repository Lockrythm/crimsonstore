import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, Truck, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useAppSetting } from "@/hooks/useAppSettings";

const DELIVERY_FEE = 250;

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const { data: adminPhone } = useAppSetting("admin_phone");

  const finalTotal = homeDelivery ? totalPrice + DELIVERY_FEE : totalPrice;

  const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CR-${timestamp}${random}`;
  };

  const generateWhatsAppMessage = () => {
    const orderId = generateOrderId();
    const username = user?.email?.split("@")[0] || "Guest";
    
    let message = `Hello, I want to place an order from Crimson.\n\nItems:\n`;
    
    items.forEach((item) => {
      message += `- ${item.title} — Rs ${item.price.toLocaleString()} × ${item.quantity}\n`;
    });
    
    message += `\nSubtotal: Rs ${totalPrice.toLocaleString()}\n`;
    
    if (homeDelivery) {
      message += `Home Delivery: Rs ${DELIVERY_FEE}\n`;
      message += `Delivery Address: ${deliveryAddress}\n`;
    }
    
    message += `\nTotal: Rs ${finalTotal.toLocaleString()}\n`;
    message += `Delivery: ${homeDelivery ? "Home Delivery" : "Self Pickup"}\n`;
    message += `Order ID: ${orderId}\n`;
    message += `Username: ${username}`;
    
    return encodeURIComponent(message);
  };

  const handleContactAdmin = () => {
    if (!adminPhone) return;
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ShoppingCart size={64} className="text-muted-foreground mb-4 mx-auto" />
            <h2 className="text-2xl font-gothic text-foreground mb-2">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our marketplace and add items to your cart
            </p>
            <Button onClick={() => navigate("/marketplace")} className="bg-primary hover:bg-primary/90">
              Browse Marketplace
            </Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-gothic text-foreground flex items-center gap-3">
            <ShoppingCart className="text-primary" size={28} />
            Your Cart
          </h1>
          <p className="text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </motion.div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-4 p-4 bg-card rounded-xl border border-border"
            >
              {/* Image */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-primary font-bold text-lg mt-1">
                  Rs {item.price.toLocaleString()}
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="text-foreground font-medium w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Clear Cart */}
        <Button
          variant="outline"
          className="w-full mb-6 text-muted-foreground"
          onClick={clearCart}
        >
          Clear Cart
        </Button>

        {/* Home Delivery Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl p-4 border border-border mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck size={20} className="text-primary" />
              <div>
                <p className="font-medium text-foreground">Home Delivery</p>
                <p className="text-sm text-muted-foreground">Rs {DELIVERY_FEE} delivery fee</p>
              </div>
            </div>
            <Checkbox
              checked={homeDelivery}
              onCheckedChange={(checked) => {
                setHomeDelivery(checked === true);
                if (!checked) setDeliveryAddress("");
              }}
              className="h-5 w-5"
            />
          </div>
          
          {/* Delivery Address Field */}
          {homeDelivery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Delivery Address</label>
              </div>
              <Input
                placeholder="Enter your complete home address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="bg-background"
                maxLength={500}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-4 border border-border mb-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-3">Order Summary</h3>
          <div className="flex justify-between text-muted-foreground mb-2">
            <span>Subtotal</span>
            <span>Rs {totalPrice.toLocaleString()}</span>
          </div>
          {homeDelivery && (
            <div className="flex justify-between text-muted-foreground mb-2">
              <span>Home Delivery</span>
              <span>Rs {DELIVERY_FEE}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground mb-2">
            <span>Service Fee</span>
            <span className="text-sm">Handled by Admin</span>
          </div>
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex justify-between text-foreground">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-xl text-primary">
                Rs {finalTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Notice */}
        <p className="text-sm text-muted-foreground text-center mb-4 px-4">
          Crimson acts as a mediator. A service fee may apply.
        </p>

        {/* Contact Admin Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleContactAdmin}
            disabled={!adminPhone}
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
          >
            <MessageCircle size={24} className="mr-2" />
            Contact Admin to Order
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Cart;
