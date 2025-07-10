import { supabase } from '@/integrations/supabase/client';
import { aiService, TimetableConstraints } from './ai-services';
import { configService } from './config-service';

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  is_lab: boolean;
  lab_hours: number;
  department_id: string;
}

export interface Staff {
  id: string;
  name: string;
  staff_role: string;
  subjects_selected: string[];
  department_id: string;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  department_id: string;
}

export interface TimetableEntry {
  id?: string;
  day: string;
  time_slot: string;
  subject_id: string;
  staff_id: string;
  classroom_id: string;
  department_id: string;
  is_lab_session: boolean;
  staff_count: number;
}

export class EnhancedTimetableGenerator {
  private constraints: TimetableConstraints;
  private daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  private timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  constructor() {
    this.constraints = {
      maxHoursPerDay: 6,
      maxHoursPerWeek: 30,
      staffPerLabSession: 1,
      labHoursPerSubject: 3,
      maxSubjectsPerStaff: 4,
      timeSlotConstraints: [],
      holidaySchedule: [],
      customRules: []
    };
  }

  async generateTimetable(departmentId: string): Promise<TimetableEntry[]> {
    try {
      // Load current configuration
      this.constraints = await configService.getConfig();

      // Fetch department data
      const { subjects, staff, classrooms } = await this.fetchDepartmentData(departmentId);

      // Generate timetable using AI optimization
      const timetable = await this.optimizeWithAI(subjects, staff, classrooms, departmentId);

      // Validate and resolve conflicts
      const validatedTimetable = await this.validateAndResolveConflicts(timetable);

      return validatedTimetable;
    } catch (error) {
      console.error('Error generating timetable:', error);
      throw error;
    }
  }

  private async fetchDepartmentData(departmentId: string) {
    const [subjectsResult, staffResult, classroomsResult] = await Promise.all([
      supabase
        .from('subjects')
        .select('*')
        .eq('department_id', departmentId),
      supabase
        .from('profiles')
        .select('*')
        .eq('department_id', departmentId)
        .eq('role', 'staff'),
      supabase
        .from('classrooms')
        .select('*')
        .eq('department_id', departmentId)
    ]);

    if (subjectsResult.error) throw subjectsResult.error;
    if (staffResult.error) throw staffResult.error;
    if (classroomsResult.error) throw classroomsResult.error;

    const subjects: Subject[] = subjectsResult.data || [];
    const staff: Staff[] = (staffResult.data || []).map(s => ({
      ...s,
      subjects_selected: s.subjects_selected ? JSON.parse(s.subjects_selected) : []
    }));
    const classrooms: Classroom[] = classroomsResult.data || [];

    return { subjects, staff, classrooms };
  }

  private async optimizeWithAI(
    subjects: Subject[],
    staff: Staff[],
    classrooms: Classroom[],
    departmentId: string
  ): Promise<TimetableEntry[]> {
    try {
      // Use AI service for optimization
      const aiOptimizedTimetable = await aiService.optimizeTimetable(
        subjects,
        staff,
        classrooms,
        this.constraints
      );

      return aiOptimizedTimetable.map(entry => ({
        ...entry,
        department_id: departmentId
      }));
    } catch (error) {
      console.error('AI optimization failed, falling back to rule-based generation:', error);
      return this.generateRuleBasedTimetable(subjects, staff, classrooms, departmentId);
    }
  }

  private generateRuleBasedTimetable(
    subjects: Subject[],
    staff: Staff[],
    classrooms: Classroom[],
    departmentId: string
  ): TimetableEntry[] {
    const timetable: TimetableEntry[] = [];
    const usedSlots = new Set<string>();
    const staffWorkload = new Map<string, number>();
    const staffDailyHours = new Map<string, Map<string, number>>();

    // Initialize tracking
    staff.forEach(s => {
      staffWorkload.set(s.id, 0);
      staffDailyHours.set(s.id, new Map());
      this.daysOfWeek.forEach(day => {
        staffDailyHours.get(s.id)!.set(day, 0);
      });
    });

    // Generate assignments for each subject
    for (const subject of subjects) {
      const availableStaff = staff.filter(s => 
        s.subjects_selected.includes(subject.id) || s.subjects_selected.length === 0
      );

      if (availableStaff.length === 0) continue;

      const sessionsNeeded = subject.is_lab ? 
        this.constraints.labHoursPerSubject : 
        Math.max(subject.credits, 1);

      for (let session = 0; session < sessionsNeeded; session++) {
        const assignment = this.findBestSlot(
          subject,
          availableStaff,
          classrooms,
          usedSlots,
          staffWorkload,
          staffDailyHours,
          departmentId
        );

        if (assignment) {
          timetable.push(assignment);
          this.updateTracking(assignment, usedSlots, staffWorkload, staffDailyHours);
        }
      }
    }

    return timetable;
  }

