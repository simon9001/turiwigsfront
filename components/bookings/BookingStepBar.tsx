'use client';

import { Check } from 'lucide-react';

interface BookingStepBarProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

const STEPS = [
  { number: 1, label: 'Service' },
  { number: 2, label: 'Technician' },
  { number: 3, label: 'Schedule' },
  { number: 4, label: 'Summary' },
  { number: 5, label: 'Confirm' },
];

export function BookingStepBar({ currentStep }: BookingStepBarProps) {
  return (
    <div className="w-full">
      {/* Mobile: step x of 5 + label */}
      <div className="flex items-center justify-between sm:hidden mb-1">
        <span className="text-xs font-medium" style={{ color: '#55534e' }}>
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#8b8881' }}>
          {STEPS.find((s) => s.number === currentStep)?.label}
        </span>
      </div>
      {/* Mobile progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden sm:hidden mb-4"
        style={{ background: '#dedcd7' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            background: '#171614',
            width: `${(currentStep / STEPS.length) * 100}%`,
          }}
        />
      </div>

      {/* Desktop: full step row */}
      <div className="hidden sm:flex items-center w-full mb-6">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step bubble + label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                  style={
                    isCompleted
                      ? {
                          background: '#2e2c28',
                          border: '2px solid #2e2c28',
                          color: '#fff',
                        }
                      : isActive
                      ? {
                          background: '#171614',
                          border: '2px solid #8b8881',
                          color: '#ffffff',
                          boxShadow: '0 0 0 3px rgba(23,22,20,0.2)',
                        }
                      : {
                          background: '#fff',
                          border: '2px solid #c9c6bf',
                          color: '#8b8881',
                        }
                  }
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{
                    color: isActive
                      ? '#8b8881'
                      : isCompleted
                      ? '#2e2c28'
                      : '#8b8881',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mt-[-18px]"
                  style={{
                    background: isCompleted ? '#2e2c28' : '#dedcd7',
                    transition: 'background 0.3s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
