import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

interface IntroWizardModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function IntroWizardModal({ open, onClose, onContinue }: IntroWizardModalProps) {
  const { t } = useApp();

  const steps = [
    { number: 1, label: t("submodelService"), active: true },
    { number: 2, label: t("digitalTwinRegistry"), active: false },
    { number: 3, label: t("edc"), active: false },
    { number: 4, label: t("edcRegistration"), active: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="intro-wizard-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-4">
            {t("introduction")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-6" data-testid="intro-description">
            {t("whatUserCanDo")}
          </p>
          
          {/* 4-step process diagram */}
          <div className="flex items-center justify-between mb-8" data-testid="process-steps">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                    step.active 
                      ? "bg-[var(--arena-orange)] text-white" 
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {step.number}
                  </div>
                  <span className="text-sm font-medium text-center max-w-20">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-gray-300 mx-4 min-w-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="intro-cancel-button"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onContinue}
            className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white"
            data-testid="intro-continue-button"
          >
            {t("continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
