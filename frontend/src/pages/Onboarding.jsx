import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import VelvetLogo from '../components/icons/VelvetLogo';
import { profilesApi } from '@/api/profiles';

import { motion, AnimatePresence } from 'framer-motion';

import StepUsername from '../components/onboarding/StepUsername';
import StepGenderOrientation from '../components/onboarding/StepGenderOrientation';
import StepInterests from '../components/onboarding/StepInterests';
import StepLookingFor from '../components/onboarding/StepLookingFor';
import StepProfile from '../components/onboarding/StepProfile';
import StepPhotos from '../components/onboarding/StepPhotos';
import { differenceInYears, parseISO } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

const STEPS = [
  { component: StepUsername, label: 'Identity' },
  { component: StepGenderOrientation, label: 'About You' },
  { component: StepInterests, label: 'Interests' },
  { component: StepLookingFor, label: 'Looking For' },
  { component: StepPhotos, label: 'Photos' },
  { component: StepProfile, label: 'Profile' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onChange = (partial) => setData(prev => ({ ...prev, ...partial }));
  const { component: StepComponent } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const canContinue = () => {
    if (step === 0) {
      const age = data.date_of_birth ? differenceInYears(new Date(), parseISO(data.date_of_birth)) : 0;
      return data.username?.trim() && age >= 18 && data.city && data.country;
    }
    if (step === 1) return data.gender && data.orientation;
    if (step === 2) return (data.interests || []).length >= 3;
    if (step === 3) return data.looking_for;
    if (step === 4) return true; // photos are optional
    return true;
  };

  const handleFinish = async () => {
  setSaving(true);
  try {
    // Only the date of birth is sent; the server works out the age and checks 18+
    const { age: _age, ...rest } = data;
    await profilesApi.updateMyProfile({
      ...rest,
      photo_url: data.photos?.[0]?.url || '',
      onboarding_complete: true,
      is_active: true,
    });
    navigate('/Discover');
  } catch (error) {
    console.error('Onboarding failed:', error);
    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: error?.error || "Couldn't save your profile. Check your connection and try again.",
    });
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <VelvetLogo className="w-10 h-10" />
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">{step + 1} / {STEPS.length}</span>
            <p className="text-xs text-muted-foreground">{STEPS[step].label}</p>
          </div>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepComponent data={data} onChange={onChange} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="h-12 px-6">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
          disabled={!canContinue() || saving}
          className="flex-1 h-12 bg-gradient-to-b from-primary to-accent text-primary-foreground font-medium text-xs uppercase tracking-[0.25em] shadow-[0_0_30px_hsl(346_75%_36%/0.4)]"
        >
          {saving ? 'Setting up...' : isLast ? 'Step inside' : 'Continue'}
          {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}