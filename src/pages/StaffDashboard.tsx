
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, BookOpen, Clock, LogOut, User } from 'lucide-react';
import { toast } from '../hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface TimetableEntry {
  id: string;
  day: string;
  time_slot: string;
  subjects: Subject;
  classrooms: {
    name: string;
  };
}

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubjectsLocked, setIsSubjectsLocked] = useState(false);

  useEffect(() => {
    if (user?.department_id) {
      fetchStaffData();
    }
  }, [user]);

  const fetchStaffData = async () => {
    try {
      // Fetch available subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('department_id', user!.department_id!)
        .order('name');

      if (subjectError) throw subjectError;

      // Fetch staff timetable
      const { data: timetableData, error: timetableError } = await supabase
        .from('timetables')
        .select(`
          *,
          subjects (id, name, code, credits),
          classrooms (name)
        `)
        .eq('staff_id', user!.id)
        .order('day, time_slot');

      if (timetableError) throw timetableError;

      // Get current user's selected subjects
      const currentSelectedSubjects = user?.subjects_selected || [];
      const isLocked = user?.subjects_locked || false;

      setSubjects(subjectData || []);
      setTimetable(timetableData || []);
      setSelectedSubjects(currentSelectedSubjects);
      setIsSubjectsLocked(isLocked);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelection = (subjectId: string) => {
    if (isSubjectsLocked) return;

    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const saveSubjectSelection = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subjects_selected: JSON.stringify(selectedSubjects)
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving subject selection:', error);
      toast({
        title: "Error",
        description: "Failed to save subject preferences",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-600">Faculty Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">
                {user?.staff_role?.replace('_', ' ').toUpperCase() || 'Staff Member'}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Preferences</CardTitle>
              <CardDescription>
                Select subjects you would like to teach
                {isSubjectsLocked && (
                  <Badge variant="destructive" className="ml-2">Locked</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => handleSubjectSelection(subject.id)}
                      disabled={isSubjectsLocked}
                      className="rounded border-gray-300"
                    />
                    <label 
                      htmlFor={subject.id} 
                      className={`flex-1 cursor-pointer ${isSubjectsLocked ? 'opacity-50' : ''}`}
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-sm text-gray-600">
                          {subject.code} • {subject.credits} Credits
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {!isSubjectsLocked && (
                <Button 
                  onClick={saveSubjectSelection} 
                  className="w-full mt-4"
                  disabled={selectedSubjects.length === 0}
                >
                  Save Preferences
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Current Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>Your current teaching timetable</CardDescription>
            </CardHeader>
            <CardContent>
              {timetable.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 p-2 bg-gray-50">Time</th>
                        {daysOfWeek.map(day => (
                          <th key={day} className="border border-gray-300 p-2 bg-gray-50">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(timeSlot => (
                        <tr key={timeSlot}>
                          <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                            {timeSlot}
                          </td>
                          {daysOfWeek.map(day => {
                            const entry = timetable.find(
                              t => t.day === day && t.time_slot === timeSlot
                            );
                            return (
                              <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                                {entry ? (
                                  <div className="text-sm">
                                    <p className="font-medium">{entry.subjects.code}</p>
                                    <p className="text-gray-600">{entry.classrooms.name}</p>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-center">-</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No timetable assigned yet</p>
                  <p className="text-sm">Your schedule will appear here once assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedSubjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Classes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timetable.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                <Badge variant={isSubjectsLocked ? "destructive" : "default"}>
                  {isSubjectsLocked ? "Locked" : "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
