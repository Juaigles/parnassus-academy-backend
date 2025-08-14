# 🚀 API Documentation - Purchase System

## 🔐 **Authentication**
All endpoints require authentication via Bearer token except webhooks.
```
Authorization: Bearer <jwt_token>
```

## 💳 **Purchase Endpoints**

### **Create Purchase Intent**
```http
POST /api/courses/:courseId/purchase
Content-Type: application/json

{
  "discountCode": "SAVE20" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchaseId": "676d8a4b2c1e3f4a567890ab",
    "clientSecret": "pi_1234567890_secret_1234",
    "originalAmount": 9900,
    "finalAmount": 7920,
    "discount": {
      "code": "SAVE20",
      "type": "percentage",
      "value": 20
    },
    "currency": "eur"
  }
}
```

### **Check Course Access**
```http
GET /api/courses/:courseId/access
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "purchased", // "admin" | "owner" | "purchased" | "not_purchased"
    "accessType": "full", // "preview" | "full"
    "purchaseInfo": {
      "purchaseDate": "2024-01-15T10:30:00Z",
      "amount": 9900,
      "currency": "eur"
    }
  }
}
```

### **Get User Purchases**
```http
GET /api/users/purchases
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "676d8a4b2c1e3f4a567890ab",
      "course": {
        "id": "676d8a4b2c1e3f4a567890cd",
        "title": "Advanced React Development",
        "slug": "advanced-react-development"
      },
      "amount": 9900,
      "currency": "eur",
      "status": "completed",
      "purchaseDate": "2024-01-15T10:30:00Z",
      "refundableUntil": "2024-02-14T10:30:00Z",
      "canRefund": true
    }
  ]
}
```

### **Request Refund**
```http
POST /api/purchases/:purchaseId/refund
Content-Type: application/json

{
  "reason": "Not satisfied with content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "re_1234567890",
    "amount": 9900,
    "status": "pending",
    "estimatedDate": "2024-01-20T10:30:00Z"
  }
}
```

## 💝 **Wishlist Endpoints**

### **Get User Wishlist**
```http
GET /api/users/wishlist
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "course": {
        "id": "676d8a4b2c1e3f4a567890cd",
        "title": "Advanced React Development",
        "slug": "advanced-react-development",
        "price": {
          "amountCents": 9900,
          "currency": "EUR"
        }
      },
      "addedAt": "2024-01-10T10:30:00Z",
      "isOwned": false,
      "isPurchased": false
    }
  ]
}
```

### **Add to Wishlist**
```http
POST /api/users/wishlist/:courseId
```

**Response:**
```json
{
  "success": true,
  "message": "Course added to wishlist"
}
```

### **Remove from Wishlist**
```http
DELETE /api/users/wishlist/:courseId
```

**Response:**
```json
{
  "success": true,
  "message": "Course removed from wishlist"
}
```

## 👑 **Admin Endpoints**

### **Grant Course Access**
```http
POST /admin/purchases/:purchaseId/grant
Content-Type: application/json

{
  "reason": "Customer service resolution"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access granted successfully"
}
```

### **List All Purchases**
```http
GET /admin/purchases?status=completed&limit=50&skip=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "purchases": [...],
    "pagination": {
      "total": 150,
      "limit": 50,
      "skip": 0,
      "hasMore": true
    }
  }
}
```

## 🎯 **Frontend Integration Examples**

### **React Purchase Flow**
```javascript
// 1. Create purchase intent
const createPurchase = async (courseId, discountCode) => {
  const response = await fetch(`/api/courses/${courseId}/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ discountCode })
  });
  
  const { data } = await response.json();
  return data;
};

// 2. Process payment with Stripe
const processPayment = async (clientSecret) => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/courses/success`
    }
  });
  
  return { error, paymentIntent };
};

// 3. Check access after purchase
const checkAccess = async (courseId) => {
  const response = await fetch(`/api/courses/${courseId}/access`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data } = await response.json();
  return data;
};
```

### **Wishlist Component**
```javascript
const WishlistButton = ({ courseId, isInWishlist }) => {
  const toggleWishlist = async () => {
    const method = isInWishlist ? 'DELETE' : 'POST';
    
    await fetch(`/api/users/wishlist/${courseId}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Update local state
    setIsInWishlist(!isInWishlist);
  };
  
  return (
    <button onClick={toggleWishlist}>
      {isInWishlist ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
    </button>
  );
};
```

## ⚡ **Webhook Handling**

### **Stripe Webhook**
```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "metadata": {
        "purchaseId": "676d8a4b2c1e3f4a567890ab"
      }
    }
  }
}
```

## 🛡️ **Error Handling**

### **Common Error Responses**
```json
{
  "success": false,
  "error": "Course not found",
  "code": "COURSE_NOT_FOUND",
  "statusCode": 404
}
```

### **Error Codes**
- `COURSE_NOT_FOUND` - Course does not exist
- `ALREADY_PURCHASED` - User already owns this course
- `INSUFFICIENT_FUNDS` - Payment failed
- `DISCOUNT_INVALID` - Discount code is invalid or expired
- `REFUND_PERIOD_EXPIRED` - Beyond 30-day refund window
- `ACCESS_DENIED` - User doesn't have permission

## 📱 **Mobile Integration**

All endpoints work identically for mobile apps. Use the same authentication and request/response format.

## 🔄 **Real-time Updates**

Consider implementing WebSocket connections for:
- Purchase status updates
- Refund status changes
- Access grant notifications

```javascript
// WebSocket example
const ws = new WebSocket(`wss://api.yourapp.com/ws?token=${token}`);

ws.on('purchase_completed', (data) => {
  // Update UI with immediate access
  updateCourseAccess(data.courseId, true);
});
```

## 📊 **Analytics Integration**

Track key events:
```javascript
// Track purchase intent
analytics.track('Purchase Intent Created', {
  courseId,
  amount,
  currency,
  discountCode
});

// Track successful purchase
analytics.track('Purchase Completed', {
  courseId,
  amount,
  currency,
  paymentMethod
});
```

This API documentation provides everything needed for frontend integration with the purchase system.
