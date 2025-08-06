import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { parseStudentUpload } from '../handlers/parse_student_upload';

describe('parseStudentUpload', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should parse valid CSV content correctly', async () => {
    const csvContent = `student_id,full_name,class,grade_level
S001,John Doe,10A,10
S002,Jane Smith,10B,10
S003,Bob Johnson,11A,11`;

    const result = await parseStudentUpload(csvContent);

    expect(result.valid_rows).toHaveLength(3);
    expect(result.invalid_rows).toHaveLength(0);

    expect(result.valid_rows[0]).toEqual({
      student_id: 'S001',
      full_name: 'John Doe',
      class: '10A',
      grade_level: 10
    });

    expect(result.valid_rows[1]).toEqual({
      student_id: 'S002',
      full_name: 'Jane Smith',
      class: '10B',
      grade_level: 10
    });

    expect(result.valid_rows[2]).toEqual({
      student_id: 'S003',
      full_name: 'Bob Johnson',
      class: '11A',
      grade_level: 11
    });
  });

  it('should handle invalid grade_level values', async () => {
    const csvContent = `student_id,full_name,class,grade_level
S001,John Doe,10A,invalid_grade
S002,Jane Smith,10B,10`;

    const result = await parseStudentUpload(csvContent);

    expect(result.valid_rows).toHaveLength(1);
    expect(result.invalid_rows).toHaveLength(1);

    expect(result.valid_rows[0].student_id).toEqual('S002');
    expect(result.invalid_rows[0].row_number).toEqual(2);
    expect(result.invalid_rows[0].errors.length).toBeGreaterThan(0);
  });

  it('should handle missing required fields', async () => {
    const csvContent = `student_id,full_name,class,grade_level
S001,,10A,10
S002,Jane Smith,,10`;

    const result = await parseStudentUpload(csvContent);

    expect(result.valid_rows).toHaveLength(0);
    expect(result.invalid_rows).toHaveLength(2);

    // Both rows should be invalid due to empty required fields
    expect(result.invalid_rows[0].errors.length).toBeGreaterThan(0);
    expect(result.invalid_rows[1].errors.length).toBeGreaterThan(0);
  });

  it('should throw error for missing headers', async () => {
    const csvContent = `student_id,full_name,class
S001,John Doe,10A`;

    await expect(parseStudentUpload(csvContent)).rejects.toThrow(/Missing required columns/);
  });

  it('should handle empty file', async () => {
    const csvContent = '';

    await expect(parseStudentUpload(csvContent)).rejects.toThrow('File is empty');
  });

  it('should skip empty lines', async () => {
    const csvContent = `student_id,full_name,class,grade_level
S001,John Doe,10A,10

S002,Jane Smith,10B,10
`;

    const result = await parseStudentUpload(csvContent);

    expect(result.valid_rows).toHaveLength(2);
    expect(result.invalid_rows).toHaveLength(0);
  });
});