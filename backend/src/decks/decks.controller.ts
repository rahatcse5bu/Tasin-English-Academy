import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { DecksService } from './decks.service';
import { ContentDto, PlacementDto, ShareDto, UnitDto } from './decks.dto';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../common/guards';

/**
 * Slide-deck API.
 *
 * These decks are what a mentor projects in class, answers and all, so by
 * default only `teacher` and `admin` may read them. A student sees a chapter
 * only after a mentor shares it, and then only the sections that were shared —
 * with the answers stripped out server-side unless the share says otherwise.
 * Every read below therefore passes the caller's role down to the service.
 *
 * Routes (global prefix `api`):
 *   GET /api/decks                → library: papers → units → chapters
 *   GET /api/decks/index          → flat chapter list (search / prerender)
 *   GET   /api/decks/units          → the units that exist (for the editor)
 *   GET   /api/decks/:id            → one chapter's full teaching content
 *   GET   /api/decks/:id/neighbours → previous / next chapter in the same paper
 *   PATCH /api/decks/unit           → rename / renumber a whole unit
 *   PATCH /api/decks/:id/placement  → move one chapter to another unit or lesson
 *   PATCH /api/decks/:id/content    → edit its passage, questions, tables and summary
 *   PATCH /api/decks/:id/share      → open a chapter to students, in part or whole
 *   PATCH /api/decks/:id/visible    → hide a chapter from the class list, or show it
 *   PATCH /api/decks/:id/restore    → undo a removal
 *   DELETE /api/decks/:id           → remove a chapter (soft, so it can come back)
 *
 * The two PATCH routes are how a mentor corrects the syllabus mapping (e.g.
 * "Adolescence is Unit 09, not Unit 03") without a redeploy. Editing sets
 * `placementLocked`, so the next `npm run seed` refreshes the teaching content
 * but leaves the correction in place.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher', 'student')
@Controller('decks')
export class DecksController {
  constructor(private service: DecksService) {}

  @Get()
  catalogue(@CurrentUser() user: any, @Query('deleted') deleted?: string) {
    const student = user?.role === 'student';
    // ?deleted=1 lists the removed chapters so they can be restored
    return this.service.catalogue(!student && deleted === '1', student);
  }

  @Get('index')
  index(@CurrentUser() user: any) {
    return this.service.index(user?.role === 'student');
  }

  @Get('units')
  @Roles('admin', 'teacher')
  units() {
    return this.service.units();
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.get(id, user?.role === 'student');
  }

  @Get(':id/neighbours')
  neighbours(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.neighbours(id, user?.role === 'student');
  }

  /** Rename or renumber an entire unit — all its chapters move together. */
  @Patch('unit')
  @Roles('admin', 'teacher')
  setUnit(@Body() dto: UnitDto) {
    return this.service.setUnit(dto);
  }

  /** Move a single chapter into another unit / lesson. */
  @Patch(':id/placement')
  @Roles('admin', 'teacher')
  setPlacement(@Param('id') id: string, @Body() dto: PlacementDto) {
    return this.service.setPlacement(id, dto);
  }

  /** Add or edit the questions, table and summary a mentor maintains. */
  @Patch(':id/content')
  @Roles('admin', 'teacher')
  setContent(@Param('id') id: string, @Body() dto: ContentDto) {
    return this.service.setContent(id, dto);
  }

  /** Hide a chapter from the class list without losing it. */
  @Patch(':id/visible')
  @Roles('admin', 'teacher')
  setVisible(@Param('id') id: string, @Body() body: { isPublished: boolean }) {
    return this.service.setVisible(id, body.isPublished !== false);
  }

  @Patch(':id/restore')
  @Roles('admin', 'teacher')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  /** Open a chapter to students — chosen sections, answers optional. */
  @Patch(':id/share')
  @Roles('admin', 'teacher')
  setShare(@Param('id') id: string, @Body() dto: ShareDto, @CurrentUser() user: any) {
    return this.service.setShare(id, dto, user?.email);
  }
}
