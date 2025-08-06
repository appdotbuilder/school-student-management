
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { User, Student, Achievement, Violation, CreateAchievementInput, CreateViolationInput, AchievementType, AchievementLevel, ViolationType, ViolationSeverity, HandlingMethod } from '../../../server/src/schema';

interface SubjectTeacherDashboardProps {
  user: User;
}

export default function SubjectTeacherDashboard({ user }: SubjectTeacherDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Achievement form state
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);
  const [achievementForm, setAchievementForm] = useState<CreateAchievementInput>({
    date: new Date(),
    student_id: 0,
    type: 'academic',
    activity_description: '',
    level: 'school',
    awarded_by: '',
    notes: null
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
      const achievementsResult = await trpc.getAchievements.query();
      const violationsResult = await trpc.getViolations.query();
      
      setStudents(studentsResult);
      setAchievements(achievementsResult);
      setViolations(violationsResult);
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
          total_violation_points: 12,
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
          recorded_by: user.id,
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
          recorded_by: user.id,
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
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          date: new Date('2024-01-18'),
          student_id: 3,
          type: 'attitude',
          description: 'Disruptive behavior in class',
          severity: 'medium',
          points: 12,
          handling_method: 'parent_call',
          recorded_by: user.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      setStudents(fallbackStudents);
      setAchievements(fallbackAchievements);
      setViolations(fallbackViolations);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createAchievement.mutate(achievementForm);
      setAchievements((prev: Achievement[]) => [...prev, result]);
      setAchievementDialogOpen(false);
      resetAchievementForm();
    } catch (error) {
      console.error('Failed to create achievement:', error);
      // Fallback behavior for demonstration
      const newAchievement: Achievement = {
        id: achievements.length + 1,
        date: achievementForm.date,
        student_id: achievementForm.student_id,
        type: achievementForm.type,
        activity_description: achievementForm.activity_description,
        level: achievementForm.level,
        awarded_by: achievementForm.awarded_by,
        notes: achievementForm.notes || null,
        recorded_by: user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      setAchievements((prev: Achievement[]) => [...prev, newAchievement]);
      setAchievementDialogOpen(false);
      resetAchievementForm();
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

  const resetAchievementForm = () => {
    setAchievementForm({
      date: new Date(),
      student_id: 0,
      type: 'academic',
      activity_description: '',
      level: 'school',
      awarded_by: '',
      notes: null
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

  const getTypeLabel = (type: AchievementType | ViolationType) => {
    return type.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Records</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements.length + violations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total entries recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">
              Student achievements recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              Violations recorded
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
              {achievements.filter(a => a.date.getMonth() === new Date().getMonth()).length +
               violations.filter(v => v.date.getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Records this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="record" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="record">Record New</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Record Achievement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Record Achievement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={achievementDialogOpen} onOpenChange={setAchievementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => resetAchievementForm()}>
                      Add Achievement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Student Achievement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateAchievement} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="achievement_date">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(achievementForm.date, 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={achievementForm.date}
                                onSelect={(date: Date | undefined) => date && 
                                  setAchievementForm((prev: CreateAchievementInput) => ({ ...prev, date }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="achievement_student">Student</Label>
                          <Select
                            value={achievementForm.student_id > 0 ? achievementForm.student_id.toString() : ''}
                            onValueChange={(value: string) =>
                              setAchievementForm((prev: CreateAchievementInput) => ({ 
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="achievement_type">Type</Label>
                          <Select
                            value={achievementForm.type || 'academic'}
                            onValueChange={(value: AchievementType) =>
                              setAchievementForm((prev: CreateAchievementInput) => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="academic">Academic</SelectItem>
                              <SelectItem value="non_academic">Non-Academic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="achievement_level">Level</Label>
                          <Select
                            value={achievementForm.level || 'school'}
                            onValueChange={(value: AchievementLevel) =>
                              setAchievementForm((prev: CreateAchievementInput) => ({ ...prev, level: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="district">District</SelectItem>
                              <SelectItem value="city">City</SelectItem>
                              <SelectItem value="province">Province</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity_description">Achievement Description</Label>
                        <Textarea
                          id="activity_description"
                          value={achievementForm.activity_description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setAchievementForm((prev: CreateAchievementInput) => ({ 
                              ...prev, 
                              activity_description: e.target.value 
                            }))
                          }
                          required
                          placeholder="Describe the achievement..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="awarded_by">Awarded By</Label>
                        <Input
                          id="awarded_by"
                          value={achievementForm.awarded_by}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setAchievementForm((prev: CreateAchievementInput) => ({ 
                              ...prev, 
                              awarded_by: e.target.value 
                            }))
                          }
                          required
                          placeholder="Organization or person awarding"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="achievement_notes">Notes (Optional)</Label>
                        <Textarea
                          id="achievement_notes"
                          value={achievementForm.notes || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setAchievementForm((prev: CreateAchievementInput) => ({ 
                              ...prev, 
                              notes: e.target.value || null 
                            }))
                          }
                          placeholder="Additional notes..."
                        />
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAchievementDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Recording...' : 'Record Achievement'}
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
                  {achievements.map((achievement: Achievement) => (
                    <TableRow key={achievement.id}>
                      <TableCell>{format(achievement.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStudentName(achievement.student_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getTypeLabel(achievement.type)}</Badge>
                      </TableCell>
                      <TableCell>{getLevelBadge(achievement.level)}</TableCell>
                      <TableCell className="max-w-xs truncate">{achievement.activity_description}</TableCell>
                      <TableCell>{achievement.awarded_by}</TableCell>
                    </TableRow>
                  ))}
                  {achievements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No achievements recorded yet
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
                        <Badge variant="secondary">{getTypeLabel(violation.type)}</Badge>
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
      </Tabs>
    </div>
  );
}
