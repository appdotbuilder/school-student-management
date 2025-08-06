
import { db } from '../db';
import { violationsTable, studentsTable } from '../db/schema';
import { type Violation, type RecordFilter } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getViolations(filter?: RecordFilter): Promise<Violation[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    if (filter?.student_id) {
      conditions.push(eq(violationsTable.student_id, filter.student_id));
    }

    if (filter?.date_from) {
      conditions.push(gte(violationsTable.date, filter.date_from));
    }

    if (filter?.date_to) {
      conditions.push(lte(violationsTable.date, filter.date_to));
    }

    let results;
    
    if (filter?.class) {
      // Need to join with students table to filter by class
      conditions.push(eq(studentsTable.class, filter.class));
      
      const joinedQuery = db.select()
        .from(violationsTable)
        .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id));
      
      const finalQuery = conditions.length > 0 
        ? joinedQuery.where(and(...conditions))
        : joinedQuery;
        
      results = await finalQuery.execute();
      
      // Handle joined data structure
      return results.map(result => {
        const violationData = (result as any).violations;
        return {
          ...violationData,
          date: violationData.date instanceof Date ? violationData.date : new Date(violationData.date),
          created_at: violationData.created_at instanceof Date ? violationData.created_at : new Date(violationData.created_at),
          updated_at: violationData.updated_at instanceof Date ? violationData.updated_at : new Date(violationData.updated_at)
        };
      });
    } else {
      // Simple query without join
      const simpleQuery = db.select().from(violationsTable);
      
      const finalQuery = conditions.length > 0 
        ? simpleQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : simpleQuery;
        
      results = await finalQuery.execute();
      
      return results.map(violation => ({
        ...violation,
        date: violation.date instanceof Date ? violation.date : new Date(violation.date),
        created_at: violation.created_at instanceof Date ? violation.created_at : new Date(violation.created_at),
        updated_at: violation.updated_at instanceof Date ? violation.updated_at : new Date(violation.updated_at)
      }));
    }
  } catch (error) {
    console.error('Failed to get violations:', error);
    throw error;
  }
}

export async function getViolationsByStudent(studentId: number): Promise<Violation[]> {
  try {
    const results = await db.select()
      .from(violationsTable)
      .where(eq(violationsTable.student_id, studentId))
      .execute();

    return results.map(violation => ({
      ...violation,
      date: violation.date instanceof Date ? violation.date : new Date(violation.date),
      created_at: violation.created_at instanceof Date ? violation.created_at : new Date(violation.created_at),
      updated_at: violation.updated_at instanceof Date ? violation.updated_at : new Date(violation.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get violations by student:', error);
    throw error;
  }
}

export async function getViolationsByClass(className: string, filter?: RecordFilter): Promise<Violation[]> {
  try {
    const conditions: SQL<unknown>[] = [eq(studentsTable.class, className)];

    if (filter?.student_id) {
      conditions.push(eq(violationsTable.student_id, filter.student_id));
    }

    if (filter?.date_from) {
      conditions.push(gte(violationsTable.date, filter.date_from));
    }

    if (filter?.date_to) {
      conditions.push(lte(violationsTable.date, filter.date_to));
    }

    const results = await db.select()
      .from(violationsTable)
      .innerJoin(studentsTable, eq(violationsTable.student_id, studentsTable.id))
      .where(and(...conditions))
      .execute();

    return results.map(result => {
      const violationData = (result as any).violations;
      return {
        ...violationData,
        date: violationData.date instanceof Date ? violationData.date : new Date(violationData.date),
        created_at: violationData.created_at instanceof Date ? violationData.created_at : new Date(violationData.created_at),
        updated_at: violationData.updated_at instanceof Date ? violationData.updated_at : new Date(violationData.updated_at)
      };
    });
  } catch (error) {
    console.error('Failed to get violations by class:', error);
    throw error;
  }
}
