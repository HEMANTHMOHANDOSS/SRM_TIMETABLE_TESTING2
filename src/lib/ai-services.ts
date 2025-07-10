import { GoogleGenerativeAI } from '@google/generative-ai';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export interface TimetableConstraints {
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  staffPerLabSession: number;
  labHoursPerSubject: number;
  maxSubjectsPerStaff: number;
  timeSlotConstraints: string[];
  holidaySchedule: string[];
  customRules: string[];
}

export interface ConflictAnalysis {
  hasConflict: boolean;
  conflictType: string;
  reason: string;
  suggestion: string;
}

export class AITimetableService {
  private groqModel: any;
  private geminiModel: any;

  constructor() {
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async processNaturalLanguageInstruction(instruction: string): Promise<any> {
    try {
      const prompt = `
        You are an AI assistant for a timetable management system. 
        Parse the following natural language instruction and convert it to configuration updates:
        
        Instruction: "${instruction}"
        
        Available configuration keys:
        - maxHoursPerDay: Maximum teaching hours per day for staff
        - maxHoursPerWeek: Maximum teaching hours per week for staff
        - staffPerLabSession: Number of staff required for lab sessions
        - labHoursPerSubject: Hours allocated for lab subjects
        - maxSubjectsPerStaff: Maximum subjects a staff can teach
        - timeSlotConstraints: Time slots to avoid (e.g., "Friday afternoon")
        - holidaySchedule: Dates to mark as holidays
        - customRules: Any custom scheduling rules
        
        Return a JSON object with the configuration updates. If the instruction doesn't match any configuration, return an empty object.
        
        Example:
        Input: "Allocate 2 staff members for every lab session"
        Output: {"staffPerLabSession": 2}
        
        Input: "Avoid scheduling labs on Friday afternoons"
        Output: {"timeSlotConstraints": ["Friday 14:00-17:00"]}
      `;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        return {};
      }
    } catch (error) {
      console.error('Error processing natural language instruction:', error);
      throw error;
    }
  }

  async analyzeConflicts(
    timetableEntry: any,
    existingTimetable: any[],
    constraints: TimetableConstraints
  ): Promise<ConflictAnalysis> {
    try {
      const prompt = `
        Analyze the following timetable entry for conflicts:
        
        New Entry: ${JSON.stringify(timetableEntry)}
        Existing Timetable: ${JSON.stringify(existingTimetable)}
        Constraints: ${JSON.stringify(constraints)}
        
        Check for:
        1. Staff double-booking
        2. Classroom conflicts
        3. Constraint violations
        4. Workload limits
        
        Return a JSON object with:
        {
          "hasConflict": boolean,
          "conflictType": "staff_conflict" | "classroom_conflict" | "constraint_violation" | "workload_exceeded",
          "reason": "Detailed explanation",
          "suggestion": "How to resolve the conflict"
        }
      `;

      const result = await this.groqRequest(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
      return {
        hasConflict: false,
        conflictType: 'unknown',
        reason: 'Analysis failed',
        suggestion: 'Manual review required'
      };
    }
  }

  async optimizeTimetable(
    subjects: any[],
    staff: any[],
    classrooms: any[],
    constraints: TimetableConstraints
  ): Promise<any[]> {
    try {
      const prompt = `
        Generate an optimized timetable with the following inputs:
        
        Subjects: ${JSON.stringify(subjects)}
        Staff: ${JSON.stringify(staff)}
        Classrooms: ${JSON.stringify(classrooms)}
        Constraints: ${JSON.stringify(constraints)}
        
        Rules:
        1. No staff or classroom conflicts
        2. Respect all constraints
        3. Distribute workload evenly
        4. Prioritize lab sessions with required staff count
        5. Avoid time slot constraints
        
        Return a JSON array of timetable entries with format:
        {
          "day": "Monday",
          "time_slot": "09:00-10:00",
          "subject_id": "subject_id",
          "staff_id": "staff_id",
          "classroom_id": "classroom_id",
          "is_lab_session": boolean,
          "staff_count": number
        }
      `;

      const result = await this.groqRequest(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error optimizing timetable:', error);
      throw error;
    }
  }

  async explainDecision(decision: any): Promise<string> {
    try {
      const prompt = `
        Explain the following timetable scheduling decision in simple terms:
        
        Decision: ${JSON.stringify(decision)}
        
        Provide a clear, concise explanation of why this scheduling decision was made,
        including any constraints or optimizations that influenced it.
      `;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error explaining decision:', error);
      return 'Unable to explain this decision at the moment.';
    }
  }

  private async groqRequest(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API request failed:', error);
      throw error;
    }
  }
}

export const aiService = new AITimetableService();