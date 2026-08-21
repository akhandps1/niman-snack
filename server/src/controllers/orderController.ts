import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { adminDb } from '../config/firebase-admin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, address, phone, coordinates, subtotal, deliveryCharge, couponCode, discountAmount, deliveryType, paymentMethod } = req.body;
    const uid = (req as any).user.uid;

    // Server-side coupon validation
    let validatedDiscount = 0;
    let validatedCouponCode = null;

    if (couponCode) {
      const couponSnap = await adminDb
        .collection('coupons')
        .where('code', '==', couponCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();

        // Check expiry
        if (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) {
          const orderSubtotal = subtotal || 0;

          // Check min order value
          if (!coupon.minOrderValue || orderSubtotal >= coupon.minOrderValue) {
            if (coupon.discountType === 'percentage') {
              validatedDiscount = Math.floor((orderSubtotal * coupon.discountValue) / 100);
              if (coupon.maxDiscount) validatedDiscount = Math.min(validatedDiscount, coupon.maxDiscount);
            } else {
              validatedDiscount = coupon.discountValue;
            }
            validatedDiscount = Math.min(validatedDiscount, orderSubtotal);
            validatedCouponCode = couponCode;

            // Increment usage count
            await adminDb.collection('coupons').doc(couponSnap.docs[0].id).update({
              usageCount: (coupon.usageCount || 0) + 1,
            });
          }
        }
      }
    }

    const orderSubtotal = subtotal || req.body.amount || 500;
    const orderDeliveryCharge = typeof deliveryCharge === 'number' ? deliveryCharge : 0;
    const finalAmount = Math.max(0, orderSubtotal + orderDeliveryCharge - validatedDiscount);

    const isCash = paymentMethod === 'CASH';
    let razorpayOrderId = null;
    
    if (!isCash) {
      const options = {
        amount: finalAmount * 100, // paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      };
      const razorpayOrder = await razorpay.orders.create(options);
      razorpayOrderId = razorpayOrder.id;
    }

    // Generate 4-digit OTP for delivery verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newOrder = {
      userId: uid,
      items,
      address,
      phone: phone || '',
      coordinates: coordinates || null,
      subtotal: orderSubtotal,
      deliveryCharge: orderDeliveryCharge,
      couponCode: validatedCouponCode,
      discountAmount: validatedDiscount,
      totalAmount: finalAmount,
      status: isCash ? 'PLACED' : 'PENDING_PAYMENT',
      paymentMethod: paymentMethod || 'ONLINE',
      paymentId: null,
      razorpayOrderId: razorpayOrderId,
      otp,
      deliveryType: deliveryType || 'DELIVERY',
      deliveryLocation: null,
      assignedDeliveryId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // --- Stock Check & Decrement ---
    const batch = adminDb.batch();
    const itemsToDecrement: { ref: any; newStock: number }[] = [];

    for (const item of items) {
      const foodRef = adminDb.collection('food_items').doc(item.id);
      const foodDoc = await foodRef.get();
      if (!foodDoc.exists) {
        return res.status(400).json({ error: `Item ${item.title} not found.` });
      }
      const foodData = foodDoc.data();
      const currentStock = foodData?.stockQuantity || 0;
      if (currentStock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${item.title}. Only ${currentStock} left.` });
      }
      itemsToDecrement.push({ ref: foodRef, newStock: currentStock - item.quantity });
    }

    const orderRef = await adminDb.collection('orders').add(newOrder);

    // Commit stock changes
    for (const update of itemsToDecrement) {
      batch.update(update.ref, { stockQuantity: update.newStock });
    }
    await batch.commit();

    if (isCash) {
      return res.status(200).json({
        success: true,
        isCash: true,
        dbOrderId: orderRef.id,
      });
    }

    return res.status(200).json({
      success: true,
      orderId: razorpayOrderId,
      dbOrderId: orderRef.id,
      amount: finalAmount * 100,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock_secret')
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      await adminDb.collection('orders').doc(dbOrderId).update({
        status: 'PLACED',
        paymentId: razorpay_payment_id,
        updatedAt: new Date().toISOString(),
      });
      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      await adminDb.collection('orders').doc(dbOrderId).update({
        status: 'PAYMENT_FAILED',
        updatedAt: new Date().toISOString(),
      });
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
};
