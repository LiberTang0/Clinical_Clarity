import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../services/firestoreError";

type Patient = {
  id: string;
  docId?: string;
  name: string;
  time: string;
  ampm: string;
  room: string;
  reason: string;
  status: "NEXT_PATIENT" | "WAITING" | "COMPLETED";
  isPendingSync?: boolean;
  history: {
    date: string;
    description: string;
  }[];
  aiSummary: string;
  avatarColor: string;
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
];

const COMMON_REASONS = [
  "General Consultation",
  "Routine Follow-up",
  "Annual Physical Examination",
  "Post-operative Check-up",
  "Hypertension Management",
  "Diabetes Mellitus Review",
  "Asthma & Respiratory Review",
  "Prescription & Medication Refill",
  "Urgent: Acute Pain / Discomfort",
  "Lab & Diagnostic Results Review",
];

export interface DbPatient {
  id: string;
  patientId: string;
  name: string;
  dob: string;
  gender?: string;
  phone?: string;
  allergies?: string;
  medicalHistory?: string;
  createdAt?: any;
}

export const DEFAULT_DB_PATIENTS: DbPatient[] = [
  {
    id: "PT-001",
    patientId: "PT-001",
    name: "Sarah Jenkins",
    dob: "1962-04-12",
    gender: "Female",
    phone: "(555) 234-8901",
    allergies: "Penicillin",
    medicalHistory: "Right Total Knee Arthroplasty (2026), Osteoarthritis",
  },
  {
    id: "PT-002",
    patientId: "PT-002",
    name: "Michael Chen",
    dob: "1974-09-28",
    gender: "Male",
    phone: "(555) 456-7890",
    allergies: "NKDA (No Known Allergies)",
    medicalHistory: "Primary Hypertension (2025), Hyperlipidemia",
  },
  {
    id: "PT-003",
    patientId: "PT-003",
    name: "Emily Rodriguez",
    dob: "1998-02-14",
    gender: "Female",
    phone: "(555) 321-6549",
    allergies: "Aspirin, NSAIDs",
    medicalHistory: "Moderate persistent asthma",
  },
  {
    id: "PT-004",
    patientId: "PT-004",
    name: "Robert Wilson",
    dob: "1958-11-03",
    gender: "Male",
    phone: "(555) 789-1234",
    allergies: "Codeine",
    medicalHistory: "Type 2 Diabetes Mellitus, CAD",
  },
  {
    id: "PT-005",
    patientId: "PT-005",
    name: "Amanda Lee",
    dob: "1989-06-21",
    gender: "Female",
    phone: "(555) 890-4321",
    allergies: "Sulfa antibiotics",
    medicalHistory: "Hypothyroidism, Migraine with aura",
  },
];

