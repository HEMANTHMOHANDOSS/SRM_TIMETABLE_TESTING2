import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Users, Calendar, Zap, Shield, Database, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  code: string;
}

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data || []);
      }
      setLoadingDepts(false);
    };

    fetchDepartments();
  }, []);

  // Redirect authenticated users to their appropriate dashboard
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'main_admin':
        return <Navigate to="/main-admin" replace />;
      case 'dept_admin':
        return <Navigate to="/dept-admin" replace />;
      case 'staff':
        return <Navigate to="/staff" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SRM Timetable AI</h1>
              <p className="text-sm text-gray-600">SRM College Ramapuram</p>
            </div>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Login
            </Button>
            <Button onClick={() => window.location.href = '/register'}>
              Register
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Timetable Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Revolutionize academic scheduling with intelligent automation, 
            conflict resolution, and seamless department management for SRM College Ramapuram.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/register'}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful AI Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Gemini Pro Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Natural language processing for intuitive timetable configuration and intelligent decision making
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Groq Ultra-Fast AI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Lightning-fast conflict detection and real-time timetable optimization with detailed explanations
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Smart Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Dynamic constraint management with natural language instructions and automated policy updates
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Intelligent Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered conflict resolution, workload balancing, and automated lab session management
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Secure & Scalable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enterprise-grade security with Supabase authentication and role-based access control
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Database className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <CardTitle>Export & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive export options (CSV, PDF) with detailed analytics and performance insights
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Available Departments
          </h2>
          {loadingDepts ? (
            <p className="text-center text-gray-500">Loading departments...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{dept.name}</h3>
                    <p className="text-gray-600">Code: {dept.code}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI Technology Stack */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Advanced AI Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Cutting-Edge AI Integration</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                  <span><strong>Gemini Pro:</strong> Natural language understanding for configuration</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                  <span><strong>Groq API:</strong> Ultra-fast reasoning and conflict detection</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                  <span><strong>React + TypeScript:</strong> Modern, type-safe frontend</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
                  <span><strong>Supabase:</strong> Real-time database and authentication</span>
                </li>
                <li className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                  <span><strong>AI Optimization:</strong> Constraint satisfaction algorithms</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">AI-Powered Benefits</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ Natural language configuration</li>
                <li>✅ Real-time conflict detection</li>
                <li>✅ Intelligent workload distribution</li>
                <li>✅ Automated lab session management</li>
                <li>✅ Dynamic constraint adaptation</li>
                <li>✅ Explainable AI decisions</li>
                <li>✅ Multi-department isolation</li>
                <li>✅ Mobile-responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <GraduationCap className="h-6 w-6" />
            <span className="font-semibold">SRM Timetable AI</span>
          </div>
          <p className="text-gray-400">
            © 2024 SRM College Ramapuram. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by Gemini Pro, Groq AI, and Supabase
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;