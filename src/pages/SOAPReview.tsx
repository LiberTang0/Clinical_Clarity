import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../components/Button";

export default function SOAPReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { soapNote, codes } = location.state || {};

  const [approvedSections, setApprovedSections] = useState<Record<string, boolean>>({});

  const toggleApprove = (section: string) => {
    setApprovedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const allApproved = ["subjective", "objective", "assessment", "plan"].every(
    (s) => approvedSections[s]
  );

  const handleComplete = () => {
    navigate("/visit/coding", { state: { codes } });
  };

  if (!soapNote) {
    return <div className="p-8">No SOAP note data available.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-24">
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <p className="font-mono text-primary font-bold text-sm tracking-widest uppercase mb-1">Encounter Summary</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-on-background">Patient SOAP Review</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="bg-secondary-container px-3 py-1 rounded-sm font-mono text-[11px] font-bold text-on-secondary-container">MALE_42</span>
            <span className="bg-secondary-container px-3 py-1 rounded-sm font-mono text-[11px] font-bold text-on-secondary-container">POST_OP_DAY_03</span>
            <span className="bg-primary-container px-3 py-1 rounded-sm font-mono text-[11px] font-bold text-on-primary">STATUS: CRITICAL_SYNC</span>
          </div>
        </div>
        <div className="hidden md:block">
          <Button 
            onClick={handleComplete}
            disabled={!allApproved}
            size="lg"
          >
            APPROVE_ALL_SECTIONS
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {/* Subjective */}
        <article className={`bg-surface-container-lowest border-l-4 ${approvedSections.subjective ? 'border-primary' : 'border-outline'} p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start`}>
          <div className={`w-12 h-12 ${approvedSections.subjective ? 'bg-primary' : 'bg-outline'} flex items-center justify-center shrink-0`}>
            <span className="text-on-primary font-black text-2xl">S</span>
          </div>
          <div className="flex-1">
            <h3 className={`text-2xl font-extrabold tracking-tight mb-4 ${approvedSections.subjective ? 'text-primary' : 'text-on-background'} uppercase`}>Subjective</h3>
            <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-medium">
              {soapNote.subjective || "No subjective data."}
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" icon={<span className="material-symbols-outlined text-sm">edit</span>}>
                EDIT_SECTION
              </Button>
              <Button 
                onClick={() => toggleApprove('subjective')}
                variant={approvedSections.subjective ? "primary" : "secondary"}
                icon={<span className="material-symbols-outlined text-sm">check_circle</span>}
              >
                {approvedSections.subjective ? 'APPROVED' : 'APPROVE'}
              </Button>
            </div>
          </div>
        </article>

        {/* Objective */}
        <article className={`bg-surface-container-lowest border-l-4 ${approvedSections.objective ? 'border-primary' : 'border-outline'} p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start`}>
          <div className={`w-12 h-12 ${approvedSections.objective ? 'bg-primary' : 'bg-on-background'} flex items-center justify-center shrink-0`}>
            <span className="text-on-primary font-black text-2xl">O</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold tracking-tight mb-4 text-on-background uppercase">Objective</h3>
            <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-medium">
              {soapNote.objective || "No objective data."}
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" icon={<span className="material-symbols-outlined text-sm">edit</span>}>
                EDIT_SECTION
              </Button>
              <Button 
                onClick={() => toggleApprove('objective')}
                variant={approvedSections.objective ? "primary" : "secondary"}
                icon={<span className="material-symbols-outlined text-sm">check_circle</span>}
              >
                {approvedSections.objective ? 'APPROVED' : 'APPROVE'}
              </Button>
            </div>
          </div>
        </article>

        {/* Assessment */}
        <article className={`bg-surface-container-lowest border-l-4 ${approvedSections.assessment ? 'border-tertiary' : 'border-outline'} p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start`}>
          <div className={`w-12 h-12 ${approvedSections.assessment ? 'bg-tertiary' : 'bg-outline'} flex items-center justify-center shrink-0`}>
            <span className="text-on-tertiary font-black text-2xl">A</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-extrabold tracking-tight text-tertiary uppercase">Assessment</h3>
            </div>
            <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed font-medium">
              {soapNote.assessment || "No assessment data."}
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" icon={<span className="material-symbols-outlined text-sm">edit</span>}>
                EDIT_SECTION
              </Button>
              <Button 
                onClick={() => toggleApprove('assessment')}
                variant={approvedSections.assessment ? "tertiary" : "secondary"}
                icon={<span className="material-symbols-outlined text-sm">check_circle</span>}
              >
                {approvedSections.assessment ? 'APPROVED' : 'APPROVE'}
              </Button>
            </div>
          </div>
        </article>

        {/* Plan */}
        <article className={`bg-surface-container-lowest border-l-4 ${approvedSections.plan ? 'border-primary' : 'border-outline'} p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start`}>
          <div className={`w-12 h-12 ${approvedSections.plan ? 'bg-primary' : 'bg-outline'} flex items-center justify-center shrink-0`}>
            <span className="text-on-primary font-black text-2xl">P</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold tracking-tight mb-4 text-primary uppercase">Plan</h3>
            <ul className="space-y-4 mb-8">
              {soapNote.plan && soapNote.plan.length > 0 ? (
                soapNote.plan.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="font-mono text-primary font-bold mt-1">{(index + 1).toString().padStart(2, '0')}.</span>
                    <p className="text-xl md:text-2xl text-on-surface-variant font-medium">{item}</p>
                  </li>
                ))
              ) : (
                <p className="text-xl md:text-2xl text-on-surface-variant font-medium">No plan data.</p>
              )}
            </ul>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" icon={<span className="material-symbols-outlined text-sm">edit</span>}>
                EDIT_SECTION
              </Button>
              <Button 
                onClick={() => toggleApprove('plan')}
                variant={approvedSections.plan ? "primary" : "secondary"}
                icon={<span className="material-symbols-outlined text-sm">check_circle</span>}
              >
                {approvedSections.plan ? 'APPROVED' : 'APPROVE'}
              </Button>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-12 md:hidden">
        <Button 
          onClick={handleComplete}
          disabled={!allApproved}
          size="lg"
          fullWidth
        >
          COMPLETE_REVIEW_AND_CLOSE
        </Button>
      </div>
    </div>
  );
}
