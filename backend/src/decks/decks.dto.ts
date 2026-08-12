import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const ACCENTS = ['navy', 'teal', 'amber', 'rose', 'violet'];

/**
 * Move one chapter to a different unit / lesson.
 * Every field is optional — only what is sent gets changed.
 */
export class PlacementDto {
  /** e.g. "Unit 09", "Extra 01", "Part A" */
  @IsOptional() @IsString() @IsNotEmpty()
  unitNo?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  unitName?: string;

  @IsOptional() @IsString()
  unitNameBn?: string;

  @IsOptional() @IsString()
  unitEm?: string;

  @IsOptional() @IsIn(ACCENTS)
  unitAccent?: string;

  @IsOptional() @IsInt() @Min(0)
  unitOrder?: number;

  /** lesson within the unit; send null to clear it */
  @IsOptional() @IsInt() @Min(1) @Max(99)
  lessonNo?: number | null;

  @IsOptional() @IsString()
  lessonName?: string;

  /** position of this chapter inside its lesson */
  @IsOptional() @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsBoolean()
  isPublished?: boolean;
}

/** Rename or renumber a whole unit — all of its chapters move together. */
export class UnitDto {
  @IsString() @IsNotEmpty()
  paperId!: string;

  /** the unit as it is now — used to find the chapters */
  @IsString() @IsNotEmpty()
  unitNo!: string;

  @IsString() @IsNotEmpty()
  unitName!: string;

  @IsOptional() @IsString() @IsNotEmpty()
  newNo?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  newName?: string;

  @IsOptional() @IsString()
  nameBn?: string;

  @IsOptional() @IsString()
  em?: string;

  @IsOptional() @IsIn(ACCENTS)
  accent?: string;
}
