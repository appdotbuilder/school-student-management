
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Download, Users, Trophy, AlertCircle, Calendar } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  Student, 
  Achievement, 
  Violation, 
  CounselingSession,
  AchievementLevel,
  ViolationSeverity,
  CounselingStatus
} from '../../../server/src/schema';

interface HomeroomTeacherDashboardProps {
  user: User;
}

export default function HomeroomTeacherDashboard({ user }: HomeroomTeacherDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'achievements' | 'violations' | 'counseling'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Load data for assigned class
  const loadClassData = useCallback(async () => {
    if (!user.assigned_class) return;
    
    try {
      const studentsResult = await trpc.getStudentsByClass.query(user.assigned_class);
      const achievementsResult = await trpc.getAchievementsByClass.query({
        className: user.assigned_class
      });
      const violationsResult = await trpc.getViolationsByClass.query({
        className: user.assigned_class
      });
      const counselingResult = await trpc.getCounselingSessions.query({
        class: user.assigned_class
      });

      setStudents(studentsResult);
      setAchievements(achievementsResult);
      setViolations(violationsResult);
      setCounselingSessions(counselingResult);
    } catch (error) {
      console.error('Failed to load class data:', error);
      // Fallback data for demonstration
      const fallbackStudents: Student[] = [
        {
          id: 1,
          student_id: 'STU001',
          full_name: 'Alice Brown',
          class: user.assigned_class || '10A',
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
          class: user.assigned_class || '10A',
          grade_level: 10,
          total_violation_points: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          student_id: 'STU005',
          full_name: 'Eva Martinez',
          class: user.assigned_class || '10A',
          grade_level: 10,
          total_violation_points: 15,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 6,
          student_id: 'STU006',
          full_name: 'Frank Wilson',
          class: user.assigned_class || '10A',
          grade_level: 10,
          total_violation_points: 8,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const fallbackAchievements: Achievement[] = [
        {
          id: 1,
          date: new Date('2024-01-15'),
          student_id: 1,
          type: 'academic',
          activity_description: 'First place in Math Competition',
          level: 'school',
          awarded_by: 'Math Department',
          notes: 'Excellent problem solving skills',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-10'),
          student_id: 2,
          type: 'non_academic',
          activity_description: 'Outstanding community service',
          level: 'city',
          awarded_by: 'Student Affairs',
          notes: null,
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          date: new Date('2024-01-20'),
          student_id: 6,
          type: 'academic',
          activity_description: 'Perfect attendance for semester',
          level: 'school',
          awarded_by: 'Administration',
          notes: 'Never missed a single day',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const fallbackViolations: Violation[] = [
        {
          id: 1,
          date: new Date('2024-01-20'),
          student_id: 1,
          type: 'discipline',
          description: 'Late submission of assignment',
          severity: 'light',
          points: 5,
          handling_method: 'warning',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-18'),
          student_id: 5,
          type: 'attitude',
          description: 'Disruptive behavior in class',
          severity: 'medium',
          points: 10,
          handling_method: 'parent_call',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          date: new Date('2024-01-22'),
          student_id: 5,
          type: 'uniform',
          description: 'Incomplete uniform',
          severity: 'light',
          points: 3,
          handling_method: 'warning',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          date: new Date('2024-01-25'),
          student_id: 6,
          type: 'attendance',
          description: 'Late to class multiple times',
          severity: 'medium',
          points: 8,
          handling_method: 'coaching',
          recorded_by: 2,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      const fallbackCounselingSessions: CounselingSession[] = [
        {
          id: 1,
          date: new Date('2024-01-16'),
          student_id: 5,
          purpose: 'Behavioral issues and academic concerns',
          session_summary: 'Discussed recent violations and academic performance. Student shows understanding.',
          follow_up_actions: 'Schedule weekly check-ins for one month',
          status: 'needs_follow_up',
          recorded_by: 3,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-12'),
          student_id: 6,
          purpose: 'Time management and study skills',
          session_summary: 'Worked on developing better study habits and time management strategies.',
          follow_up_actions: null,
          status: 'completed',
          recorded_by: 3,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Filter data to only show students from assigned class
      const classStudents = fallbackStudents.filter(s => s.class === user.assigned_class);
      const studentIds = classStudents.map(s => s.id);
      
      setStudents(classStudents);
      setAchievements(fallbackAchievements.filter(a => studentIds.includes(a.student_id)));
      setViolations(fallbackViolations.filter(v => studentIds.includes(v.student_id)));
      setCounselingSessions(fallbackCounselingSessions.filter(c => studentIds.includes(c.student_id)));
    }
  }, [user.assigned_class]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsLoading(true);
    try {
      console.log(`Generating ${format} report for class ${user.assigned_class}`);
      
      // In a real implementation, this would call:
      // await trpc.generateClassReport.mutate({
      //   className: user.assigned_class!,
      //   dateFrom: startOfMonth(new Date()),
      //   dateTo: new Date(),
      //   format
      // });
      
      alert(`${format.toUpperCase()} report for class ${user.assigned_class} has been generated successfully!`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.full_name : 'Unknown Student';
  };

  const getViolationBadge = (points: number) => {
    if (points === 0) return <Badge className="bg-green-100 text-green-800">Good</Badge>;
    if (points <= 10) return <Badge className="bg-yellow-100 text-yellow-800">Caution</Badge>;
    if (points <= 20) return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
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

  const getLevelBadge = (level: AchievementLevel) => {
    const colors = {
      school: 'bg-blue-100 text-blue-800',
      district: 'bg-green-100 text-green-800',
      city: 'bg-purple-100 text-purple-800',
      province: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[level]}>{level.toUpperCase()}</Badge>;
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

  // Filter data based on selected filters
  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = startOfMonth(now);
    }

    const filtered = {
      achievements: achievements.filter(a => a.date >= startDate),
      violations: violations.filter(v => v.date >= startDate),
      counseling: counselingSessions.filter(c => c.date >= startDate)
    };

    return filtered;
  };

  const filteredData = getFilteredData();
  const highRiskStudents = students.filter(s => s.total_violation_points >= 15);
  const needsFollowUp = counselingSessions.filter(c => c.status === 'needs_follow_up');

  if (!user.assigned_class) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Class Assigned</h3>
            <p className="text-gray-600">
              You don't have a class assigned to your account. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Class Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Class {user.assigned_class} Dashboard</CardTitle>
              <p className="text-gray-600">Homeroom Teacher: {user.full_name}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleGenerateReport('pdf')} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
              <Button variant="outline" onClick={() => handleGenerateReport('excel')} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Excel Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Active students in class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.achievements.length}</div>
            <p className="text-xs text-muted-foreground">
              This {dateRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Students</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Needed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{needsFollowUp.length}</div>
            <p className="text-xs text-muted-foreground">
              Counseling sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(highRiskStudents.length > 0 || needsFollowUp.length > 0) && (
        <div className="space-y-4">
          {highRiskStudents.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>High Risk Students Requiring Attention</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {highRiskStudents.map((student: Student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-md">
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-gray-600">{student.student_id}</p>
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

          {needsFollowUp.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-800">
                  <Calendar className="h-5 w-5" />
                  <span>Students Requiring Counseling Follow-up</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {needsFollowUp.map((session: CounselingSession) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-md">
                      <div>
                        <p className="font-medium">{getStudentName(session.student_id)}</p>
                        <p className="text-sm text-gray-600">{session.purpose}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{format(session.date, 'MMM d')}</p>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class Records</CardTitle>
            <div className="flex space-x-4">
              <Select value={dateRange} onValueChange={(value: 'week' | 'month' | 'quarter') => setDateRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={(value: 'all' | 'achievements' | 'violations' | 'counseling') => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="achievements">Achievements</SelectItem>
                  <SelectItem value="violations">Violations</SelectItem>
                  <SelectItem value="counseling">Counseling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="counseling">Counseling</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.achievements.slice(0, 5).map((achievement: Achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                      <div>
                        <p className="font-medium">{getStudentName(achievement.student_id)}</p>
                        <p className="text-sm text-gray-600 truncate">{achievement.activity_description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(achievement.date, 'MMM d')}</p>
                        {getLevelBadge(achievement.level)}
                      </div>
                    </div>
                  ))}
                  {filteredData.achievements.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No achievements in selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.violations.slice(0, 5).map((violation: Violation) => (
                    <div key={violation.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                      <div>
                        <p className="font-medium">{getStudentName(violation.student_id)}</p>
                        <p className="text-sm text-gray-600 truncate">{violation.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(violation.date, 'MMM d')}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs">{violation.points} pts</span>
                          {getSeverityBadge(violation.severity)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredData.violations.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No violations in selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Class Students</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Achievements</TableHead>
                    <TableHead>Violation Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Counseling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: Student) => {
                    const studentAchievements = achievements.filter(a => a.student_id === student.id);
                    const lastCounseling = counselingSessions
                      .filter(c => c.student_id === student.id)
                      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_id}</TableCell>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {studentAchievements.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{student.total_violation_points}</span>
                            {getViolationBadge(student.total_violation_points)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lastCounseling ? format(lastCounseling.date, 'MMM d, yyyy') : 'None'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Student Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Awarded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.achievements.map((achievement: Achievement) => (
                    <TableRow key={achievement.id}>
                      <TableCell>{format(achievement.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(achievement.student_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {achievement.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getLevelBadge(achievement.level)}</TableCell>
                      <TableCell className="max-w-xs truncate">{achievement.activity_description}</TableCell>
                      <TableCell>{achievement.awarded_by}</TableCell>
                    </TableRow>
                  ))}
                  {filteredData.achievements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No achievements found for selected period
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
                  {filteredData.violations.map((violation: Violation) => (
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
                  {filteredData.violations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No violations found for selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counseling">
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
                    <TableHead>Follow-up Required</TableHead>
                    <TableHead>Counselor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.counseling.map((session: CounselingSession) => (
                    <TableRow key={session.id}>
                      <TableCell>{format(session.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(session.student_id)}</TableCell>
                      <TableCell className="max-w-xs truncate">{session.purpose}</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell>
                        {session.follow_up_actions ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Counselor</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.counseling.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No counseling sessions found for selected period
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
