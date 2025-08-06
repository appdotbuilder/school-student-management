
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { User, UserRole } from '../../server/src/schema';

// Import role-specific dashboard components
import AdminDashboard from '@/components/AdminDashboard';
import SubjectTeacherDashboard from '@/components/SubjectTeacherDashboard';
import CounselingTeacherDashboard from '@/components/CounselingTeacherDashboard';
import HomeroomTeacherDashboard from '@/components/HomeroomTeacherDashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // In a real implementation, this would validate the token with the server
      // For demonstration purposes, we'll create a user based on the token
      const stubUser: User = {
        id: 1,
        username: 'admin',
        email: 'admin@school.edu',
        full_name: 'Administrator',
        role: 'admin' as UserRole,
        assigned_class: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setUser(stubUser);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call: const result = await trpc.login.mutate(loginForm);
      // For demonstration purposes, we'll create different user types based on username
      
      let demoUser: User;
      switch (loginForm.username) {
        case 'admin':
          demoUser = {
            id: 1,
            username: 'admin',
            email: 'admin@school.edu',
            full_name: 'School Administrator',
            role: 'admin' as UserRole,
            assigned_class: null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
          break;
        case 'subject':
          demoUser = {
            id: 2,
            username: 'subject',
            email: 'subject@school.edu',
            full_name: 'Subject Teacher',
            role: 'subject_teacher' as UserRole,
            assigned_class: null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
          break;
        case 'counselor':
          demoUser = {
            id: 3,
            username: 'counselor',
            email: 'counselor@school.edu',
            full_name: 'Counseling Teacher',
            role: 'counseling_teacher' as UserRole,
            assigned_class: null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
          break;
        case 'homeroom':
          demoUser = {
            id: 4,
            username: 'homeroom',
            email: 'homeroom@school.edu',
            full_name: 'Homeroom Teacher',
            role: 'homeroom_teacher' as UserRole,
            assigned_class: '10A',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
          break;
        default:
          throw new Error('Invalid username. Try: admin, subject, counselor, or homeroom');
      }

      // Store authentication token
      localStorage.setItem('authToken', 'demo_token_' + demoUser.username);
      setUser(demoUser);
      
      // Reset form
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setError(null);
  };

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'bg-red-100 text-red-800' };
      case 'subject_teacher':
        return { label: 'Subject Teacher', color: 'bg-blue-100 text-blue-800' };
      case 'counseling_teacher':
        return { label: 'Counseling Teacher', color: 'bg-green-100 text-green-800' };
      case 'homeroom_teacher':
        return { label: 'Homeroom Teacher', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'subject_teacher':
        return <SubjectTeacherDashboard user={user} />;
      case 'counseling_teacher':
        return <CounselingTeacherDashboard user={user} />;
      case 'homeroom_teacher':
        return <HomeroomTeacherDashboard user={user} />;
      default:
        return <div className="text-center py-8">Invalid user role</div>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              🏫 School Management System
            </CardTitle>
            <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginForm(prev => ({ ...prev, username: e.target.value }))
                  }
                  required
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginForm(prev => ({ ...prev, password: e.target.value }))
                  }
                  required
                  placeholder="Enter your password"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <Separator className="my-6" />
            
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-semibold">Demo Accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">admin</p>
                  <p className="text-xs">Administrator</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">subject</p>
                  <p className="text-xs">Subject Teacher</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">counselor</p>
                  <p className="text-xs">Counselor</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium">homeroom</p>
                  <p className="text-xs">Homeroom Teacher</p>
                </div>
              </div>
              <p className="text-xs text-center mt-2">Use any password for demo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleDisplay = getRoleDisplay(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                🏫 School Management System
              </h1>
              <Badge className={roleDisplay.color}>
                {roleDisplay.label}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.full_name}</p>
                {user.assigned_class && (
                  <p className="text-sm text-gray-600">Class: {user.assigned_class}</p>
                )}
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default App;
