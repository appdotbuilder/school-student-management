import { studentUploadRowSchema, type StudentUploadPreview, type StudentUploadRow } from '../schema';

interface ParsedRow {
  rowNumber: number;
  data: Record<string, unknown>;
}

export const parseStudentUpload = async (fileContent: string): Promise<StudentUploadPreview> => {
  try {
    // Parse CSV content
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('File is empty');
    }

    // Get headers from first line
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['student_id', 'full_name', 'class', 'grade_level'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const validRows: StudentUploadRow[] = [];
    const invalidRows: Array<{
      row_number: number;
      data: Record<string, unknown>;
      errors: string[];
    }> = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      
      // Skip empty lines
      if (values.every(value => !value)) {
        continue;
      }

      const rowData: Record<string, unknown> = {};
      const errors: string[] = [];

      // Map values to headers
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header === 'grade_level') {
          const numValue = parseInt(value);
          if (isNaN(numValue)) {
            rowData[header] = value;
            errors.push(`Grade level must be a number, got: ${value}`);
          } else {
            rowData[header] = numValue;
          }
        } else {
          rowData[header] = value;
        }
      });

      // Validate the row
      try {
        const validatedRow = studentUploadRowSchema.parse(rowData);
        validRows.push(validatedRow);
      } catch (validationError: any) {
        // Extract specific field errors from Zod
        if (validationError.errors) {
          validationError.errors.forEach((err: any) => {
            errors.push(`${err.path.join('.')}: ${err.message}`);
          });
        } else {
          errors.push('Invalid data format');
        }
        
        invalidRows.push({
          row_number: i + 1,
          data: rowData,
          errors
        });
      }
    }

    return {
      valid_rows: validRows,
      invalid_rows: invalidRows
    };
  } catch (error) {
    console.error('Student upload parsing failed:', error);
    throw error;
  }
};