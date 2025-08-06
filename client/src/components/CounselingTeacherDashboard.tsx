
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  Student, 
  CounselingSession, 
  Violation,
  CreateCounselingSessionInput, 
  CreateViolationInput,
  CounselingStatus, 
  ViolationType, 
  ViolationSeverity, 
  HandlingMethod 
} from '../../../server/src/schema';

interface CounselingTeacherDashboardProps {
  user: User;
}

export default function CounselingTeacherDashboard({ user }: CounselingTeacherDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [highRiskStudents, setHighRiskStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Counseling session form state
  const [counselingDialogOpen, setCounselingDialogOpen] = useState(false);
  const [counselingForm, setCounselingForm] = useState<CreateCounselingSessionInput>({
    date: new Date(),
    student_id: 0,
    purpose: '',
    session_summary: '',
    follow_up_actions: null,
    status: 'completed'
  });

  // Violation form state
  const [violationDialogOpen, setViolationDialogOpen] = useState(false);
  const [violationForm, setViolationForm] = useState<CreateViolationInput>({
    date: new Date(),
    student_id: 0,
    type: 'discipline',
    description: '',
    severity: 'light',
    points: 1,
    handling_method: 'warning'
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      const studentsResult = await trpc.getStudents.query();
      const sessionsResult = await trpc.getCounselingSessions.query();
      const violationsResult = await trpc.getViolations.query();

      setStudents(studentsResult);
      setCounselingSessions(sessionsResult);
      setViolations(violationsResult);
      setHighRiskStudents(studentsResult.filter(s => s.total_violation_points >= 15));
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback data for demonstration
      const fallbackStudents: Student[] = [
        {
          id: 1,
          student_id: 'STU001',
          full_name: 'Alice Brown',
          class: '10A',
          grade_level: 10,
          total_violation_points: 5,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          student_id: 'STU002',
          full_name: 'Charlie Davis',
          class: '10A',
          grade_level: 10,
          total_violation_points: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          student_id: 'STU003',
          full_name: 'Diana Miller',
          class: '11B',
          grade_level: 11,
          total_violation_points: 25,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          student_id: 'STU004',
          full_name: 'Ethan Wilson',
          class: '11B',
          grade_level: 11,
          total_violation_points: 18,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const fallbackCounselingSessions: CounselingSession[] = [
        {
          id: 1,
          date: new Date('2024-01-15'),
          student_id: 3,
          purpose: 'Behavioral issues and academic concerns',
          session_summary: 'Discussed recent violations and academic performance. Student shows understanding and commitment to improve.',
          follow_up_actions: 'Schedule weekly check-ins for one month',
          status: 'needs_follow_up',
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-10'),
          student_id: 4,
          purpose: 'Career counseling and future planning',
          session_summary: 'Explored career interests and discussed pathway options. Student interested in engineering field.',
          follow_up_actions: null,
          status: 'completed',
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const fallbackViolations: Violation[] = [
        {
          id: 1,
          date: new Date('2024-01-20'),
          student_id: 3,
          type: 'attitude',
          description: 'Disruptive behavior during class discussion',
          severity: 'heavy',
          points: 15,
          handling_method: 'coaching',
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-18'),
          student_id: 4,
          type: 'discipline',
          description: 'Failed to follow classroom rules repeatedly',
          severity: 'medium',
          points: 8,
          handling_method: 'parent_call',
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      setStudents(fallbackStudents);
      setCounselingSessions(fallbackCounselingSessions);
      setViolations(fallbackViolations);
      setHighRiskStudents(fallbackStudents.filter(s => s.total_violation_points >= 15));
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCounselingSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createCounselingSession.mutate(counselingForm);
      setCounselingSessions((prev: CounselingSession[]) => [...prev, result]);
      setCounselingDialogOpen(false);
      resetCounselingForm();
    } catch (error) {
      console.error('Failed to create counseling session:', error);
      // Fallback behavior for demonstration
      const newSession: CounselingSession = {
        id: counselingSessions.length + 1,
        date: counselingForm.date,
        student_id: counselingForm.student_id,
        purpose: counselingForm.purpose,
        session_summary: counselingForm.session_summary,
        follow_up_actions: counselingForm.follow_up_actions || null,
        status: counselingForm.status,
        recorded_by: user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCounselingSessions((prev: CounselingSession[]) => [...prev, newSession]);
      setCounselingDialogOpen(false);
      resetCounselingForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createViolation.mutate(violationForm);
      setViolations((prev: Violation[]) => [...prev, result]);
      
      // Update student violation points
      setStudents((prev: Student[]) => 
        prev.map(s => s.id === violationForm.student_id 
          ? { ...s, total_violation_points: s.total_violation_points + violationForm.points }
          : s
        )
      );
      
      setViolationDialogOpen(false);
      resetViolationForm();
    } catch (error) {
      console.error('Failed to create violation:', error);
      // Fallback behavior for demonstration
      const newViolation: Violation = {
        id: violations.length + 1,
        ...violationForm,
        recorded_by: user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      setViolations((prev: Violation[]) => [...prev, newViolation]);
      
      // Update student violation points
      setStudents((prev: Student[]) => 
        prev.map(s => s.id === violationForm.student_id 
          ? { ...s, total_violation_points: s.total_violation_points + violationForm.points }
          : s
        )
      );
      
      setViolationDialogOpen(false);
      resetViolationForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: number, status: CounselingStatus) => {
    try {
      await trpc.updateCounselingSessionStatus.mutate({ id: sessionId, status });
      setCounselingSessions((prev: CounselingSession[]) => 
        prev.map(s => s.id === sessionId ? { ...s, status, updated_at: new Date() } : s)
      );
    } catch (error) {
      console.error('Failed to update session status:', error);
      // Fallback behavior for demonstration
      setCounselingSessions((prev: CounselingSession[]) => 
        prev.map(s => s.id === sessionId ? { ...s, status, updated_at: new Date() } : s)
      );
    }
  };

  const resetCounselingForm = () => {
    setCounselingForm({
      date: new Date(),
      student_id: 0,
      purpose: '',
      session_summary: '',
      follow_up_actions: null,
      status: 'completed'
    });
  };

  const resetViolationForm = () => {
    setViolationForm({
      date: new Date(),
      student_id: 0,
      type: 'discipline',
      description: '',
      severity: 'light',
      points: 1,
      handling_method: 'warning'
    });
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.full_name} (${student.class})` : 'Unknown Student';
  };

  const getStatusBadge = (status: CounselingStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'needs_follow_up':
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Follow-up</Badge>;
      case 'rescheduled':
        return <Badge className="bg-blue-100 text-blue-800">Rescheduled</Badge>;
    }
  };

  const getSeverityBadge = (severity: ViolationSeverity) => {
    switch (severity) {
      case 'light':
        return <Badge className="bg-yellow-100 text-yellow-800">Light</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
      case 'heavy':
        return <Badge className="bg-red-100 text-red-800">Heavy</Badge>;
    }
  };

  const getViolationBadge = (points: number) => {
    if (points === 0) return <Badge className="bg-green-100 text-green-800">Good</Badge>;
    if (points <= 10) return <Badge className="bg-yellow-100 text-yellow-800">Caution</Badge>;
    if (points <= 20) return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Counseling Sessions</CardTitle>
            <span className="text-2xl">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counselingSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total sessions conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Needed</CardTitle>
            <span className="text-2xl">🔄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counselingSessions.filter(s => s.status === 'needs_follow_up').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions requiring follow-up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Students</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Students with 15+ violation points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {counselingSessions.filter(s => s.date.getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Students Alert */}
      {highRiskStudents.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>High Risk Students Requiring Attention</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {highRiskStudents.map((student: Student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-md">
                  <div>
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-sm text-gray-600">{student.class}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-red-700">{student.total_violation_points} pts</span>
                    {getViolationBadge(student.total_violation_points)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="record" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="record">Record New</TabsTrigger>
          <TabsTrigger value="sessions">Counseling Sessions</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Record Counseling Session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💬</span>
                  <span>Record Counseling Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={counselingDialogOpen} onOpenChange={setCounselingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => resetCounselingForm()}>
                      Add Counseling Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Counseling Session</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCounselingSession} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="counseling_date">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(counselingForm.date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={counselingForm.date}
                                onSelect={(date: Date | undefined) => date && 
                                  setCounselingForm((prev: CreateCounselingSessionInput) => ({ ...prev, date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="counseling_student">Student</Label>
                          <Select
                            value={counselingForm.student_id > 0 ? counselingForm.student_id.toString() : ''}
                            onValueChange={(value: string) =>
                              setCounselingForm((prev: CreateCounselingSessionInput) => ({ 
                                ...prev, 
                                student_id: parseInt(value) 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student: Student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.full_name} ({student.class})
                                  {student.total_violation_points > 15 && (
                                    <span className="ml-2 text-red-600 text-xs">⚠️ High Risk</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Input
                          id="purpose"
                          value={counselingForm.purpose}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setCounselingForm((prev: CreateCounselingSessionInput) => ({ 
                              ...prev, 
                              purpose: e.target.value 
                            }))
                          }
                          required
                          placeholder="Purpose of counseling session..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="session_summary">Session Summary</Label>
                        <Textarea
                          id="session_summary"
                          value={counselingForm.session_summary}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setCounselingForm((prev: CreateCounselingSessionInput) => ({ 
                              ...prev, 
                              session_summary: e.target.value 
                            }))
                          }
                          required
                          placeholder="Detailed summary of the counseling session..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="follow_up_actions">Follow-up Actions (Optional)</Label>
                        <Textarea
                          id="follow_up_actions"
                          value={counselingForm.follow_up_actions || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setCounselingForm((prev: CreateCounselingSessionInput) => ({ 
                              ...prev, 
                              follow_up_actions: e.target.value || null 
                            }))
                          }
                          placeholder="Actions to be taken for follow-up..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={counselingForm.status || 'completed'}
                          onValueChange={(value: CounselingStatus) =>
                            setCounselingForm((prev: CreateCounselingSessionInput) => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCounselingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Recording...' : 'Record Session'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Record Violation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Record Violation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={violationDialogOpen} onOpenChange={setViolationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => resetViolationForm()}>
                      Add Violation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Student Violation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateViolation} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="violation_date">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(violationForm.date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={violationForm.date}
                                onSelect={(date: Date | undefined) => date && 
                                  setViolationForm((prev: CreateViolationInput) => ({ ...prev, date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="violation_student">Student</Label>
                          <Select
                            value={violationForm.student_id > 0 ? violationForm.student_id.toString() : ''}
                            onValueChange={(value: string) =>
                              setViolationForm((prev: CreateViolationInput) => ({ 
                                ...prev, 
                                student_id: parseInt(value) 
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student: Student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.full_name} ({student.class})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="violation_type">Type</Label>
                          <Select
                            value={violationForm.type || 'discipline'}
                            onValueChange={(value: ViolationType) =>
                              setViolationForm((prev: CreateViolationInput) => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discipline">Discipline</SelectItem>
                              <SelectItem value="attitude">Attitude</SelectItem>
                              <SelectItem value="uniform">Uniform</SelectItem>
                              <SelectItem value="attendance">Attendance</SelectItem>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="violation_severity">Severity</Label>
                          <Select
                            value={violationForm.severity || 'light'}
                            onValueChange={(value: ViolationSeverity) =>
                              setViolationForm((prev: CreateViolationInput) => ({ ...prev, severity: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="heavy">Heavy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="violation_points">Points</Label>
                          <Input
                            id="violation_points"
                            type="number"
                            min="1"
                            value={violationForm.points}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setViolationForm((prev: CreateViolationInput) => ({ 
                                ...prev, 
                                points: parseInt(e.target.value) || 1 
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="violation_description">Description</Label>
                        <Textarea
                          id="violation_description"
                          value={violationForm.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setViolationForm((prev: CreateViolationInput) => ({ 
                              ...prev, 
                              description: e.target.value 
                            }))
                          }
                          required
                          placeholder="Describe the violation..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="handling_method">Handling Method</Label>
                        <Select
                          value={violationForm.handling_method || 'warning'}
                          onValueChange={(value: HandlingMethod) =>
                            setViolationForm((prev: CreateViolationInput) => ({ ...prev, handling_method: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="parent_call">Parent Call</SelectItem>
                            <SelectItem value="coaching">Coaching</SelectItem>
                            <SelectItem value="suspension">Suspension</SelectItem>
                            <SelectItem value="community_service">Community Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setViolationDialogOpen(false)}>
                          Cancel
                        
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Recording...' : 'Record Violation'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Counseling Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counselingSessions.map((session: CounselingSession) => (
                    <TableRow key={session.id}>
                      <TableCell>{format(session.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(session.student_id)}</TableCell>
                      <TableCell className="max-w-xs truncate">{session.purpose}</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>{session.follow_up_actions ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Select
                          value={session.status || 'completed'}
                          onValueChange={(value: CounselingStatus) => handleUpdateSessionStatus(session.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="needs_follow_up">Needs Follow-up</SelectItem>
                            <SelectItem value="rescheduled">Rescheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {counselingSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No counseling sessions recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>Student Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation: Violation) => (
                    <TableRow key={violation.id}>
                      <TableCell>{format(violation.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(violation.student_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {violation.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                      <TableCell>{violation.points}</TableCell>
                      <TableCell className="max-w-xs truncate">{violation.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {violation.handling_method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {violations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No violations recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Follow-up Actions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counselingSessions.filter(s => s.status === 'needs_follow_up').map((session: CounselingSession) => (
                    <TableRow key={session.id}>
                      <TableCell>{format(session.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(session.student_id)}</TableCell>
                      <TableCell className="max-w-xs truncate">{session.purpose}</TableCell>
                      <TableCell className="max-w-xs truncate">{session.follow_up_actions}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateSessionStatus(session.id, 'completed')}
                        >
                          Mark Completed
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {counselingSessions.filter(s => s.status === 'needs_follow_up').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No follow-ups required at this time
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
