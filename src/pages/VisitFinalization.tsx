import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import Button from "../components/Button";
import { handleFirestoreError, OperationType } from "../services/firestoreError";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function VisitFinalization() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [isSaving, setIsSaving] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  const handleComplete = async () => {
    if (!user) {
      alert("You must be logged in to save the encounter.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "encounters"), {
        userId: user.uid,
        patientName: "Sarah J. Miller",
        patientId: "PX-9920-A",
        date: new Date().toISOString(),
        provider: user.displayName || "Dr. Aris Thorne",
        location: "ST_JUDE_CLINIC_B",
        cptCode: "99214",
        totalCharges: 509.50,
        createdAt: serverTimestamp(),
      });
      navigate("/");
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, "encounters");
      } catch {
        // Error info logged by handleFirestoreError
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    try {
      if (window.self !== window.top) {
        setShowPrintWarning(true);
      } else {
        window.print();
      }
    } catch (e) {
      setShowPrintWarning(true);
    }
  };

  return (
    <>
      <div className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 pb-32 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-8">
          <section>
            <label className="font-mono text-[10px] uppercase tracking-widest text-outline mb-4 block">PATIENT_IDENTITY</label>
            <div className="bg-surface-container-lowest p-6 border-l-4 border-primary">
              <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-background mb-1">Sarah J. Miller</h2>
              <p className="font-mono text-xs text-on-surface-variant">DOB: 1982-05-14 (F)</p>
              <p className="font-mono text-xs text-on-surface-variant">ID: #PX-9920-A</p>
            </div>
          </section>
          
          <section>
            <label className="font-mono text-[10px] uppercase tracking-widest text-outline mb-4 block">VISIT_METRICS</label>
            <div className="bg-surface-container-low p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-sm font-semibold">Date</span>
                <span className="font-mono text-sm">2023-10-27</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-sm font-semibold">Provider</span>
                <span className="font-mono text-sm">{user?.displayName || "Dr. Aris Thorne"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                <span className="text-sm font-semibold">Location</span>
                <span className="font-mono text-sm">ST_JUDE_CLINIC_B</span>
              </div>
            </div>
          </section>
        </div>

        <div className="md:col-span-8 space-y-8">
          <section>
            <div className="flex justify-between items-end mb-4">
              <label className="font-mono text-[10px] uppercase tracking-widest text-outline block">PROCEDURE_CODING (CPT/HCPCS)</label>
              <span className="font-mono text-[10px] text-primary">UNIT_COUNT: 1</span>
            </div>
            <div className="bg-surface-container-highest p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-background">99214</h3>
                  <p className="text-on-surface-variant text-sm mt-1 max-w-md">Office or other outpatient visit for the evaluation and management of an established patient, which requires a moderate level of medical decision making.</p>
                </div>
                <div className="font-mono text-xl font-bold text-primary">$412.00</div>
              </div>
              
              <div className="pt-6 border-t-2 border-white/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary-container px-2 py-1 font-mono text-[10px] text-on-secondary-container">MOD_25</div>
                    <span className="text-sm">Extended Counseling (15m)</span>
                  </div>
                  <div className="font-mono text-sm font-medium">$97.50</div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary text-on-primary p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 font-label text-8xl -mr-10 -mt-5 pointer-events-none tracking-tighter">TOTAL_AMT</div>
            <label className="font-mono text-xs uppercase tracking-[0.3em] opacity-80 mb-4">ESTIMATED_TOTAL_CHARGES</label>
            <div className="font-headline font-black text-7xl md:text-8xl tracking-tighter leading-none">$509.50</div>
            <div className="mt-4 bg-white/10 px-4 py-1 font-mono text-[10px] tracking-widest">CURRENCY: USD | TAX_INCL: YES</div>
          </section>

          <section className="bg-surface-container-low p-6 flex items-center gap-4 border border-outline-variant/20">
            <div className="bg-white p-1 border border-outline w-6 h-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary scale-75" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">
              I certify that the documentation for this encounter accurately supports the coding levels selected above.
            </p>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-950 border-t-2 border-slate-100 dark:border-slate-800 p-4 md:p-6 flex flex-col items-center z-40 print:hidden gap-3">
        {!isOnline && (
          <div className="w-full max-w-3xl flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
            <span className="material-symbols-outlined text-base">cloud_off</span>
            <span>
              <strong>Offline Mode Active:</strong> Firestore offline persistence is enabled. Finalizing this encounter will save it locally on your device immediately and queue it for cloud sync when connection resumes.
            </span>
          </div>
        )}
        <div className="w-full max-w-3xl flex gap-4">
          <Button 
            onClick={handlePrint}
            variant="outline"
            size="xl"
            className="whitespace-nowrap"
            icon={<span className="material-symbols-outlined text-3xl">print</span>}
          >
            PRINT SUPERBILL
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={isSaving}
            size="xl"
            fullWidth
            icon={<span className="material-symbols-outlined text-3xl">{isSaving ? "sync" : "send_and_archive"}</span>}
          >
            {isSaving ? "SAVING..." : "COMPLETE ENCOUNTER"}
          </Button>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] flex items-center justify-center print:hidden">
        <div className="border-[40px] border-primary w-[80vw] h-[707px] rounded-full"></div>
      </div>

      {/* Print Warning Modal */}
      {showPrintWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center border-2 border-outline-variant pointer-events-auto">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">print_disabled</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Printing Unavailable in Preview</h3>
            <p className="text-on-surface-variant mb-6">
              The print dialog cannot be opened inside this preview window. To print this document, please <strong>open the app in a new tab</strong> using the arrow icon in the top right corner of the screen, then try printing again.
            </p>
            <Button fullWidth onClick={() => setShowPrintWarning(false)}>
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>

    {/* Printable Superbill */}
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest">Superbill / Encounter Form</h1>
        <p className="text-sm mt-2">St. Jude Clinic B | 123 Medical Plaza, Healthville, ST 12345</p>
        <p className="text-sm">Phone: (555) 123-4567 | Fax: (555) 123-4568</p>
        <p className="text-sm">Tax ID: 99-9999999 | NPI: 1234567890</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="border border-black p-4">
          <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Patient Information</h2>
          <p><strong>Name:</strong> Sarah J. Miller</p>
          <p><strong>DOB:</strong> 1982-05-14</p>
          <p><strong>Patient ID:</strong> PX-9920-A</p>
          <p><strong>Address:</strong> 456 Patient Lane, City, ST 67890</p>
          <p><strong>Phone:</strong> (555) 987-6543</p>
        </div>
        <div className="border border-black p-4">
          <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Encounter Information</h2>
          <p><strong>Date of Service:</strong> 2023-10-27</p>
          <p><strong>Provider:</strong> {user?.displayName || "Dr. Aris Thorne"}</p>
          <p><strong>Provider NPI:</strong> 0987654321</p>
          <p><strong>Location:</strong> ST_JUDE_CLINIC_B</p>
        </div>
      </div>

      <div className="mb-8 border border-black p-4">
        <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Diagnosis Codes (ICD-10)</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="pb-2">Code</th>
              <th className="pb-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">J20.9</td>
              <td className="py-1">Acute bronchitis, unspecified</td>
            </tr>
            <tr>
              <td className="py-1">I10</td>
              <td className="py-1">Essential (primary) hypertension</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-8 border border-black p-4">
        <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Procedures & Charges (CPT/HCPCS)</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-2">CPT Code</th>
              <th className="pb-2">Modifier</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">Units</th>
              <th className="pb-2 text-right">Charge</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-2">99214</td>
              <td className="py-2"></td>
              <td className="py-2">Office/outpatient visit, est, mod MDM, 30-39 min</td>
              <td className="py-2">1</td>
              <td className="py-2 text-right">$412.00</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2">99417</td>
              <td className="py-2">25</td>
              <td className="py-2">Prolonged office visit, each 15 min</td>
              <td className="py-2">1</td>
              <td className="py-2 text-right">$97.50</td>
            </tr>
            <tr>
              <td colSpan={4} className="py-4 text-right font-bold">TOTAL CHARGES:</td>
              <td className="py-4 text-right font-bold">$509.50</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-16 border-t border-black pt-2 flex justify-between">
        <div className="w-1/2">
          <p className="text-sm">Provider Signature: ___________________________</p>
          <p className="text-sm mt-2">Date: ___________________________</p>
        </div>
        <div className="w-1/2 text-right">
          <p className="text-sm font-bold">Please submit to insurance or retain for your records.</p>
        </div>
      </div>
    </div>
    </>
  );
}
