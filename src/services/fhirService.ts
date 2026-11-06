// We use the public HAPI FHIR server for demonstration.
// In a real production environment, this would point to the hospital's EHR FHIR endpoint
// and use SMART on FHIR OAuth2 authentication.
const FHIR_BASE_URL = 'https://hapi.fhir.org/baseR4';

async function fhirRequest(path: string) {
  const response = await fetch(`${FHIR_BASE_URL}/${path}`, {
    headers: {
      'Accept': 'application/fhir+json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export interface FhirPatient {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
}

export interface FhirCondition {
  id: string;
  clinicalStatus: string;
  codeText: string;
  dateRecorded: string;
}

export interface FhirObservation {
  id: string;
  status: string;
  codeText: string;
  value: string;
  unit: string;
  effectiveDateTime: string;
}

export const fhirService = {
  /**
   * Fetch a list of patients from the EHR
   */
  async getPatients(count: number = 10): Promise<FhirPatient[]> {
    try {
      // Fetch patients that have a name
      const response = await fhirRequest(`Patient?_count=${count}&_sort=-_lastUpdated`);
      
      if (!response.entry) return [];

      return response.entry
        .filter((entry: any) => entry.resource && entry.resource.name && entry.resource.name.length > 0)
        .map((entry: any) => {
          const resource = entry.resource;
          const nameObj = resource.name[0];
          const name = `${nameObj.given ? nameObj.given.join(' ') : ''} ${nameObj.family || ''}`.trim();
          
          return {
            id: resource.id,
            name: name || 'Unknown Patient',
            gender: resource.gender || 'unknown',
            birthDate: resource.birthDate || 'unknown',
          };
        });
    } catch (error) {
      console.error("Error fetching FHIR patients:", error);
      return [];
    }
  },

  /**
   * Fetch medical history (Conditions) for a specific patient
   */
  async getPatientConditions(patientId: string): Promise<FhirCondition[]> {
    try {
      const response = await fhirRequest(`Condition?patient=${patientId}&_sort=-recorded-date`);
      
      if (!response.entry) return [];

      return response.entry.map((entry: any) => {
        const resource = entry.resource;
        return {
          id: resource.id,
          clinicalStatus: resource.clinicalStatus?.coding?.[0]?.code || 'unknown',
          codeText: resource.code?.text || resource.code?.coding?.[0]?.display || 'Unknown Condition',
          dateRecorded: resource.recordedDate || resource.onsetDateTime || 'unknown date',
        };
      });
    } catch (error) {
      console.error(`Error fetching conditions for patient ${patientId}:`, error);
      return [];
    }
  },

  /**
   * Fetch lab results (Observations) for a specific patient
   */
  async getPatientLabResults(patientId: string): Promise<FhirObservation[]> {
    try {
      const response = await fhirRequest(`Observation?patient=${patientId}&category=laboratory&_sort=-date`);
      
      if (!response.entry) return [];

      return response.entry.map((entry: any) => {
        const resource = entry.resource;
        
        let valueStr = '';
        let unitStr = '';
        
        if (resource.valueQuantity) {
          valueStr = resource.valueQuantity.value?.toString() || '';
          unitStr = resource.valueQuantity.unit || '';
        } else if (resource.valueCodeableConcept) {
          valueStr = resource.valueCodeableConcept.text || resource.valueCodeableConcept.coding?.[0]?.display || '';
        } else if (resource.valueString) {
          valueStr = resource.valueString;
        }

        return {
          id: resource.id,
          status: resource.status || 'unknown',
          codeText: resource.code?.text || resource.code?.coding?.[0]?.display || 'Unknown Lab Test',
          value: valueStr,
          unit: unitStr,
          effectiveDateTime: resource.effectiveDateTime || 'unknown date',
        };
      });
    } catch (error) {
      console.error(`Error fetching lab results for patient ${patientId}:`, error);
      return [];
    }
  }
};
