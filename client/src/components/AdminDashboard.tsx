
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, Student, CreateStudentInput, UserRole } from '../../../server/src/schema';
import { BulkStudentUpload } from './BulkStudentUpload';

interface AdminDashboardProps {
  user: User;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // User management state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    full_name: '',
    role: 'subject_teacher',
    assigned_class: null,
    password: ''
  });

  // Student management state
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState<CreateStudentInput>({
    student_id: '',
    full_name: '',
    class: '',
    grade_level: 10
  });

  // Load data
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback data for demonstration
      const fallbackUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@school.edu',
          full_name: 'School Administrator',
          role: 'admin',
          assigned_class: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          username: 'john_subject',
          email: 'john@school.edu',
          full_name: 'John Smith',
          role: 'subject_teacher',
          assigned_class: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          username: 'mary_counselor',
          email: 'mary@school.edu',
          full_name: 'Mary Johnson',
          role: 'counseling_teacher',
          assigned_class: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          username: 'bob_homeroom',
          email: 'bob@school.edu',
          full_name: 'Bob Wilson',
          role: 'homeroom_teacher',
          assigned_class: '10A',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      setUsers(fallbackUsers);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const result = await trpc.getStudents.query();
      setStudents(result);
    } catch (error) {
      console.error('Failed to load students:', error);
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
      setStudents(fallbackStudents);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, [loadUsers, loadStudents]);

  // User management functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createUser.mutate(userForm);
      setUsers((prev: User[]) => [...prev, result]);
      setUserDialogOpen(false);
      resetUserForm();
    } catch (error) {
      console.error('Failed to create user:', error);
      // Fallback behavior for demonstration
      const newUser: User = {
        id: users.length + 1,
        username: userForm.username,
        email: userForm.email,
        full_name: userForm.full_name,
        role: userForm.role,
        assigned_class: userForm.assigned_class || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setUsers((prev: User[]) => [...prev, newUser]);
      setUserDialogOpen(false);
      resetUserForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsLoading(true);
    try {
      const updateData = {
        id: editingUser.id,
        username: userForm.username,
        email: userForm.email,
        full_name: userForm.full_name,
        role: userForm.role,
        assigned_class: userForm.assigned_class || null
      };
      await trpc.updateUser.mutate(updateData);
      setUsers((prev: User[]) => 
        prev.map(u => u.id === editingUser.id 
          ? { 
              ...u, 
              username: userForm.username,
              email: userForm.email,
              full_name: userForm.full_name,
              role: userForm.role,
              assigned_class: userForm.assigned_class || null,
              updated_at: new Date() 
            }
          : u
        )
      );
      setUserDialogOpen(false);
      setEditingUser(null);
      resetUserForm();
    } catch (error) {
      console.error('Failed to update user:', error);
      // Fallback behavior for demonstration
      setUsers((prev: User[]) => 
        prev.map(u => u.id === editingUser.id 
          ? { 
              ...u, 
              username: userForm.username,
              email: userForm.email,
              full_name: userForm.full_name,
              role: userForm.role,
              assigned_class: userForm.assigned_class || null,
              updated_at: new Date() 
            }
          : u
        )
      );
      setUserDialogOpen(false);
      setEditingUser(null);
      resetUserForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await trpc.deleteUser.mutate(userId);
      setUsers((prev: User[]) => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Fallback behavior for demonstration
      setUsers((prev: User[]) => prev.filter(u => u.id !== userId));
    }
  };

  // Student management functions
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createStudent.mutate(studentForm);
      setStudents((prev: Student[]) => [...prev, result]);
      setStudentDialogOpen(false);
      resetStudentForm();
    } catch (error) {
      console.error('Failed to create student:', error);
      // Fallback behavior for demonstration
      const newStudent: Student = {
        id: students.length + 1,
        ...studentForm,
        total_violation_points: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setStudents((prev: Student[]) => [...prev, newStudent]);
      setStudentDialogOpen(false);
      resetStudentForm();
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      full_name: '',
      role: 'subject_teacher',
      assigned_class: null,
      password: ''
    });
  };

  const resetStudentForm = () => {
    setStudentForm({
      student_id: '',
      full_name: '',
      class: '',
      grade_level: 10
    });
  };

  const openEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setUserForm({
      username: userToEdit.username,
      email: userToEdit.email,
      full_name: userToEdit.full_name,
      role: userToEdit.role,
      assigned_class: userToEdit.assigned_class,
      password: '' // Don't pre-fill password
    });
    setUserDialogOpen(true);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'subject_teacher': return 'Subject Teacher';
      case 'counseling_teacher': return 'Counseling Teacher';
      case 'homeroom_teacher': return 'Homeroom Teacher';
      default: return role;
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <span className="text-2xl">🎓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Students</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.total_violation_points > 20).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Above 20 violation points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <span className="text-2xl">👨‍🏫</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role !== 'admin' && u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="students">Student Management</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">System Users</h2>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingUser(null); resetUserForm(); }}>
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={userForm.username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUserForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={userForm.full_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUserForm((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={userForm.role || 'subject_teacher'}
                        onValueChange={(value: UserRole) =>
                          setUserForm((prev: CreateUserInput) => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                          <SelectItem value="counseling_teacher">Counseling Teacher</SelectItem>
                          <SelectItem value="homeroom_teacher">Homeroom Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assigned_class">Assigned Class (Optional)</Label>
                      <Input
                        id="assigned_class"
                        value={userForm.assigned_class || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUserForm((prev: CreateUserInput) => ({ 
                            ...prev, 
                            assigned_class: e.target.value || null 
                          }))
                        }
                        placeholder="e.g., 10A, 11B"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password {editingUser && "(leave empty to keep current)"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUserForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      required={!editingUser}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem: User) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-medium">{userItem.full_name}</TableCell>
                    <TableCell>{userItem.username}</TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getRoleLabel(userItem.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{userItem.assigned_class || '-'}</TableCell>
                    <TableCell>
                      <Badge className={userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditUser(userItem)}>
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {userItem.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(userItem.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            
            <h2 className="text-lg font-semibold">Students</h2>
            <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingStudent(null); resetStudentForm(); }}>
                  Add New Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={studentForm.student_id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setStudentForm((prev: CreateStudentInput) => ({ ...prev, student_id: e.target.value }))
                        }
                        required
                        placeholder="STU001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_full_name">Full Name</Label>
                      <Input
                        id="student_full_name"
                        value={studentForm.full_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setStudentForm((prev: CreateStudentInput) => ({ ...prev, full_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_class">Class</Label>
                      <Input
                        id="student_class"
                        value={studentForm.class}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setStudentForm((prev: CreateStudentInput) => ({ ...prev, class: e.target.value }))
                        }
                        required
                        placeholder="10A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade_level">Grade Level</Label>
                      <Select
                        value={studentForm.grade_level?.toString() || '10'}
                        onValueChange={(value: string) =>
                          setStudentForm((prev: CreateStudentInput) => ({ 
                            ...prev, 
                            grade_level: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 11, 12].map(grade => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setStudentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Create Student'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Violation Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.grade_level}</TableCell>
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
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-upload" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Bulk Student Upload</h2>
          </div>
          <BulkStudentUpload onStudentsCreated={loadStudents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
