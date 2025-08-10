import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, authorizeRoles } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { Payment, Order } from '../../../../models';
import { verifyBankTransferPayment, processFarmerPayout } from '../../../../lib/payment';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    const { id } = params;
    
    const payment = await Payment.findById(id)
      .populate('order', 'total status items')
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone');
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Check if user has access to this payment
    const hasAccess = user.role === 'admin' || 
                     payment.buyer._id.toString() === user._id.toString() ||
                     payment.farmer._id.toString() === user._id.toString();
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      payment: {
        id: payment._id,
        order: payment.order,
        buyer: payment.buyer,
        farmer: payment.farmer,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        commission: payment.commission,
        farmerPayout: payment.farmerPayout,
        metadata: payment.metadata,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Payment details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const authResult = await authenticateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const { user } = authResult;
    const { id } = params;
    const body = await request.json();
    
    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Check if user has permission to update this payment
    const hasPermission = user.role === 'admin' || 
                         payment.farmer.toString() === user._id.toString();
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    const { action, verificationData, notes } = body;
    
    switch (action) {
      case 'verify_bank_transfer':
        if (user.role !== 'admin' && payment.farmer.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'Only admin or farmer can verify bank transfers' }, { status: 403 });
        }
        
        if (!verificationData) {
          return NextResponse.json({ error: 'Verification data required' }, { status: 400 });
        }
        
        const updatedPayment = await verifyBankTransferPayment(id, verificationData);
        
        return NextResponse.json({
          success: true,
          payment: {
            id: updatedPayment._id,
            status: updatedPayment.status,
            farmerPayout: updatedPayment.farmerPayout,
            updatedAt: updatedPayment.updatedAt
          }
        });
        
      case 'process_payout':
        if (user.role !== 'admin') {
          return NextResponse.json({ error: 'Only admin can process payouts' }, { status: 403 });
        }
        
        const payoutPayment = await processFarmerPayout(id);
        
        return NextResponse.json({
          success: true,
          payment: {
            id: payoutPayment._id,
            farmerPayout: payoutPayment.farmerPayout,
            updatedAt: payoutPayment.updatedAt
          }
        });
        
      case 'update_notes':
        payment.notes = notes;
        await payment.save();
        
        return NextResponse.json({
          success: true,
          payment: {
            id: payment._id,
            notes: payment.notes,
            updatedAt: payment.updatedAt
          }
        });
        
      case 'confirm_cod':
        if (payment.paymentMethod !== 'COD') {
          return NextResponse.json({ error: 'This action is only for COD payments' }, { status: 400 });
        }
        
        if (user.role !== 'admin' && payment.farmer.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'Only admin or farmer can confirm COD payments' }, { status: 403 });
        }
        
        payment.status = 'COMPLETED';
        payment.farmerPayout.status = 'PENDING';
        payment.metadata.codConfirmed = true;
        payment.metadata.confirmedBy = user._id;
        payment.metadata.confirmedAt = new Date();
        
        // Update order status
        await Order.findByIdAndUpdate(payment.order, { status: 'CONFIRMED' });
        
        await payment.save();
        
        return NextResponse.json({
          success: true,
          payment: {
            id: payment._id,
            status: payment.status,
            farmerPayout: payment.farmerPayout,
            metadata: payment.metadata,
            updatedAt: payment.updatedAt
          }
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
