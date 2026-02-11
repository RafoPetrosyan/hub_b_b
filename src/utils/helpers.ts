import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export default class Helpers {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static validateWorkingHours(hours) {
    for (const h of hours) {
      if (h.open >= h.close) {
        throw new BadRequestException(
          `Open time must be before close time (${h.day})`,
        );
      }

      for (const b of h.breaks || []) {
        if (
          b.start < h.open ||
          b.end > h.close ||
          b.start >= b.end
        ) {
          throw new BadRequestException(
            `Invalid break time on ${h.day}`,
          );
        }
      }
    }
  }

  static isNumeric(str: string) {
    return /^\d+$/.test(str);
  };

  static flattenValidationErrors(validationErrors: ValidationError[] = []) {
    const result: Record<string, string> = {};

    function walk(errors: ValidationError[], parentPath = '') {
      for (const err of errors) {
        const prop = err.property ?? '';
        const path = parentPath
          ? (Helpers.isNumeric(prop) ? `${parentPath}[${prop}]` : `${parentPath}.${prop}`)
          : prop;

        if (err.constraints && Object.keys(err.constraints).length) {
          result[path] = Object.values(err.constraints)[0];
        }

        // If there are children, walk them (children may include array indices like '0','1' or nested properties)
        if (err.children && err.children.length) {
          walk(err.children, path);
        }
      }
    }

    walk(validationErrors, '');
    return result;
  }
}
