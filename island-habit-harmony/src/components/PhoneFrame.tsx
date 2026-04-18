import { ReactNode } from "react";

interface PhoneFrameProps {
  label: string;
  sublabel?: string;
  children: ReactNode;
}

export const PhoneFrame = ({ label, sublabel, children }: PhoneFrameProps) => (
  <div className="flex flex-col items-center gap-4">
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
    </div>
    <div className="text-center">
      <p className="text-sm font-bold text-foreground">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  </div>
);
