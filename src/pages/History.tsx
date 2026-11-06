import { useState, useEffect } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../services/firestoreError";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type SOAPNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type EncounterRecord = {
  id: string;
  date: string;
  patient: string;
  dob: string;
  diagnosis: string;
  provider: string;
  status: "COMPLETED" | "SIGNED_OFF" | "PENDING_SYNC";
  isPendingSync?: boolean;
  avatarColor: string;
  soap: SOAPNote;
};

export default function History() {
  const [selectedRecord, setSelectedRecord] = useState<EncounterRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSoap, setEditedSoap] = useState<SOAPNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [dbEncounters, setDbEncounters] = useState<EncounterRecord[]>([]);

  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!user) {
      setDbEncounters([]);
      return;
    }

    const q = query(collection(db, "encounters"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const records: EncounterRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const isPending = docSnap.metadata.hasPendingWrites;
          let formattedDate = "Nov 5, 2026";
          if (data.date) {
            try {
              formattedDate = new Date(data.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
            } catch {
              formattedDate = "Nov 5, 2026";
            }
          }
          return {
            id: docSnap.id.length > 15 ? docSnap.id.substring(0, 15).toUpperCase() : docSnap.id,
            date: formattedDate,
            patient: data.patientName || "Sarah J. Miller",
            dob: data.dob || "1982-05-14",
            diagnosis: `Encounter - CPT ${data.cptCode || "99214"}`,
            provider: data.provider || "Dr. Aris Thorne",
            status: isPending ? "PENDING_SYNC" : "COMPLETED",
            isPendingSync: isPending,
            avatarColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
            soap: {
              subjective: "Patient presented for scheduled clinical evaluation.",
              objective: `CPT Code: ${data.cptCode || "99214"}\nLocation: ${data.location || "ST_JUDE_CLINIC_B"}\nTotal: $${Number(data.totalCharges || 0).toFixed(2)}`,
              assessment: `Documentation finalized. ${isPending ? "(Saved locally - sync pending)" : "(Persisted & Cloud Synced)"}`,
              plan: "Encounter records archived to patient chart."
            }
          };
        });
        setDbEncounters(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "encounters");
      }
    );

    return () => unsubscribe();
  }, [user]);

  const pastEncounters: EncounterRecord[] = [
    {
      id: "ENC-20260320-14",
      date: "Mar 20, 2026",
      patient: "Robert Wilson",
      dob: "1982-05-14",
      diagnosis: "Acute Bronchitis",
      provider: "Dr. A. Smith",
      status: "COMPLETED",
      avatarColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      soap: {
        subjective: "Patient reports a persistent cough for the past 5 days, productive of green sputum. Complains of mild chest discomfort when coughing. Denies fever, chills, or shortness of breath at rest.",
        objective: "Vitals: T 98.6F, HR 82, BP 120/80, RR 18, SpO2 98% on RA.\nLungs: scattered rhonchi bilaterally, clearing with cough. No wheezing or rales.\nHeart: RRR, no murmurs.",
        assessment: "Acute bronchitis, likely viral given lack of fever and stable vitals.",
        plan: "1. Rest and hydration.\n2. OTC cough suppressants (e.g., Dextromethorphan) as needed.\n3. Return to clinic if symptoms worsen or fail to improve after 7-10 days, or if fever develops."
      }
    },
    {
      id: "ENC-20260319-08",
      date: "Mar 19, 2026",
      patient: "Amanda Lee",
      dob: "1990-11-23",
      diagnosis: "Routine Checkup",
      provider: "Dr. A. Smith",
      status: "COMPLETED",
      avatarColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
      soap: {
        subjective: "Patient presents for annual physical. Feels well generally. Reports occasional mild fatigue but attributes it to work stress. No new complaints.",
        objective: "Vitals: T 98.2F, HR 70, BP 110/70, RR 16, SpO2 100% on RA.\nGeneral: Well-appearing, no acute distress.\nCV: RRR, normal S1/S2.\nResp: Clear to auscultation bilaterally.",
        assessment: "Healthy adult female. Routine health maintenance.",
        plan: "1. Ordered routine screening labs (CBC, CMP, Lipid panel).\n2. Discussed stress management techniques.\n3. Follow up in 1 year or PRN."
      }
    },
    {
      id: "ENC-20260318-22",
      date: "Mar 18, 2026",
      patient: "James Miller",
      dob: "1975-08-02",
      diagnosis: "Hypertension Management",
      provider: "Dr. A. Smith",
      status: "SIGNED_OFF",
      avatarColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      soap: {
        subjective: "Follow-up for hypertension. Patient has been taking Amlodipine 5mg daily as prescribed. Reports no side effects. Home BP readings have been in the 120s-130s/80s.",
        objective: "Vitals: T 98.4F, HR 68, BP 128/82, RR 16, SpO2 99% on RA.\nCV: RRR, no murmurs, rubs, or gallops. No lower extremity edema.",
        assessment: "Essential hypertension, well-controlled on current regimen.",
        plan: "1. Continue Amlodipine 5mg daily.\n2. Continue low-sodium diet and regular exercise.\n3. Follow up in 6 months."
      }
    },
    {
      id: "ENC-20260315-05",
      date: "Mar 15, 2026",
      patient: "Sarah Jenkins",
      dob: "1962-01-15",
      diagnosis: "Pre-operative Assessment",
      provider: "Dr. A. Smith",
      status: "SIGNED_OFF",
      avatarColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      soap: {
        subjective: "Patient presents for pre-op clearance for upcoming right total knee arthroplasty scheduled for next week. No chest pain, shortness of breath, or palpitations.",
        objective: "Vitals: T 98.6F, HR 76, BP 134/86, RR 18, SpO2 98% on RA.\nLungs: CTA bilaterally.\nHeart: RRR, no murmurs.\nExtremities: Right knee with moderate effusion and crepitus.",
        assessment: "Patient is medically optimized and cleared for right total knee arthroplasty. Low cardiac risk.",
        plan: "1. Cleared for surgery.\n2. Pre-op EKG and basic labs reviewed and within normal limits.\n3. Instructed to stop NSAIDs 7 days prior to surgery."
      }
    },
  ];

  const allEncounters = [...dbEncounters, ...pastEncounters];

  const filteredEncounters = allEncounters.filter(record => {
    const query = searchQuery.toLowerCase();
    return (
      record.patient.toLowerCase().includes(query) ||
      record.diagnosis.toLowerCase().includes(query) ||
      record.id.toLowerCase().includes(query) ||
      record.dob.toLowerCase().includes(query)
    );
  });

  const handleOpenNote = (record: EncounterRecord) => {
    setSelectedRecord(record);
    setEditedSoap({ ...record.soap });
    setIsEditing(false);
  };

  const handleSaveNote = () => {
    if (selectedRecord && editedSoap) {
      // In a real app, you would save this to the backend
      selectedRecord.soap = { ...editedSoap };
      setIsEditing(false);
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 print:hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold tracking-wider uppercase">
                Patient Records
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Encounters
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              View and manage past clinical notes and patient history.
            </p>
          </div>
          
          <div className="flex-grow max-w-md w-full">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search patients, diagnoses, or IDs..." 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Offline Mode Banner */}
        {!isOnline && (
          <div className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm shadow-sm">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">cloud_off</span>
            <div>
              <p className="font-bold">Offline Persistence Active</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Clinical records are stored in your device's local Firestore cache. You can browse, review, and search patient notes without internet connectivity. Changes will automatically synchronize when reconnected.
              </p>
            </div>
          </div>
        )}

        {/* Encounters List */}
        <div className="space-y-4">
          {filteredEncounters.length > 0 ? (
            filteredEncounters.map((record) => (
              <div 
                key={record.id}
                onClick={() => handleOpenNote(record)}
                className="group relative flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 p-4 md:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                {/* Date Column */}
                <div className="flex-none flex flex-col items-center justify-center w-full md:w-28 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-400">{record.date.split(',')[0].split(' ')[0]}</span>
                  <span className="text-3xl font-black tracking-tighter leading-none my-1">{record.date.split(',')[0].split(' ')[1]}</span>
                  <span className="text-xs font-bold text-slate-400">{record.date.split(',')[1]}</span>
                </div>

                {/* Patient Info */}
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {record.id}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      record.status === 'PENDING_SYNC'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                        : record.status === 'SIGNED_OFF' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    }`}>
                      <span className="material-symbols-outlined text-[12px]">
                        {record.status === 'PENDING_SYNC' ? 'cloud_queue' : record.status === 'SIGNED_OFF' ? 'verified' : 'edit_document'}
                      </span>
                      {record.status === 'PENDING_SYNC' ? 'LOCAL (PENDING SYNC)' : record.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-sm font-bold ${record.avatarColor}`}>
                      {getInitials(record.patient)}
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {record.patient}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                        <span className="line-clamp-1">{record.diagnosis}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-none pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 mt-2 md:mt-0">
                  <Button 
                    variant="outline"
                    size="lg" 
                    className="w-full md:w-auto"
                    icon={<span className="material-symbols-outlined">description</span>}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenNote(record);
                    }}
                  >
                    View Note
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <span className="material-symbols-outlined text-3xl">search_off</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No encounters found</h3>
              <p className="text-slate-500 dark:text-slate-400">We couldn't find anything matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Slide-over Modal for Note Details */}
        {selectedRecord && editedSoap && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div 
              className="absolute inset-0" 
              onClick={() => setSelectedRecord(null)}
            ></div>
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
              
              {/* Header */}
              <div className="flex-none p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${selectedRecord.avatarColor}`}>
                    {getInitials(selectedRecord.patient)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {selectedRecord.patient}
                      </h2>
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        selectedRecord.status === 'SIGNED_OFF' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {selectedRecord.status === 'SIGNED_OFF' ? 'verified' : 'edit_document'}
                        </span>
                        {selectedRecord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {selectedRecord.date}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">cake</span>
                        DOB: {selectedRecord.dob}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">tag</span>
                        {selectedRecord.id}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Scrollable Body (SOAP Note) */}
              <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Subjective */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                    Subjective
                  </h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[100px] p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-y text-slate-700 dark:text-slate-300 transition-all"
                      value={editedSoap.subjective}
                      onChange={(e) => setEditedSoap({ ...editedSoap, subjective: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedRecord.soap.subjective}
                    </p>
                  )}
                </div>
                
                {/* Objective */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">vital_signs</span>
                    Objective
                  </h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[100px] p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none resize-y text-slate-700 dark:text-slate-300 transition-all"
                      value={editedSoap.objective}
                      onChange={(e) => setEditedSoap({ ...editedSoap, objective: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedRecord.soap.objective}
                    </p>
                  )}
                </div>
                
                {/* Assessment */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">medical_information</span>
                    Assessment
                  </h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[100px] p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none resize-y text-slate-700 dark:text-slate-300 transition-all"
                      value={editedSoap.assessment}
                      onChange={(e) => setEditedSoap({ ...editedSoap, assessment: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedRecord.soap.assessment}
                    </p>
                  )}
                </div>
                
                {/* Plan */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">list_alt</span>
                    Plan
                  </h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[100px] p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-y text-slate-700 dark:text-slate-300 transition-all"
                      value={editedSoap.plan}
                      onChange={(e) => setEditedSoap({ ...editedSoap, plan: e.target.value })}
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {selectedRecord.soap.plan}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex-none p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-auto">
                  {selectedRecord.status !== 'SIGNED_OFF' && !isEditing && (
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      icon={<span className="material-symbols-outlined text-sm">edit</span>}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Note
                    </Button>
                  )}
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                  <Button onClick={() => setSelectedRecord(null)} variant="ghost" className="flex-1 sm:flex-none">
                    Close
                  </Button>
                  {isEditing ? (
                    <Button 
                      className="flex-1 sm:flex-none"
                      icon={<span className="material-symbols-outlined text-sm">save</span>}
                      onClick={handleSaveNote}
                    >
                      Save Changes
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 sm:flex-none"
                      icon={<span className="material-symbols-outlined text-sm">print</span>}
                      onClick={handlePrint}
                    >
                      Print Note
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Warning Modal */}
        {showPrintWarning && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center border border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">print_disabled</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Printing Unavailable</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                The print dialog cannot be opened inside this preview window. To print this document, please <strong>open the app in a new tab</strong> using the arrow icon in the top right corner of the screen.
              </p>
              <Button fullWidth onClick={() => setShowPrintWarning(false)} size="lg">
                Understood
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Note */}
      {selectedRecord && (
        <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-widest">Clinical Encounter Note</h1>
            <p className="text-sm mt-2">St. Jude Clinic B | 123 Medical Plaza, Healthville, ST 12345</p>
            <p className="text-sm">Phone: (555) 123-4567 | Fax: (555) 123-4568</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 border-b border-black pb-6">
            <div>
              <p><strong>Patient:</strong> {selectedRecord.patient}</p>
              <p><strong>DOB:</strong> {selectedRecord.dob}</p>
              <p><strong>Encounter ID:</strong> {selectedRecord.id}</p>
            </div>
            <div>
              <p><strong>Date of Service:</strong> {selectedRecord.date}</p>
              <p><strong>Provider:</strong> {selectedRecord.provider}</p>
              <p><strong>Status:</strong> {selectedRecord.status}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Subjective</h2>
            <p className="whitespace-pre-wrap">{selectedRecord.soap.subjective}</p>
          </div>
          <div className="mb-6">
            <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Objective</h2>
            <p className="whitespace-pre-wrap">{selectedRecord.soap.objective}</p>
          </div>
          <div className="mb-6">
            <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Assessment</h2>
            <p className="whitespace-pre-wrap">{selectedRecord.soap.assessment}</p>
          </div>
          <div className="mb-6">
            <h2 className="font-bold border-b border-black mb-2 uppercase text-sm">Plan</h2>
            <p className="whitespace-pre-wrap">{selectedRecord.soap.plan}</p>
          </div>

          <div className="mt-16 border-t border-black pt-2 flex justify-between">
            <div className="w-1/2">
              <p className="text-sm">Provider Signature: ___________________________</p>
              <p className="text-sm mt-2">Date: ___________________________</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
