import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Brain, Clock, Users, BookOpen, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { configService } from '@/lib/config-service';
import { aiService, TimetableConstraints } from '@/lib/ai-services';

export const AdminConfigPanel = () => {
  const [config, setConfig] = useState<TimetableConstraints>({
    maxHoursPerDay: 6,
    maxHoursPerWeek: 30,
    staffPerLabSession: 1,
    labHoursPerSubject: 3,
    maxSubjectsPerStaff: 4,
    timeSlotConstraints: [],
    holidaySchedule: [],
    customRules: []
  });
  
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await configService.getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    }
  };

  const handleConfigChange = (key: keyof TimetableConstraints, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await configService.updateConfig(config);
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const processNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;

    setIsProcessing(true);
    try {
      const updates = await aiService.processNaturalLanguageInstruction(naturalLanguageInput);
      
      if (Object.keys(updates).length > 0) {
        setConfig(prev => ({ ...prev, ...updates }));
        await configService.saveInstruction(naturalLanguageInput, updates);
        
        toast({
          title: "AI Processing Complete",
          description: `Updated ${Object.keys(updates).length} configuration(s)`,
        });
        
        setNaturalLanguageInput('');
      } else {
        toast({
          title: "No Updates",
          description: "The instruction didn't match any configuration settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      toast({
        title: "Error",
        description: "Failed to process instruction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addTimeSlotConstraint = () => {
    const newConstraint = prompt('Enter time slot constraint (e.g., "Friday 14:00-17:00"):');
    if (newConstraint) {
      handleConfigChange('timeSlotConstraints', [...config.timeSlotConstraints, newConstraint]);
    }
  };

  const removeTimeSlotConstraint = (index: number) => {
    const updated = config.timeSlotConstraints.filter((_, i) => i !== index);
    handleConfigChange('timeSlotConstraints', updated);
  };

  const addHoliday = () => {
    const newHoliday = prompt('Enter holiday date (YYYY-MM-DD):');
    if (newHoliday) {
      handleConfigChange('holidaySchedule', [...config.holidaySchedule, newHoliday]);
    }
  };

  const removeHoliday = (index: number) => {
    const updated = config.holidaySchedule.filter((_, i) => i !== index);
    handleConfigChange('holidaySchedule', updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Natural Language Configuration
          </CardTitle>
          <CardDescription>
            Use natural language to configure timetable constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-input">Natural Language Instruction</Label>
              <Textarea
                id="ai-input"
                placeholder="e.g., 'Allocate 2 staff members for every lab session' or 'Avoid scheduling labs on Friday afternoons'"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={processNaturalLanguage}
              disabled={isProcessing || !naturalLanguageInput.trim()}
            >
              {isProcessing ? 'Processing...' : 'Process Instruction'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="constraints">Time Constraints</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxHoursPerDay">Max Hours Per Day</Label>
                  <Input
                    id="maxHoursPerDay"
                    type="number"
                    value={config.maxHoursPerDay}
                    onChange={(e) => handleConfigChange('maxHoursPerDay', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxHoursPerWeek">Max Hours Per Week</Label>
                  <Input
                    id="maxHoursPerWeek"
                    type="number"
                    value={config.maxHoursPerWeek}
                    onChange={(e) => handleConfigChange('maxHoursPerWeek', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="staffPerLabSession">Staff Per Lab Session</Label>
                  <Input
                    id="staffPerLabSession"
                    type="number"
                    value={config.staffPerLabSession}
                    onChange={(e) => handleConfigChange('staffPerLabSession', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSubjectsPerStaff">Max Subjects Per Staff</Label>
                  <Input
                    id="maxSubjectsPerStaff"
                    type="number"
                    value={config.maxSubjectsPerStaff}
                    onChange={(e) => handleConfigChange('maxSubjectsPerStaff', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subject Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="labHoursPerSubject">Lab Hours Per Subject</Label>
                  <Input
                    id="labHoursPerSubject"
                    type="number"
                    value={config.labHoursPerSubject}
                    onChange={(e) => handleConfigChange('labHoursPerSubject', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="constraints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Slot Constraints</CardTitle>
              <CardDescription>
                Define time slots to avoid during scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={addTimeSlotConstraint} variant="outline">
                  Add Time Constraint
                </Button>
                <div className="flex flex-wrap gap-2">
                  {config.timeSlotConstraints.map((constraint, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTimeSlotConstraint(index)}
                    >
                      {constraint} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Holiday Schedule
              </CardTitle>
              <CardDescription>
                Manage holiday dates for timetable planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={addHoliday} variant="outline">
                  Add Holiday
                </Button>
                <div className="flex flex-wrap gap-2">
                  {config.holidaySchedule.map((holiday, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeHoliday(index)}
                    >
                      {holiday} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Rules</CardTitle>
              <CardDescription>
                Advanced configuration and custom scheduling rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter custom rules (one per line)"
                  value={config.customRules.join('\n')}
                  onChange={(e) => handleConfigChange('customRules', e.target.value.split('\n').filter(rule => rule.trim()))}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={isSaving}>
          <Settings className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};