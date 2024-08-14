import csv from 'csv-parser';
import fs from 'fs';
import { Entries } from '../../controllers/types';

export class CsvService {
  // Reads csv file and returns promise of data structured in the generic passed
  readFile<T>(path: string, headers: string[]): Promise<T[]> {
    const csvData: T[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(path)
        .pipe(csv(headers))
        .on('data', (data) => csvData.push(data))
        .on('end', () => {
          resolve(csvData);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  /**
   * dynamically validates the csv data
   * @param csvData
   * @param validations - key value map where the value is a validation function
   * @param rowStartIndex - offsets the row/index to start validating data.
   * @returns - an array of valid data and errors.
   */
  validateData<T>(
    csvData: T[],
    validations: Record<keyof T, (value: T[keyof T]) => T[keyof T]>,
    rowStartIndex = 0
  ) {
    const splicedCsvData = csvData.splice(rowStartIndex);
    const validData = [];
    const errors: { [key: string]: T } = {};
    for (let i = 0; i < splicedCsvData.length; i++) {
      const row = splicedCsvData[i];
      const sanitisedRow: T = {} as T;
      const error: T = {} as T;
      for (const [key, value] of Object.entries(row) as Entries<T>) {
        try {
          const result = validations[key](value);
          sanitisedRow[key] = result;
        } catch (err) {
          error[key] = err.message;
        }
      }
      const hasErrors = !!Object.keys(error).length;
      if (hasErrors) {
        errors[`row ${i + rowStartIndex + 1}`] = error;
      } else {
        validData.push(sanitisedRow);
      }
    }
    return { validData, errors };
  }
}
