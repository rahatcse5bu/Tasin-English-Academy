import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/** The eight divisions, so a typo cannot create a ninth. */
export const DIVISIONS = [
  'Barishal', 'Chattogram', 'Dhaka', 'Khulna',
  'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet',
];

/**
 * Admin creates a student account.
 *
 * Only name, email and password are required — an academy often enrols a
 * student with a phone number and fills the rest in later, and a form that
 * refuses to save until every box is full just gets worked around.
 */
export class CreateStudentDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString() @MinLength(6)
  password!: string;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() institution?: string;

  @IsOptional() @IsIn(['SSC', 'HSC', 'Other'])
  level?: string;

  @IsOptional() @IsString() session?: string;
  @IsOptional() @IsString() batchName?: string;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() guardianName?: string;
  @IsOptional() @IsString() guardianPhone?: string;

  @IsOptional() @IsIn(DIVISIONS)
  division?: string;

  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() upazila?: string;
  @IsOptional() @IsString() address?: string;

  /** batch ids to enrol into straight away */
  @IsOptional()
  batches?: string[];
}
