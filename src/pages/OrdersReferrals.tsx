import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function OrdersReferrals() {
  const navigate = useNavigate();

  const handleFinalize = () => {
    navigate("/visit/finalization");
  };

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto p-6 md:p-10 pb-32">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="font-mono text-xs text-primary font-bold tracking-[0.2em] uppercase">Order Entry System</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-on-background">DIAGNOSTIC_SUITE</h2>
        </div>
        <div className="bg-surface-container-high p-4 border-l-4 border-primary">
          <div className="font-mono text-[10px] text-on-surface-variant uppercase mb-1">Patient_ID</div>
          <div className="font-mono text-sm font-bold">REF-884920-X</div>
          <div className="text-xs mt-1 text-on-surface-variant font-medium">Subject: Alexander Thorne (34M)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
              <h3 className="font-mono text-xs font-bold tracking-widest text-on-surface uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">medication</span>
                E-Prescriptions
              </h3>
              <span className="font-mono text-[10px] text-outline">COUNT: 02</span>
            </div>
            <div className="space-y-3">
              <label className="group flex items-center justify-between p-4 bg-white border border-outline hover:border-primary cursor-pointer transition-all">
                <div className="flex gap-4">
                  <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="w-6 h-6 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary focus:ring-0" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-on-background">Amoxicillin 500mg</div>
                    <div className="text-xs text-on-surface-variant">Oral Capsule • TID x 7 Days</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] bg-surface-container-low px-2 py-1">PHARM_ROUTED</div>
              </label>
              <label className="group flex items-center justify-between p-4 bg-white border border-outline hover:border-primary cursor-pointer transition-all">
                <div className="flex gap-4">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="w-6 h-6 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary focus:ring-0" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-on-background">Ibuprofen 600mg</div>
                    <div className="text-xs text-on-surface-variant">Oral Tablet • PRN Pain</div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-tertiary">CONTRA_RECOGNIZED</div>
              </label>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
              <h3 className="font-mono text-xs font-bold tracking-widest text-on-surface uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">science</span>
                Laboratory Orders
              </h3>
              <span className="font-mono text-[10px] text-outline">COUNT: 03</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col p-4 bg-surface-container-low border border-transparent hover:border-primary cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-sm font-black">CBC_W_DIFF</div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary focus:ring-0" />
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">Complete blood count with automated differential.</div>
                <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[9px] text-primary">PRIORITY: STAT</div>
              </label>
              <label className="flex flex-col p-4 bg-surface-container-low border border-transparent hover:border-primary cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-sm font-black">CMP_LEVELS</div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary focus:ring-0" />
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">Comprehensive metabolic panel. Fasting required.</div>
                <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[9px] text-on-surface-variant">PRIORITY: ROUTINE</div>
              </label>
              <label className="flex flex-col p-4 bg-surface-container-low border border-transparent hover:border-primary cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-mono text-sm font-black">TSH_REFLEX</div>
                  <input type="checkbox" className="w-5 h-5 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary focus:ring-0" />
                </div>
                <div className="text-xs text-on-surface-variant leading-relaxed">Thyroid stimulating hormone with reflex to T4.</div>
                <div className="mt-4 pt-2 border-t border-outline-variant/30 font-mono text-[9px] text-on-surface-variant">PRIORITY: ROUTINE</div>
              </label>
              <div className="flex flex-col p-4 border border-dashed border-outline-variant items-center justify-center group hover:bg-white transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-outline group-hover:text-primary mb-2">add_circle</span>
                <span className="font-mono text-[10px] font-bold text-outline">ADD_CUSTOM_LAB</span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-on-background text-white p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-mono text-xs font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">assignment_ind</span>
                Specialist Referrals
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <div className="font-mono text-sm font-bold text-primary-fixed">Cardiology</div>
                    <div className="text-[11px] text-slate-400 mt-1">Ref: Angina symptoms. Stress test recommended.</div>
                  </div>
                  <div className="h-6 w-12 bg-slate-800 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="h-4 w-4 bg-primary rounded-full translate-x-6"></div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <div className="font-mono text-sm font-bold text-slate-200">Endocrinology</div>
                    <div className="text-[11px] text-slate-400 mt-1">Ref: Management of Type II Diabetes.</div>
                  </div>
                  <div className="h-6 w-12 bg-slate-800 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="h-4 w-4 bg-slate-600 rounded-full translate-x-0"></div>
                  </div>
                </div>
              </div>
              <Button variant="outline" fullWidth className="mt-10 py-3 font-mono text-[10px] tracking-widest border-slate-700 hover:bg-slate-800 text-slate-300">
                Search Specialty_DB
              </Button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -mr-16 -mt-16 rounded-full blur-3xl"></div>
          </section>

          <section className="border-t-4 border-tertiary pt-6">
            <div className="font-mono text-[10px] font-bold text-tertiary mb-2 uppercase">Clinical Warnings</div>
            <div className="flex gap-3 items-start p-4 bg-tertiary/5">
              <span className="material-symbols-outlined text-tertiary text-lg">warning</span>
              <p className="text-xs text-on-surface-variant leading-tight">
                Patient has documented allergy to <span className="font-bold text-on-background">Penicillins</span>. Ensure Amoxicillin order is clinically justified before submission.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant p-4 md:p-6 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-8 items-center">
            <div className="font-mono">
              <div className="text-[10px] text-outline uppercase tracking-tight">Active_Queue</div>
              <div className="text-2xl font-black text-on-background">04 <span className="text-sm font-normal text-outline">ITEMS</span></div>
            </div>
            <div className="hidden md:block h-10 w-[1px] bg-outline-variant"></div>
            <div className="hidden md:flex gap-4">
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-1">RX: 1</span>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-1">LAB: 2</span>
              <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-1">REF: 1</span>
            </div>
          </div>
          <Button 
            onClick={handleFinalize}
            size="lg"
            className="w-full md:w-auto"
            icon={<span className="material-symbols-outlined">arrow_forward</span>}
          >
            Validate & View Superbill
          </Button>
        </div>
      </div>
    </div>
  );
}
