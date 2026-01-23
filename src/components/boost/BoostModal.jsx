import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Eye, Clock, Check, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ boostType, targetId, duration, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message);
        setProcessing(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + window.location.pathname,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Boost activated!');
        onSuccess();
      }
    } catch (err) {
      toast.error('Payment failed');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Activate Boost
          </>
        )}
      </Button>
    </form>
  );
}

export default function BoostModal({ type, targetId, targetTitle, onClose, onBoostActivated }) {
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      days: 7,
      price: 10,
      label: '7 Days',
      popular: false,
      benefits: ['Featured placement', '3x visibility', 'Priority in search']
    },
    {
      days: 30,
      price: 25,
      label: '30 Days',
      popular: true,
      benefits: ['Featured placement', '5x visibility', 'Priority in search', 'Badge highlight']
    }
  ];

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createBoostPayment', {
        boost_type: type,
        target_id: targetId,
        duration_days: selectedDuration
      });
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      toast.error('Failed to initiate payment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    if (onBoostActivated) onBoostActivated();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Boost {type === 'profile' ? 'Your Profile' : 'This Opportunity'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Target Info */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-gray-600 mb-1">
              {type === 'profile' ? 'Boosting' : 'Opportunity'}
            </p>
            <p className="font-semibold text-gray-900">{targetTitle}</p>
          </div>

          {!clientSecret ? (
            <>
              {/* Benefits */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white border rounded-lg">
                  <Eye className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 mb-1">More Views</p>
                  <p className="text-xs text-gray-600">3-5x visibility increase</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 mb-1">Featured</p>
                  <p className="text-xs text-gray-600">Top of search results</p>
                </div>
                <div className="text-center p-4 bg-white border rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 mb-1">Highlighted</p>
                  <p className="text-xs text-gray-600">Stand out with badge</p>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Choose Your Plan</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.days}
                      onClick={() => setSelectedDuration(plan.days)}
                      className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                        selectedDuration === plan.days
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          Most Popular
                        </Badge>
                      )}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-600">/ {plan.label}</span>
                      </div>
                      <ul className="space-y-2">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={initiatePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue to Payment
                  </>
                )}
              </Button>
            </>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                boostType={type}
                targetId={targetId}
                duration={selectedDuration}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}