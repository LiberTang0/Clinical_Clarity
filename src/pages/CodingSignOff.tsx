import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../components/Button";

export default function CodingSignOff() {
  const location = useLocation();
  const navigate = useNavigate();
  const { codes } = location.state || { codes: [] };

  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleProceed = () => {
    navigate("/visit/orders");
  };

  return (
    <div className="pt-8 pb-40 px-4 max-w-4xl mx-auto">
      <section className="mb-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-primary font-bold tracking-widest uppercase">Clinical Session ID: 99214-X04</span>
          <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-background">Diagnosis Selection</h2>
          <p className="text-on-surface-variant font-medium">Verify suggested ICD-10 codes based on today's clinical notes.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {codes && codes.length > 0 ? (
          codes.map((c: any, index: number) => (
            <div 
              key={index} 
              className={`${selectedCodes.includes(c.code) ? 'bg-surface-container-lowest border-primary' : 'bg-surface-container-low border-outline'} border-l-4 p-5 flex items-center justify-between transition-all active:scale-[0.98]`}
            >
              <div className={`flex flex-col gap-2 ${selectedCodes.includes(c.code) ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-2xl font-bold ${selectedCodes.includes(c.code) ? 'text-primary' : 'text-on-surface-variant'} tracking-tighter`}>{c.code}</span>
                  <div className={`${selectedCodes.includes(c.code) ? 'bg-primary-fixed' : 'bg-surface-container-high'} px-2 py-0.5 rounded-sm`}>
                    <span className={`font-mono text-[10px] ${selectedCodes.includes(c.code) ? 'text-on-primary-fixed' : 'text-on-surface-variant'} font-bold uppercase`}>
                      AI {c.confidence} Confidence
                    </span>
                  </div>
                </div>
                <p className="font-headline font-bold text-lg text-on-surface leading-tight">{c.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={selectedCodes.includes(c.code)}
                  onChange={() => toggleCode(c.code)}
                  className="w-8 h-8 rounded-sm border-2 border-outline text-primary focus:ring-primary cursor-pointer" 
                />
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 bg-surface-container-low text-on-surface-variant">No codes suggested.</div>
        )}
      </div>

      <Button variant="outline" fullWidth className="mt-6 py-5 border-dashed" icon={<span className="material-symbols-outlined text-outline group-hover:text-primary">add_circle</span>}>
        Add Diagnosis/Code
      </Button>

      <div className="mt-12 bg-surface-container-high p-6 rounded-sm">
        <h3 className="font-mono text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Verification Metadata</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-bold">Billing Provider</span>
            <span className="font-mono text-sm font-bold text-on-background">DR. SARAH CHEN, MD</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] text-outline uppercase font-bold">EM Level Predicted</span>
            <span className="font-mono text-sm font-bold text-primary">LEVEL 4 (COMPLEX)</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t-2 border-slate-100 dark:border-slate-900 p-6 flex flex-col gap-4">
        <div className="w-full max-w-4xl mx-auto">
          <Button 
            onClick={handleProceed}
            size="lg"
            fullWidth
            icon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>signature</span>}
          >
            SIGN & PROCEED TO ORDERS
          </Button>
        </div>
      </div>
    </div>
  );
}
