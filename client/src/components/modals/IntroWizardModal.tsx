import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { Check } from "lucide-react";

interface IntroWizardModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (deploymentData?: StepData) => void;
}

interface StepData {
  submodelService: { url: string; apiKey: string };
  digitalTwinRegistry: { url: string; credentials: string };
  edc: { name: string; version: string; bpn: string; endpoint: string };
  edcRegistration: { registryUrl: string; certificatePath: string };
}

export function IntroWizardModal({ open, onClose, onContinue }: IntroWizardModalProps) {
  const { t } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({
    submodelService: { url: "", apiKey: "" },
    digitalTwinRegistry: { url: "", credentials: "" },
    edc: { name: "", version: "", bpn: "", endpoint: "" },
    edcRegistration: { registryUrl: "", certificatePath: "" },
  });

  const steps = [
    { number: 1, label: t("submodelService"), completed: false },
    { number: 2, label: t("digitalTwinRegistry"), completed: false },
    { number: 3, label: t("edc"), completed: false },
    { number: 4, label: t("edcRegistration"), completed: false },
  ];

  const updateStepData = (step: keyof StepData, field: string, value: string) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...prev[step], [field]: value }
    }));
  };

  const isStepComplete = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return stepData.submodelService.url.trim() !== "" && stepData.submodelService.apiKey.trim() !== "";
      case 2:
        return stepData.digitalTwinRegistry.url.trim() !== "" && stepData.digitalTwinRegistry.credentials.trim() !== "";
      case 3:
        return stepData.edc.name.trim() !== "" && stepData.edc.version.trim() !== "" && 
               stepData.edc.bpn.trim() !== "" && stepData.edc.endpoint.trim() !== "";
      case 4:
        return stepData.edcRegistration.registryUrl.trim() !== "" && stepData.edcRegistration.certificatePath.trim() !== "";
      default:
        return false;
    }
  };

  const canProceedToNext = () => isStepComplete(currentStep);
  const allStepsComplete = () => steps.every((_, index) => isStepComplete(index + 1));

  const handleNext = () => {
    if (canProceedToNext()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else if (allStepsComplete()) {
        // Pass the collected data to the parent component
        onContinue(stepData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setStepData({
      submodelService: { url: "", apiKey: "" },
      digitalTwinRegistry: { url: "", credentials: "" },
      edc: { name: "", version: "", bpn: "", endpoint: "" },
      edcRegistration: { registryUrl: "", certificatePath: "" },
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("submodelService")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="submodel-url">Service URL</Label>
                  <Input
                    id="submodel-url"
                    type="url"
                    placeholder="https://submodel-service.example.com"
                    value={stepData.submodelService.url}
                    onChange={(e) => updateStepData("submodelService", "url", e.target.value)}
                    data-testid="submodel-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="submodel-apikey">API Key</Label>
                  <Input
                    id="submodel-apikey"
                    type="password"
                    placeholder="Enter API key"
                    value={stepData.submodelService.apiKey}
                    onChange={(e) => updateStepData("submodelService", "apiKey", e.target.value)}
                    data-testid="submodel-apikey-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("digitalTwinRegistry")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="registry-url">Registry URL</Label>
                  <Input
                    id="registry-url"
                    type="url"
                    placeholder="https://digital-twin-registry.example.com"
                    value={stepData.digitalTwinRegistry.url}
                    onChange={(e) => updateStepData("digitalTwinRegistry", "url", e.target.value)}
                    data-testid="registry-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="registry-credentials">Credentials</Label>
                  <Input
                    id="registry-credentials"
                    type="password"
                    placeholder="Enter credentials"
                    value={stepData.digitalTwinRegistry.credentials}
                    onChange={(e) => updateStepData("digitalTwinRegistry", "credentials", e.target.value)}
                    data-testid="registry-credentials-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("edc")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edc-name">{t("name")}</Label>
                  <Input
                    id="edc-name"
                    placeholder="Enter connector name"
                    value={stepData.edc.name}
                    onChange={(e) => updateStepData("edc", "name", e.target.value)}
                    data-testid="edc-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-version">{t("version")}</Label>
                  <Input
                    id="edc-version"
                    placeholder="e.g., 0.8.0"
                    value={stepData.edc.version}
                    onChange={(e) => updateStepData("edc", "version", e.target.value)}
                    data-testid="edc-version-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-bpn">BPN</Label>
                  <Input
                    id="edc-bpn"
                    placeholder="Business Partner Number"
                    value={stepData.edc.bpn}
                    onChange={(e) => updateStepData("edc", "bpn", e.target.value)}
                    data-testid="edc-bpn-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edc-endpoint">{t("endpoint")}</Label>
                  <Input
                    id="edc-endpoint"
                    type="url"
                    placeholder="https://edc.example.com"
                    value={stepData.edc.endpoint}
                    onChange={(e) => updateStepData("edc", "endpoint", e.target.value)}
                    data-testid="edc-endpoint-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("edcRegistration")}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="registry-url">Registry URL</Label>
                  <Input
                    id="registry-url"
                    type="url"
                    placeholder="https://edc-registry.example.com"
                    value={stepData.edcRegistration.registryUrl}
                    onChange={(e) => updateStepData("edcRegistration", "registryUrl", e.target.value)}
                    data-testid="registration-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="certificate-path">Certificate Path</Label>
                  <Input
                    id="certificate-path"
                    placeholder="/path/to/certificate.pem"
                    value={stepData.edcRegistration.certificatePath}
                    onChange={(e) => updateStepData("edcRegistration", "certificatePath", e.target.value)}
                    data-testid="certificate-path-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="intro-wizard-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-4">
            EDC Deployment Wizard
          </DialogTitle>
          <DialogDescription>
            Follow these steps to deploy your EDC connector. Complete each step before proceeding to the next.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8" data-testid="process-steps">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                    currentStep === step.number
                      ? "bg-[var(--arena-orange)] text-white" 
                      : isStepComplete(step.number)
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {isStepComplete(step.number) && currentStep !== step.number ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className="text-sm font-medium text-center max-w-20">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 min-w-8 ${
                    isStepComplete(step.number) ? "bg-green-500" : "bg-gray-300"
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="wizard-cancel-button"
            >
              {t("cancel")}
            </Button>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                data-testid="wizard-previous-button"
              >
                Previous
              </Button>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="bg-[var(--arena-orange)] hover:bg-[var(--arena-orange-hover)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="wizard-next-button"
          >
            {currentStep < 4 ? "Next" : allStepsComplete() ? "Complete Deployment" : "Complete Step"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
