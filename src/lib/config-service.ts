import { supabase } from '@/integrations/supabase/client';
import { TimetableConstraints } from './ai-services';

export class ConfigService {
  async getConfig(): Promise<TimetableConstraints> {
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*');

      if (error) throw error;

      const config: TimetableConstraints = {
        maxHoursPerDay: 6,
        maxHoursPerWeek: 30,
        staffPerLabSession: 1,
        labHoursPerSubject: 3,
        maxSubjectsPerStaff: 4,
        timeSlotConstraints: [],
        holidaySchedule: [],
        customRules: []
      };

      // Parse config from database
      data?.forEach(item => {
        if (item.config_key in config) {
          (config as any)[item.config_key] = item.config_value;
        }
      });

      return config;
    } catch (error) {
      console.error('Error fetching config:', error);
      // Return default config
      return {
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
  }

  async updateConfig(updates: Partial<TimetableConstraints>): Promise<void> {
    try {
      const promises = Object.entries(updates).map(([key, value]) =>
        supabase
          .from('admin_config')
          .upsert({
            config_key: key,
            config_value: value,
            description: this.getConfigDescription(key),
            updated_at: new Date().toISOString()
          })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }

  async saveInstruction(instruction: string, configUpdates: any): Promise<void> {
    try {
      await supabase
        .from('ai_instructions')
        .insert({
          instruction,
          config_updates: configUpdates,
          processed: true,
          processed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving instruction:', error);
      throw error;
    }
  }

  private getConfigDescription(key: string): string {
    const descriptions: Record<string, string> = {
      maxHoursPerDay: 'Maximum teaching hours per day for staff members',
      maxHoursPerWeek: 'Maximum teaching hours per week for staff members',
      staffPerLabSession: 'Number of staff members required for lab sessions',
      labHoursPerSubject: 'Hours allocated for laboratory subjects',
      maxSubjectsPerStaff: 'Maximum number of subjects a staff member can teach',
      timeSlotConstraints: 'Time slots to avoid during scheduling',
      holidaySchedule: 'Dates marked as holidays',
      customRules: 'Custom scheduling rules and constraints'
    };
    return descriptions[key] || 'Configuration setting';
  }
}

export const configService = new ConfigService();