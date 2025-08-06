import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useRef } from 'react';
import type { StudentUploadPreview, BulkCreateStudentsInput } from '../../../server/src/schema';

interface BulkStudentUploadProps {
  onStudentsCreated?: () => void;
}

export function BulkStudentUpload({ onStudentsCreated }: BulkStudentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<StudentUploadPreview | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        alert('Please select a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
      setPreviewData(null);
      setUploadComplete(false);
    }
  };

  const parseFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // For CSV files, return content directly
        if (file.name.endsWith('.csv')) {
          resolve(content);
          return;
        }
        
        // For Excel files, we'll need to convert to CSV format
        // For now, we'll just handle CSV files
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          reject(new Error('Excel files are not yet supported. Please convert to CSV format.'));
          return;
        }
        
        resolve(content);
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const content = await parseFile(file);
      const preview = await trpc.parseStudentUpload.mutate(content);
      setPreviewData(preview);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to parse file. Please check the format and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData || previewData.valid_rows.length === 0) return;

    setIsCreating(true);
    try {
      const input: BulkCreateStudentsInput = {
        students: previewData.valid_rows
      };
      
      const result = await trpc.bulkCreateStudents.mutate(input);
      
      if (result.successful.length > 0) {
        setUploadComplete(true);
        // Reset form
        setFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Show results
        const successCount = result.successful.length;
        const failCount = result.failed.length;
        const message = `Successfully created ${successCount} students.${
          failCount > 0 ? ` ${failCount} students failed to create due to duplicates or errors.` : ''
        }`;
        alert(message);
        
        // Notify parent component to refresh student list
        if (onStudentsCreated) {
          onStudentsCreated();
        }
      }
    } catch (error) {
      console.error('Bulk creation failed:', error);
      alert('Failed to create students. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📤 Bulk Student Upload</CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple students at once. The file should contain columns: 
            student_id, full_name, class, and grade_level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <div className="text-sm text-gray-500">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </div>
          </div>

          {file && !previewData && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">📄 {file.name}</span>
              <Button 
                onClick={handleFileUpload} 
                disabled={isUploading}
                size="sm"
              >
                {isUploading ? 'Processing...' : 'Parse File'}
              </Button>
            </div>
          )}

          {uploadComplete && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">
                ✅ Students have been successfully uploaded to the system!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Upload Preview</CardTitle>
            <CardDescription>
              Review the parsed data before confirming the upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="valid" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="valid">
                  Valid Records ({previewData.valid_rows.length})
                </TabsTrigger>
                <TabsTrigger value="invalid">
                  Invalid Records ({previewData.invalid_rows.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="valid" className="space-y-4">
                {previewData.valid_rows.length > 0 ? (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Grade Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.valid_rows.slice(0, 10).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{row.student_id}</TableCell>
                              <TableCell>{row.full_name}</TableCell>
                              <TableCell>{row.class}</TableCell>
                              <TableCell>{row.grade_level}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {previewData.valid_rows.length > 10 && (
                      <div className="text-sm text-gray-500 text-center">
                        ... and {previewData.valid_rows.length - 10} more rows
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {previewData.valid_rows.length} students ready to be created
                      </Badge>
                      <Button 
                        onClick={handleConfirmUpload} 
                        disabled={isCreating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isCreating ? 'Creating Students...' : 'Confirm Upload'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No valid records found. Please check your file format and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="invalid" className="space-y-4">
                {previewData.invalid_rows.length > 0 ? (
                  <div className="space-y-2">
                    {previewData.invalid_rows.map((row, index) => (
                      <Card key={index} className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="destructive">Row {row.row_number}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div><strong>Student ID:</strong> {(row.data.student_id as string) || 'N/A'}</div>
                            <div><strong>Full Name:</strong> {(row.data.full_name as string) || 'N/A'}</div>
                            <div><strong>Class:</strong> {(row.data.class as string) || 'N/A'}</div>
                            <div><strong>Grade Level:</strong> {row.data.grade_level?.toString() || 'N/A'}</div>
                          </div>
                          <div className="text-red-700">
                            <strong>Errors:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {row.errors.map((error, errorIndex) => (
                                <li key={errorIndex} className="text-sm">{error}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-700">
                      🎉 All records are valid! No errors found.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">📚 Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>Required CSV columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>student_id</code> - Unique identifier for the student</li>
              <li><code>full_name</code> - Student's full name</li>
              <li><code>class</code> - Class name (e.g., "10A", "11B")</li>
              <li><code>grade_level</code> - Grade level as number (1-12)</li>
            </ul>
            <p className="pt-2"><strong>Example CSV content:</strong></p>
            <pre className="bg-white p-2 rounded border text-xs">
student_id,full_name,class,grade_level{'\n'}
S001,John Doe,10A,10{'\n'}
S002,Jane Smith,10B,10{'\n'}
S003,Bob Johnson,11A,11
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}