  private findBestSlot(
    subject: Subject,
    availableStaff: Staff[],
    classrooms: Classroom[],
    usedSlots: Set<string>,
    staffWorkload: Map<string, number>,
    staffDailyHours: Map<string, Map<string, number>>,
    departmentId: string
  ): TimetableEntry | null {
    const availableTimeSlots = this.getAvailableTimeSlots();

    for (const day of this.daysOfWeek) {
      for (const timeSlot of availableTimeSlots) {
        // Check time slot constraints
        if (this.isTimeSlotConstrained(day, timeSlot)) continue;

        // Find available staff
        const selectedStaff = this.selectBestStaff(
          availableStaff,
          day,
          timeSlot,
          staffWorkload,
          staffDailyHours,
          usedSlots
        );

        if (!selectedStaff) continue;

        // Find available classroom
        const selectedClassroom = this.selectBestClassroom(
          classrooms,
          day,
          timeSlot,
          subject.is_lab,
          usedSlots
        );

        if (!selectedClassroom) continue;

        // Check all constraints
        if (this.violatesConstraints(selectedStaff, day, timeSlot, staffWorkload, staffDailyHours)) {
          continue;
        }

        return {
          day,
          time_slot: timeSlot,
          subject_id: subject.id,
          staff_id: selectedStaff.id,
          classroom_id: selectedClassroom.id,
          department_id: departmentId,
          is_lab_session: subject.is_lab,
          staff_count: subject.is_lab ? this.constraints.staffPerLabSession : 1
        };
      }
    }

    return null;
  }

  private getAvailableTimeSlots(): string[] {
    return this.timeSlots.filter(slot => {
      return !this.constraints.timeSlotConstraints.some(constraint => {
        // Simple constraint matching - can be enhanced
        return constraint.includes(slot);
      });
    });
  }

  private isTimeSlotConstrained(day: string, timeSlot: string): boolean {
    return this.constraints.timeSlotConstraints.some(constraint => {
      const constraintLower = constraint.toLowerCase();
      return constraintLower.includes(day.toLowerCase()) && 
             constraintLower.includes(timeSlot);
    });
  }

  private selectBestStaff(
    availableStaff: Staff[],
    day: string,
    timeSlot: string,
    staffWorkload: Map<string, number>,
    staffDailyHours: Map<string, Map<string, number>>,
    usedSlots: Set<string>
  ): Staff | null {
    const candidates = availableStaff.filter(staff => {
      const slotKey = `${staff.id}-${day}-${timeSlot}`;
      return !usedSlots.has(slotKey);
    });

    if (candidates.length === 0) return null;

    // Select staff with least workload
    return candidates.reduce((best, current) => {
      const bestWorkload = staffWorkload.get(best.id) || 0;
      const currentWorkload = staffWorkload.get(current.id) || 0;
      return currentWorkload < bestWorkload ? current : best;
    });
  }

  private selectBestClassroom(
    classrooms: Classroom[],
    day: string,
    timeSlot: string,
    isLab: boolean,
    usedSlots: Set<string>
  ): Classroom | null {
    const availableClassrooms = classrooms.filter(classroom => {
      const slotKey = `${classroom.id}-${day}-${timeSlot}`;
      return !usedSlots.has(slotKey);
    });

    if (availableClassrooms.length === 0) return null;

    // Prefer larger classrooms for labs
    if (isLab) {
      return availableClassrooms.reduce((best, current) => 
        current.capacity > best.capacity ? current : best
      );
    }

    return availableClassrooms[0];
  }

  private violatesConstraints(
    staff: Staff,
    day: string,
    timeSlot: string,
    staffWorkload: Map<string, number>,
    staffDailyHours: Map<string, Map<string, number>>
  ): boolean {
    const currentWorkload = staffWorkload.get(staff.id) || 0;
    const currentDailyHours = staffDailyHours.get(staff.id)?.get(day) || 0;

    // Check weekly workload
    if (currentWorkload >= this.constraints.maxHoursPerWeek) return true;

    // Check daily workload
    if (currentDailyHours >= this.constraints.maxHoursPerDay) return true;

    return false;
  }

  private updateTracking(
    assignment: TimetableEntry,
    usedSlots: Set<string>,
    staffWorkload: Map<string, number>,
    staffDailyHours: Map<string, Map<string, number>>
  ): void {
    // Mark slots as used
    usedSlots.add(`${assignment.staff_id}-${assignment.day}-${assignment.time_slot}`);
    usedSlots.add(`${assignment.classroom_id}-${assignment.day}-${assignment.time_slot}`);

    // Update workload tracking
    const currentWorkload = staffWorkload.get(assignment.staff_id) || 0;
    staffWorkload.set(assignment.staff_id, currentWorkload + 1);

    const dailyHours = staffDailyHours.get(assignment.staff_id)!;
    const currentDailyHours = dailyHours.get(assignment.day) || 0;
    dailyHours.set(assignment.day, currentDailyHours + 1);
  }

  private async validateAndResolveConflicts(timetable: TimetableEntry[]): Promise<TimetableEntry[]> {
    const validatedTimetable: TimetableEntry[] = [];

    for (const entry of timetable) {
      const conflict = await aiService.analyzeConflicts(entry, validatedTimetable, this.constraints);
      
      if (!conflict.hasConflict) {
        validatedTimetable.push(entry);
      } else {
        console.warn(`Conflict detected: ${conflict.reason}`);
        // Could implement conflict resolution logic here
      }
    }

    return validatedTimetable;
  }

  async saveTimetable(departmentId: string, timetable: TimetableEntry[]): Promise<void> {
    try {
      // Delete existing timetable
      await supabase
        .from('timetables')
        .delete()
        .eq('department_id', departmentId);

      // Insert new timetable
      const { error } = await supabase
        .from('timetables')
        .insert(timetable);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving timetable:', error);
      throw error;
    }
  }
}

export const enhancedTimetableGenerator = new EnhancedTimetableGenerator();