export default function Schedule() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dbAppointments, setDbAppointments] = useState<Patient[]>([]);
  const [localAppointments, setLocalAppointments] = useState<Patient[]>([]);

  // Patients database state
  const [dbPatients, setDbPatients] = useState<DbPatient[]>([]);
  const [localCreatedPatients, setLocalCreatedPatients] = useState<DbPatient[]>([]);
  const [patientMode, setPatientMode] = useState<"database" | "create">("database");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedDbPatient, setSelectedDbPatient] = useState<DbPatient | null>(null);

  // New patient registration form state
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("1985-05-12");
  const [newPatientGender, setNewPatientGender] = useState("Female");
  const [newPatientId, setNewPatientId] = useState(() => `PT-${Math.floor(100 + Math.random() * 900)}`);
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientAllergies, setNewPatientAllergies] = useState("");
  const [newPatientHistory, setNewPatientHistory] = useState("");
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Appointment form state
  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState(() => `PT-${Math.floor(100 + Math.random() * 900)}`);
  const [formTime, setFormTime] = useState("02:00");
  const [formAmpm, setFormAmpm] = useState<"AM" | "PM">("PM");
  const [formRoom, setFormRoom] = useState("RM-01");
  const [formReason, setFormReason] = useState("General Consultation");
  const [formStatus, setFormStatus] = useState<"WAITING" | "NEXT_PATIENT">("WAITING");
  const [formNotes, setFormNotes] = useState("");

  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();

  // Baseline schedule for today
  const defaultPatients: Patient[] = [
    {
      id: "PT-001",
      name: "Sarah Jenkins",
      time: "09:15",
      ampm: "AM",
      room: "RM-04",
      reason: "Check-up: Post-operative review (Knee Replacement)",
      status: "NEXT_PATIENT",
      avatarColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      history: [
        { date: "2026-02-15", description: "Right Total Knee Arthroplasty performed by Dr. Smith." },
        { date: "2026-03-01", description: "2-week post-op check. Incision healing well. Started PT." },
      ],
      aiSummary: "Patient is a 64yo female recovering from a right total knee arthroplasty performed 5 weeks ago. She has been attending physical therapy twice a week. Current visit is a routine post-operative check-up to assess range of motion, pain levels, and overall recovery progress. No major complications reported in previous visits."
    },
    {
      id: "PT-002",
      name: "Michael Chen",
      time: "10:00",
      ampm: "AM",
      room: "RM-02",
      reason: "Consultation: Persistent hypertension management",
      status: "WAITING",
      avatarColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
      history: [
        { date: "2025-11-10", description: "Initial diagnosis of primary hypertension. Prescribed Lisinopril 10mg." },
        { date: "2026-01-20", description: "Follow-up. BP still elevated (145/90). Increased Lisinopril to 20mg." },
      ],
      aiSummary: "Patient is a 52yo male with a history of primary hypertension diagnosed 4 months ago. Despite an increase in Lisinopril dosage to 20mg two months ago, his blood pressure remained elevated at his last visit. Today's consultation is to evaluate the effectiveness of the current medication regimen and consider adding a secondary antihypertensive agent, such as a thiazide diuretic or calcium channel blocker."
    },
    {
      id: "PT-003",
      name: "Emily Rodriguez",
      time: "11:30",
      ampm: "AM",
      room: "RM-01",
      reason: "Follow-up: Asthma action plan review",
      status: "WAITING",
      avatarColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
      history: [
        { date: "2025-08-12", description: "Emergency room visit for acute asthma exacerbation." },
        { date: "2025-09-05", description: "Pulmonology consult. Prescribed Advair Diskus." },
      ],
      aiSummary: "Patient is a 28yo female with a history of moderate persistent asthma. She had an exacerbation 7 months ago requiring an ER visit. She was subsequently started on Advair Diskus. Today's visit is to review her asthma action plan, assess her current symptom control, and determine if any step-up or step-down in therapy is warranted."
    }
  ];

  // Subscribe to doctor's registered patients from Firestore
  useEffect(() => {
    if (!user) {
      setDbPatients([]);
      return;
    }

    const q = query(collection(db, "patients"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const loaded: DbPatient[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            patientId: data.patientId || `PT-${docSnap.id.substring(0, 4)}`,
            name: data.name || "Registered Patient",
            dob: data.dob || "",
            gender: data.gender || "",
            phone: data.phone || "",
            allergies: data.allergies || "",
            medicalHistory: data.medicalHistory || "",
            createdAt: data.createdAt,
          };
        });
        setDbPatients(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "patients");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to doctor's scheduled appointments from Firestore (with offline persistence)
  useEffect(() => {
    if (!user) {
      setDbAppointments([]);
      return;
    }

    const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const loaded: Patient[] = snapshot.docs.map((docSnap, index) => {
          const data = docSnap.data();
          const isPending = docSnap.metadata.hasPendingWrites;
          const color = AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length];
          return {
            id: data.patientId || `PT-${docSnap.id.substring(0, 4)}`,
            docId: docSnap.id,
            name: data.patientName || "Scheduled Patient",
            time: data.time || "02:00",
            ampm: data.ampm || "PM",
            room: data.room || "RM-01",
            reason: data.reason || "General Consultation",
            status: data.status || "WAITING",
            isPendingSync: isPending,
            avatarColor: color,
            history: data.clinicalNotes ? [
              { date: "Visit Notes", description: data.clinicalNotes }
            ] : [
              { date: "Intake", description: `Visit scheduled for ${data.reason}` }
            ],
            aiSummary: data.clinicalNotes 
              ? `Scheduled visit for ${data.patientName}. Background: ${data.clinicalNotes}. Chief complaint: ${data.reason}.`
              : `Scheduled outpatient appointment for ${data.patientName} for ${data.reason}. Patient queued for room ${data.room}.`
          };
        });
        setDbAppointments(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // All database patients available for selection (Firestore + defaults + local)
  const allDatabasePatients: DbPatient[] = [
    ...DEFAULT_DB_PATIENTS,
    ...dbPatients,
    ...localCreatedPatients,
  ];

  // Filtered patients for search
  const filteredPatients = allDatabasePatients.filter((p) => {
    const q = patientSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      (p.dob && p.dob.toLowerCase().includes(q)) ||
      (p.medicalHistory && p.medicalHistory.toLowerCase().includes(q))
    );
  });

  // Combined active schedule
  const allPatients: Patient[] = [...defaultPatients, ...dbAppointments, ...localAppointments];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSelectPatient = (patient: DbPatient) => {
    setSelectedDbPatient(patient);
    setFormName(patient.name);
    setFormId(patient.patientId);
    
    // Auto-enrich notes with clinical background if present
    const background = [];
    if (patient.medicalHistory) background.push(`History: ${patient.medicalHistory}`);
    if (patient.allergies) background.push(`Allergies: ${patient.allergies}`);
    if (background.length > 0 && !formNotes) {
      setFormNotes(background.join(". "));
    }
  };

  const handleOpenScheduleModal = () => {
    setFormName("");
    const generatedId = `PT-${Math.floor(100 + Math.random() * 900)}`;
    setFormId(generatedId);
    setFormTime("02:00");
    setFormAmpm("PM");
    setFormRoom("RM-03");
    setFormReason("General Consultation");
    setFormStatus("WAITING");
    setFormNotes("");
    
    // Patient selection reset
    setSelectedDbPatient(null);
    setPatientSearchQuery("");
    setPatientMode("database");
    setNewPatientName("");
    setNewPatientDob("1985-05-12");
    setNewPatientGender("Female");
    setNewPatientId(`PT-${Math.floor(100 + Math.random() * 900)}`);
    setNewPatientPhone("");
    setNewPatientAllergies("");
    setNewPatientHistory("");

    setIsScheduleModalOpen(true);
  };

  // Register a new patient in the database
  const handleCreateNewPatient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newPatientName.trim();
    if (!trimmedName) return;

    setIsSavingPatient(true);
    const newId = newPatientId.trim() || `PT-${Math.floor(100 + Math.random() * 900)}`;
    const patientData: DbPatient = {
      id: newId,
      patientId: newId,
      name: trimmedName,
      dob: newPatientDob.trim() || "1985-01-01",
      gender: newPatientGender || "Unspecified",
      phone: newPatientPhone.trim(),
      allergies: newPatientAllergies.trim() || "NKDA",
      medicalHistory: newPatientHistory.trim(),
    };

    try {
      if (user) {
        const docRef = await addDoc(collection(db, "patients"), {
          userId: user.uid,
          name: patientData.name,
          dob: patientData.dob,
          gender: patientData.gender,
          patientId: patientData.patientId,
          phone: patientData.phone,
          allergies: patientData.allergies,
          medicalHistory: patientData.medicalHistory,
          createdAt: serverTimestamp(),
        });
        patientData.id = docRef.id;
      } else {
        setLocalCreatedPatients((prev) => [...prev, patientData]);
      }

      // Automatically select the newly created patient
      handleSelectPatient(patientData);
      setPatientMode("database");
      setToastMessage(`Patient ${patientData.name} (${patientData.patientId}) registered in database!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      console.error("Failed to create patient:", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, "patients");
      } catch {
        // Handled
      }
    } finally {
      setIsSavingPatient(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If doctor is in create mode with a filled name and hasn't saved yet, save patient first
    let activePatientName = formName.trim();
    let activePatientId = formId.trim();

    if (patientMode === "create" && newPatientName.trim() && !selectedDbPatient) {
      await handleCreateNewPatient();
      activePatientName = newPatientName.trim();
      activePatientId = newPatientId.trim() || `PT-${Math.floor(100 + Math.random() * 900)}`;
    } else if (selectedDbPatient) {
      activePatientName = selectedDbPatient.name;
      activePatientId = selectedDbPatient.patientId;
    }

    if (!activePatientName) {
      setToastMessage("Please select or register a patient for this visit.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    const newAppointmentData = {
      patientName: activePatientName,
      patientId: activePatientId || `PT-${Math.floor(100 + Math.random() * 900)}`,
      time: formTime.trim() || "02:00",
      ampm: formAmpm,
      room: formRoom,
      reason: formReason.trim() || "General Consultation",
      status: formStatus,
      clinicalNotes: formNotes.trim() || (selectedDbPatient?.medicalHistory ? `History: ${selectedDbPatient.medicalHistory}` : "Scheduled outpatient clinical visit.")
    };

    try {
      if (user) {
        // Persist to Cloud Firestore (with offline caching enabled)
        await addDoc(collection(db, "appointments"), {
          userId: user.uid,
          ...newAppointmentData,
          createdAt: serverTimestamp(),
        });
      } else {
        // Add to local state for guest session
        const localPatient: Patient = {
          id: newAppointmentData.patientId,
          name: newAppointmentData.patientName,
          time: newAppointmentData.time,
          ampm: newAppointmentData.ampm,
          room: newAppointmentData.room,
          reason: newAppointmentData.reason,
          status: newAppointmentData.status,
          avatarColor: AVATAR_COLORS[(allPatients.length) % AVATAR_COLORS.length],
          history: [
            { date: "Scheduled", description: newAppointmentData.clinicalNotes }
          ],
          aiSummary: `Scheduled visit for ${newAppointmentData.patientName}: ${newAppointmentData.reason}.`
        };
        setLocalAppointments(prev => [...prev, localPatient]);
      }

      setToastMessage(`Visit scheduled successfully for ${newAppointmentData.patientName}!`);
      setTimeout(() => setToastMessage(null), 4000);
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Failed to schedule visit:", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, "appointments");
      } catch {
        // Logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-600/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold tracking-wider uppercase">
              Today's Schedule
            </span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full" title="Offline persistence active - cached locally in IndexedDB">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Offline Mode (Local Cache)
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Good morning, {user?.displayName || "Dr. Smith"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            You have <strong className="text-slate-700 dark:text-slate-200">{allPatients.length} patients</strong> scheduled for today.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Current Time</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">08:45 AM</p>
            </div>
          </div>

          <Button
            onClick={handleOpenScheduleModal}
            size="lg"
            variant="primary"
            icon={<span className="material-symbols-outlined">add_circle</span>}
            className="shadow-xl shadow-indigo-500/20 whitespace-nowrap !py-4"
          >
            SCHEDULE VISIT
          </Button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {allPatients.map((patient) => {
          const isNext = patient.status === "NEXT_PATIENT";
          
          return (
            <div 
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`group relative flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 p-4 md:p-5 rounded-3xl transition-all duration-300 cursor-pointer ${
                isNext 
                  ? "bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10 border-2 border-indigo-500 ring-4 ring-indigo-500/10 md:scale-[1.01]" 
                  : "bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Time Column */}
              <div className={`flex-none flex flex-col items-center justify-center w-full md:w-24 h-24 rounded-2xl ${
                isNext 
                  ? "bg-indigo-500 text-white shadow-inner" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}>
                <span className="text-2xl font-black tracking-tighter leading-none">{patient.time}</span>
                <span className={`text-xs font-bold mt-1 ${isNext ? "text-indigo-100" : "text-slate-400"}`}>{patient.ampm}</span>
              </div>

              {/* Patient Info */}
              <div className="flex-grow flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    isNext 
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" 
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {patient.room}
                  </span>
                  
                  {isNext && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                      Next Patient
                    </span>
                  )}

                  {patient.isPendingSync && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      <span className="material-symbols-outlined text-[12px] animate-pulse">cloud_queue</span>
                      Offline Queued
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-sm font-bold ${patient.avatarColor}`}>
                    {getInitials(patient.name)}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                      {patient.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-none pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 mt-2 md:mt-0">
                <Button 
                  href={isNext ? "/visit/active" : undefined} 
                  disabled={!isNext}
                  size="lg" 
                  className={isNext ? "w-full md:w-auto shadow-lg shadow-indigo-500/20" : "w-full md:w-auto opacity-50"}
                  icon={<span className="material-symbols-outlined">{isNext ? "arrow_forward" : "visibility"}</span>}
                  onClick={(e) => {
                    if (isNext) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {isNext ? "Start Visit" : "View Details"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Visit Modal Dialog */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0"
            onClick={() => !isSubmitting && setIsScheduleModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">event_available</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Schedule New Visit</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add an encounter to today's clinical queue</p>
                </div>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSubmitting}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Offline notification in form */}
            {!isOnline && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">cloud_off</span>
                <span>
                  <strong>Offline Persistence:</strong> This visit will be stored in local cache and automatically synced to Cloud Firestore when connection resumes.
                </span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleScheduleSubmit} className="space-y-5 pt-4">
              {/* Patient Selection & Registration Section */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Patient Information <span className="text-rose-500">*</span>
                  </span>
                  
                  {/* Mode Toggle */}
                  <div className="flex items-center bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPatientMode("database")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        patientMode === "database"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Select from Database
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMode("create");
                        if (!newPatientName && formName) setNewPatientName(formName);
                      }}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        patientMode === "create"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      + Create New Patient
                    </button>
                  </div>
                </div>

                {/* MODE 1: SELECT FROM DATABASE */}
                {patientMode === "database" && (
                  <div className="space-y-3">
                    {/* Selected Patient Card */}
                    {selectedDbPatient ? (
                      <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                            {getInitials(selectedDbPatient.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {selectedDbPatient.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                                {selectedDbPatient.patientId}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              DOB: {selectedDbPatient.dob || "N/A"} {selectedDbPatient.gender ? `• ${selectedDbPatient.gender}` : ""} {selectedDbPatient.allergies ? `• Allergies: ${selectedDbPatient.allergies}` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDbPatient(null);
                            setFormName("");
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800 shadow-xs"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Search Database */}
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                            search
                          </span>
                          <input
                            type="text"
                            value={patientSearchQuery}
                            onChange={(e) => setPatientSearchQuery(e.target.value)}
                            placeholder="Search database by patient name, MRN, or condition..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Database Patients List */}
                        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <div
                                key={patient.id || patient.patientId}
                                onClick={() => handleSelectPatient(patient)}
                                className="group flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0">
                                    {getInitials(patient.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {patient.name}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                        {patient.patientId}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                      DOB: {patient.dob} {patient.gender ? `• ${patient.gender}` : ""} {patient.medicalHistory ? `• ${patient.medicalHistory}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
                                  Select
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                No patient found matching "{patientSearchQuery}".
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPatientName(patientSearchQuery);
                                  setPatientMode("create");
                                }}
                                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                Register "{patientSearchQuery}" as a new patient
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Direct input fallback */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Or enter / verify patient name directly:
                          </label>
                          <input 
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="e.g. Eleanor Vance"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* MODE 2: REGISTER NEW PATIENT */}
                {patientMode === "create" && (
                  <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">person_add</span>
                        New Patient Registration
                      </span>
                      <span className="text-[10px] text-slate-400">Will be saved to clinical database</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newPatientName}
                          onChange={(e) => {
                            setNewPatientName(e.target.value);
                            setFormName(e.target.value);
                          }}
                          placeholder="e.g. Eleanor Vance"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Patient ID / MRN <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newPatientId}
                          onChange={(e) => {
                            setNewPatientId(e.target.value);
                            setFormId(e.target.value);
                          }}
                          placeholder="e.g. PT-005"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Date of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={newPatientDob}
                          onChange={(e) => setNewPatientDob(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Gender
                        </label>
                        <select
                          value={newPatientGender}
                          onChange={(e) => setNewPatientGender(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newPatientPhone}
                          onChange={(e) => setNewPatientPhone(e.target.value)}
                          placeholder="(555) 000-0000"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Known Allergies
                        </label>
                        <input
                          type="text"
                          value={newPatientAllergies}
                          onChange={(e) => setNewPatientAllergies(e.target.value)}
                          placeholder="e.g. Penicillin, Sulfa, NKDA"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Medical History / Chronic Conditions
                      </label>
                      <input
                        type="text"
                        value={newPatientHistory}
                        onChange={(e) => setNewPatientHistory(e.target.value)}
                        placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPatientMode("database")}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingPatient || !newPatientName.trim()}
                        onClick={() => handleCreateNewPatient()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSavingPatient ? "sync" : "save"}
                        </span>
                        {isSavingPatient ? "Saving..." : "Save Patient & Select"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient ID & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Patient ID / MRN <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g. PT-004"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Exam Room <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900 dark:text-white"
                  >
                    <option value="RM-01">Room 01 (General)</option>
                    <option value="RM-02">Room 02 (Cardiology)</option>
                    <option value="RM-03">Room 03 (Examination)</option>
                    <option value="RM-04">Room 04 (Procedure)</option>
                    <option value="Telehealth">Telehealth / Virtual</option>
                  </select>
                </div>
              </div>

              {/* Time Slot & AM/PM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Scheduled Time <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="02:30"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Time Period
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAmpm("AM")}
                      className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                        formAmpm === "AM"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAmpm("PM")}
                      className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                        formAmpm === "PM"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                          : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Visit Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Reason for Visit / Chief Complaint <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value !== "Custom") {
                        setFormReason(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-600 dark:text-slate-300"
                  >
                    <option value="">-- Or choose from common reasons --</option>
                    {COMMON_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input 
                    type="text"
                    required
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="e.g. Consultation: Diabetic neuropathy evaluation"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status & Priority */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Queue Priority
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    formStatus === "WAITING" 
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
                      : "border-slate-200 dark:border-slate-800"
                  }`}>
                    <input 
                      type="radio" 
                      name="queueStatus"
                      checked={formStatus === "WAITING"}
                      onChange={() => setFormStatus("WAITING")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Waiting Room</p>
                      <p className="text-[10px] text-slate-500">Standard scheduled queue</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    formStatus === "NEXT_PATIENT" 
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
                      : "border-slate-200 dark:border-slate-800"
                  }`}>
                    <input 
                      type="radio" 
                      name="queueStatus"
                      checked={formStatus === "NEXT_PATIENT"}
                      onChange={() => setFormStatus("NEXT_PATIENT")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Next Patient</p>
                      <p className="text-[10px] text-slate-500">Ready for immediate visit</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Clinical Notes / Background */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Clinical Background / Prior History <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea 
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Patient has history of type 2 diabetes and hypertension. Recent HbA1c 7.8%."
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  icon={<span className="material-symbols-outlined">{isSubmitting ? "sync" : "calendar_add_on"}</span>}
                  className="flex-1 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? "Scheduling..." : "Schedule Visit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Modal for Patient Details */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedPatient(null)}
          ></div>
          
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
            
            {/* Header */}
            <div className="flex-none p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${selectedPatient.avatarColor}`}>
                  {getInitials(selectedPatient.name)}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                    {selectedPatient.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">badge</span>
                      {selectedPatient.id}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {selectedPatient.time} {selectedPatient.ampm}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8">
              
              {/* Reason for Visit */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Reason for Visit</h3>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {selectedPatient.reason}
                  </p>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  AI Clinical Summary
                </h3>
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-indigo-500/10 dark:text-indigo-400/5">
                    <span className="material-symbols-outlined text-8xl">psychiatry</span>
                  </div>
                  <p className="relative z-10 text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                    {selectedPatient.aiSummary}
                  </p>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Recent History
                </h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:h-full before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  {selectedPatient.history.map((record, index) => (
                    <div key={index} className="relative flex items-start gap-4">
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-950 border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                      </div>
                      <div className="flex-grow bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold tracking-wider mb-2">
                          {record.date}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {record.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-none p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-3">
              <Button 
                onClick={() => setSelectedPatient(null)} 
                variant="outline" 
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                href="/visit/active" 
                className="flex-1"
                icon={<span className="material-symbols-outlined">play_circle</span>}
              >
                Start Visit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
